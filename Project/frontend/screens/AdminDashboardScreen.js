import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import api from '../services/api';
import ChatUI from '../components/ChatUI';

const { width: SW } = Dimensions.get('window');

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  navy: '#003580',
  navyLight: '#1a4a9f',
  gold: '#febb02',
  green: '#00b386',
  red: '#e53935',
  orange: '#ff7043',
  purple: '#7c4dff',
  bg: '#f0f4f8',
  card: '#ffffff',
  text: '#1a2340',
  sub: '#6b7c93',
  border: '#e0e8f5',
};

// ─── Tiny bar chart (pure RN, no deps) ───────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.bookings), 1);
  const BAR_W = Math.min(38, (SW - 80) / data.length - 6);
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => {
        const pct = d.bookings / max;
        return (
          <View key={i} style={bc.col}>
            <Text style={bc.val}>{d.bookings}</Text>
            <View style={[bc.barOuter, { width: BAR_W }]}>
              <View style={[bc.bar, { height: Math.max(4, pct * 100), backgroundColor: i === data.length - 1 ? C.gold : C.navy }]} />
            </View>
            <Text style={bc.label}>{d.month}</Text>
          </View>
        );
      })}
    </View>
  );
};
const bc = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 },
  col: { alignItems: 'center' },
  val: { fontSize: 10, color: C.sub, marginBottom: 4, fontWeight: '700' },
  barOuter: { height: 100, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, width: '100%' },
  label: { fontSize: 10, color: C.sub, marginTop: 6, fontWeight: '600' },
});

