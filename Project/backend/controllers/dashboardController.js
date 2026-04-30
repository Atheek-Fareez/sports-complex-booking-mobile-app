const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const Payment = require('../models/Payment');
const Room = require('../models/Room');
const Court = require('../models/Court');
const Pool = require('../models/Pool');
const User = require('../models/User');

// @desc    Get admin business dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ── Core counts ──────────────────────────────────────────────────
    const [
      totalBookings,
      thisMonthBookings,
      lastMonthBookings,
      roomBookings,
      courtBookings,
      poolBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      pendingVerifications,
      totalRevenue,
      thisMonthRevenue,
      totalTickets,
      openTickets,
      refundTickets,
      totalRooms,
      totalCourts,
      totalPools,
      totalUsers,
    ] = await Promise.all([
      // Bookings
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Booking.countDocuments({ bookingType: 'room' }),
      Booking.countDocuments({ bookingType: 'court' }),
      Booking.countDocuments({ bookingType: 'pool' }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'success'] } }),
      Booking.countDocuments({ status: { $in: ['pending', 'pending_payment'] } }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'pending_verification' }),

      // Revenue
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'success'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'success'] }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Tickets
      SupportTicket.countDocuments({ isDeletedByAdmin: false }),
      SupportTicket.countDocuments({ status: 'Open', isDeletedByAdmin: false }),
      SupportTicket.countDocuments({ category: 'Refund Request', isDeletedByAdmin: false }),

      // Facilities
      Room.countDocuments(),
      Court.countDocuments(),
      Pool.countDocuments(),
      User.countDocuments({ role: 'user' }),
    ]);

    // ── Monthly bookings for last 6 months ───────────────────────────
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const revenue = await Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ['confirmed', 'success'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      monthlyData.push({
        month: start.toLocaleString('default', { month: 'short' }),
        year: start.getFullYear(),
        bookings: count,
        revenue: revenue[0]?.total || 0,
      });
    }

    // ── Facility-type breakdown ──────────────────────────────────────
    const facilityBreakdown = [
      { type: 'Rooms', count: roomBookings, color: '#003580' },
      { type: 'Courts', count: courtBookings, color: '#00b386' },
      { type: 'Pools', count: poolBookings, color: '#febb02' },
    ];

    // Most / least booked
    const sorted = [...facilityBreakdown].sort((a, b) => b.count - a.count);
    const mostBooked = sorted[0];
    const leastBooked = sorted[sorted.length - 1];

    // ── Recent bookings ──────────────────────────────────────────────
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName email');

    // ── Growth rate ──────────────────────────────────────────────────
    const growthRate = lastMonthBookings > 0
      ? (((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1)
      : thisMonthBookings > 0 ? 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalBookings,
          thisMonthBookings,
          lastMonthBookings,
          growthRate: parseFloat(growthRate),
          confirmedBookings,
          pendingBookings,
          cancelledBookings,
          pendingVerifications,
        },
        revenue: {
          totalRevenue: totalRevenue[0]?.total || 0,
          thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
        },
        facilities: {
          totalRooms,
          totalCourts,
          totalPools,
          roomBookings,
          courtBookings,
          poolBookings,
          facilityBreakdown,
          mostBooked,
          leastBooked,
        },
        tickets: {
          totalTickets,
          openTickets,
          refundTickets,
        },
        users: {
          totalUsers,
        },
        monthlyData,
        recentBookings: recentBookings.map(b => ({
          _id: b._id,
          bookingType: b.bookingType,
          status: b.status,
          totalAmount: b.totalAmount,
          userName: b.userId?.fullName || 'Unknown',
          createdAt: b.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('[DASHBOARD] Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