// ─── Donut ring (pure RN) ─────────────────────────────────────────────────────
const DonutRing = ({ segments, size = 90 }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 14;
  let arcs = [];
  let cumAngle = -90;
  segments.forEach((seg, i) => {
    const angle = (seg.value / total) * 360;
    arcs.push({ ...seg, startAngle: cumAngle, angle });
    cumAngle += angle;
  });

  const polarToCart = (cx, cy, r, angle) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {arcs.map((arc, i) => {
          const start = polarToCart(cx, cy, r, arc.startAngle);
          const end = polarToCart(cx, cy, r, arc.startAngle + arc.angle - 1);
          const large = arc.angle > 180 ? 1 : 0;
          return (
            <Path
              key={i}
              d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
              stroke={arc.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon, onPress }) => (
  <TouchableOpacity style={[s.statCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
    <View style={s.statCardTop}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
    <Text style={s.statLabel}>{label}</Text>
    {sub ? <Text style={s.statSub}>{sub}</Text> : null}
  </TouchableOpacity>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHead = ({ title, sub }) => (
  <View style={s.sectionHead}>
    <Text style={s.sectionTitle}>{title}</Text>
    {sub ? <Text style={s.sectionSub}>{sub}</Text> : null}
  </View>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { bg: '#e8f5e9', text: '#2e7d32', label: 'Confirmed' },
    success: { bg: '#e8f5e9', text: '#2e7d32', label: 'Confirmed' },
    pending_verification: { bg: '#fff8e1', text: '#f57f17', label: 'Pending Verification' },
    pending: { bg: '#fce4ec', text: '#c62828', label: 'Pending' },
    pending_payment: { bg: '#fce4ec', text: '#c62828', label: 'Pending Payment' },
    cancelled: { bg: '#f3e5f5', text: '#6a1b9a', label: 'Cancelled' },
    rejected: { bg: '#ffebee', text: '#b71c1c', label: 'Rejected' },
  };
  const style = map[status] || { bg: '#eee', text: '#555', label: status };
  return (
    <View style={[s.badge, { backgroundColor: style.bg }]}>
      <Text style={[s.badgeText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const AdminDashboardScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('[Dashboard] load error:', err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  if (loading) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={s.splashText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.splash}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
        <Text style={[s.splashText, { color: C.red }]}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); loadDashboard(); }}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  const { overview, revenue, facilities, tickets, users, monthlyData, recentBookings } = data;
  const growth = overview.growthRate;
  const growthPositive = growth >= 0;

  const fmtCurrency = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.navy]} />}
      >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Admin Panel</Text>
          <Text style={s.headerTitle}>Business Dashboard</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.navigate('AdminBookingList')}>
            <Text style={s.headerBtnText}>📋 Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.headerBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 6 }]} onPress={() => navigation.navigate('AdminTicketList')}>
            <Text style={s.headerBtnText}>🎫 Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── REVENUE HERO ───────────────────────────────────────────── */}
      <View style={s.revenueHero}>
        <View style={s.revenueHeroLeft}>
          <Text style={s.revenueLabel}>Total Confirmed Revenue</Text>
          <Text style={s.revenueValue}>{fmtCurrency(revenue.totalRevenue)}</Text>
          <Text style={s.revenueMonth}>This month: {fmtCurrency(revenue.thisMonthRevenue)}</Text>
        </View>
        <View style={s.growthBox}>
          <Text style={[s.growthNum, { color: growthPositive ? C.green : C.red }]}>
            {growthPositive ? '▲' : '▼'} {Math.abs(growth)}%
          </Text>
          <Text style={s.growthLabel}>vs last month</Text>
        </View>
      </View>

      {/* ── OVERVIEW STATS GRID ─────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="📊 Bookings Overview" sub="All time & this month" />
        <View style={s.statGrid}>
          <StatCard icon="📦" label="Total Bookings" value={overview.totalBookings} color={C.navy} />
          <StatCard icon="📅" label="This Month" value={overview.thisMonthBookings} color={C.navyLight}
            sub={`Last month: ${overview.lastMonthBookings}`} />
          <StatCard icon="✅" label="Confirmed" value={overview.confirmedBookings} color={C.green} />
          <StatCard icon="⏳" label="Pending Verify" value={overview.pendingVerifications} color={C.orange}
            onPress={() => navigation.navigate('AdminBookingList')} />
          <StatCard icon="❌" label="Cancelled" value={overview.cancelledBookings} color={C.red} />
          <StatCard icon="👥" label="Total Users" value={users.totalUsers} color={C.purple} />
        </View>
      </View>

      {/* ── FACILITY BREAKDOWN ──────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="🏟️ Facility Performance" sub="Bookings per facility type" />

        {/* Facility cards */}
        <View style={s.facilityRow}>
          <View style={[s.facilityCard, { borderColor: C.navy }]}>
            <Text style={s.facilityIcon}>🏨</Text>
            <Text style={s.facilityCount}>{facilities.roomBookings}</Text>
            <Text style={s.facilityType}>Rooms</Text>
            <Text style={s.facilityTotal}>{facilities.totalRooms} listed</Text>
          </View>
          <View style={[s.facilityCard, { borderColor: C.green }]}>
            <Text style={s.facilityIcon}>⚽</Text>
            <Text style={[s.facilityCount, { color: C.green }]}>{facilities.courtBookings}</Text>
            <Text style={s.facilityType}>Courts</Text>
            <Text style={s.facilityTotal}>{facilities.totalCourts} listed</Text>
          </View>
          <View style={[s.facilityCard, { borderColor: C.gold }]}>
            <Text style={s.facilityIcon}>🏊</Text>
            <Text style={[s.facilityCount, { color: '#b58900' }]}>{facilities.poolBookings}</Text>
            <Text style={s.facilityType}>Pools</Text>
            <Text style={s.facilityTotal}>{facilities.totalPools} listed</Text>
          </View>
        </View>

        {/* Most / Least booked */}
        <View style={s.rankRow}>
          <View style={[s.rankCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={s.rankLabel}>🏆 Most Booked</Text>
            <Text style={[s.rankType, { color: C.green }]}>{facilities.mostBooked?.type}</Text>
            <Text style={s.rankCount}>{facilities.mostBooked?.count} bookings</Text>
          </View>
          <View style={[s.rankCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={s.rankLabel}>📉 Needs Attention</Text>
            <Text style={[s.rankType, { color: C.orange }]}>{facilities.leastBooked?.type}</Text>
            <Text style={s.rankCount}>{facilities.leastBooked?.count} bookings</Text>
          </View>
        </View>
      </View>

      {/* ── MONTHLY CHART ───────────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="📈 Monthly Bookings" sub="Last 6 months — pull to refresh" />
        <View style={s.card}>
          {monthlyData && monthlyData.length > 0
            ? <BarChart data={monthlyData} />
            : <Text style={s.noData}>No monthly data available</Text>
          }
          <View style={s.chartLegend}>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.navy }]} /><Text style={s.legendText}>Previous months</Text></View>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.gold }]} /><Text style={s.legendText}>Current month</Text></View>
          </View>
        </View>
      </View>

      {/* ── MONTHLY REVENUE TABLE ────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="💰 Monthly Revenue" sub="Confirmed bookings only" />
        <View style={s.card}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableHCell, { flex: 1.2 }]}>Month</Text>
            <Text style={[s.tableCell, s.tableHCell]}>Bookings</Text>
            <Text style={[s.tableCell, s.tableHCell, { flex: 2 }]}>Revenue</Text>
          </View>
          {monthlyData?.map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
              <Text style={[s.tableCell, { flex: 1.2 }]}>{row.month} {row.year}</Text>
              <Text style={s.tableCell}>{row.bookings}</Text>
              <Text style={[s.tableCell, { flex: 2, color: C.navy, fontWeight: '700' }]}>{fmtCurrency(row.revenue)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── SUPPORT TICKETS ─────────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="🎫 Support & Issues" />
        <View style={s.statGrid}>
          <StatCard icon="📬" label="Total Tickets" value={tickets.totalTickets} color={C.navy} />
          <StatCard icon="🔴" label="Open Issues" value={tickets.openTickets} color={C.red}
            sub="Needs attention" onPress={() => navigation.navigate('AdminTicketList')} />
          <StatCard icon="💸" label="Refund Requests" value={tickets.refundTickets} color={C.orange} />
          <StatCard icon="✅" label="Resolved" value={tickets.totalTickets - tickets.openTickets - tickets.refundTickets} color={C.green} />
        </View>
      </View>

      {/* ── RECENT BOOKINGS ─────────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="🕐 Recent Bookings" sub="Latest 5 bookings" />
        <View style={s.card}>
          {recentBookings?.length === 0
            ? <Text style={s.noData}>No bookings yet</Text>
            : recentBookings?.map((b, i) => (
              <View key={b._id} style={[s.recentRow, i < recentBookings.length - 1 && s.recentBorder]}>
                <View style={s.recentLeft}>
                  <Text style={s.recentType}>{b.bookingType === 'room' ? '🏨' : b.bookingType === 'court' ? '⚽' : '🏊'} {b.bookingType.charAt(0).toUpperCase() + b.bookingType.slice(1)}</Text>
                  <Text style={s.recentUser}>{b.userName}</Text>
                  <Text style={s.recentDate}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={s.recentRight}>
                  <Text style={s.recentAmount}>{fmtCurrency(b.totalAmount)}</Text>
                  <StatusBadge status={b.status} />
                </View>
              </View>
            ))
          }
          <TouchableOpacity style={s.viewAllBtn} onPress={() => navigation.navigate('AdminBookingList')}>
            <Text style={s.viewAllText}>View all bookings →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── QUICK INSIGHT TIPS ──────────────────────────────────────── */}
      <View style={s.section}>
        <SectionHead title="💡 Business Insights" />
        <View style={s.insightCard}>
          <Text style={s.insightItem}>
            {growthPositive
              ? `✅ Booking growth is up ${growth}% compared to last month. Great momentum!`
              : `⚠️ Bookings dropped ${Math.abs(growth)}% vs last month. Consider running a promotion.`
            }
          </Text>
          <Text style={s.insightItem}>
            {facilities.leastBooked?.count < facilities.mostBooked?.count / 2
              ? `📌 ${facilities.leastBooked?.type} are significantly underbooked. Consider promotions or pricing adjustments.`
              : `📊 All facility types have balanced booking distribution.`
            }
          </Text>
          {tickets.openTickets > 5 && (
            <Text style={s.insightItem}>
              🔴 You have {tickets.openTickets} open support tickets. Resolve them promptly to improve customer satisfaction.
            </Text>
          )}
          {overview.pendingVerifications > 0 && (
            <Text style={s.insightItem}>
              ⏳ {overview.pendingVerifications} booking{overview.pendingVerifications > 1 ? 's are' : ' is'} awaiting payment verification.
            </Text>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
    <ChatUI userToken={api.defaults.headers.common.Authorization?.split(' ')[1]} />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  splash: { flex: 1, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center', padding: 24 },
  splashText: { color: '#fff', marginTop: 12, fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: C.text, fontWeight: '800', fontSize: 15 },

  // Header
  header: { backgroundColor: C.navy, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 4 },
  headerRight: { alignItems: 'flex-end' },
  headerBtn: { backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  headerBtnText: { color: C.text, fontWeight: '700', fontSize: 12 },

  // Revenue Hero
  revenueHero: { backgroundColor: C.navyLight, marginHorizontal: 16, marginTop: -12, borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 6, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
  revenueHeroLeft: { flex: 1 },
  revenueLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 4 },
  revenueValue: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4 },
  revenueMonth: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  growthBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12 },
  growthNum: { fontSize: 20, fontWeight: '900' },
  growthLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Section
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHead: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  sectionSub: { fontSize: 12, color: C.sub, marginTop: 2 },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, flex: 1, minWidth: (SW - 52) / 2 - 5, borderTopWidth: 3, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 12, color: C.sub, fontWeight: '600' },
  statSub: { fontSize: 11, color: C.sub, marginTop: 4 },

  // Facility
  facilityRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  facilityCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, elevation: 2 },
  facilityIcon: { fontSize: 28, marginBottom: 6 },
  facilityCount: { fontSize: 24, fontWeight: '900', color: C.navy },
  facilityType: { fontSize: 12, fontWeight: '700', color: C.text, marginTop: 2 },
  facilityTotal: { fontSize: 10, color: C.sub, marginTop: 2 },

  // Rank cards
  rankRow: { flexDirection: 'row', gap: 10 },
  rankCard: { flex: 1, borderRadius: 12, padding: 14 },
  rankLabel: { fontSize: 11, color: C.sub, fontWeight: '700', marginBottom: 4 },
  rankType: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  rankCount: { fontSize: 12, color: C.sub },

  // Chart card
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: C.sub },
  noData: { textAlign: 'center', color: C.sub, padding: 20, fontSize: 14 },

  // Table
  tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 4 },
  tableHCell: { color: C.navy, fontWeight: '800', fontSize: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  tableRowAlt: { backgroundColor: '#f8fbff', borderRadius: 6 },
  tableCell: { flex: 1, fontSize: 13, color: C.text },

  // Recent bookings
  recentRow: { flexDirection: 'row', paddingVertical: 12, justifyContent: 'space-between', alignItems: 'center' },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  recentLeft: { flex: 1 },
  recentRight: { alignItems: 'flex-end', gap: 6 },
  recentType: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
  recentUser: { fontSize: 12, color: C.sub },
  recentDate: { fontSize: 11, color: C.sub },
  recentAmount: { fontSize: 15, fontWeight: '800', color: C.navy },
  viewAllBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  viewAllText: { color: C.navy, fontWeight: '700', fontSize: 13 },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Insights
  insightCard: { backgroundColor: '#fffbea', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: C.gold, gap: 10 },
  insightItem: { fontSize: 13, color: '#4a3800', lineHeight: 20 },
});

export default AdminDashboardScreen;
