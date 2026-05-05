const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const Room = require('../models/Room');
const Court = require('../models/Court');
const Pool = require('../models/Pool');
const User = require('../models/User');

class ChatQueryParser {
  /**
   * Parse user query and determine what data to fetch
   * @param {string} query - User's question
   * @returns {object} - Intent and time range
   */
  parseQuery(query) {
    const lowerQuery = query.toLowerCase();

    // Determine intent
    let intent = 'analytics'; // default
    if (
      lowerQuery.includes('ticket') ||
      lowerQuery.includes('refund') ||
      lowerQuery.includes('issue') ||
      lowerQuery.includes('complaint') ||
      lowerQuery.includes('support')
    ) {
      intent = 'support';
    } else if (
      lowerQuery.includes('pending') ||
      lowerQuery.includes('payment') ||
      lowerQuery.includes('verify')
    ) {
      intent = 'payments';
    } else if (
      lowerQuery === 'hi' ||
      lowerQuery === 'hello' ||
      lowerQuery === 'hey' ||
      lowerQuery.startsWith('hi ') ||
      lowerQuery.startsWith('hello ')
    ) {
      intent = 'greeting';
    }

    // Determine time range
    let timeRange = 'today'; // default
    if (
      lowerQuery.includes('week') ||
      lowerQuery.includes('7 days') ||
      lowerQuery.includes('weekly')
    ) {
      timeRange = 'week';
    } else if (
      lowerQuery.includes('month') ||
      lowerQuery.includes('30 days') ||
      lowerQuery.includes('monthly')
    ) {
      timeRange = 'month';
    } else if (
      lowerQuery.includes('year') ||
      lowerQuery.includes('annual') ||
      lowerQuery.includes('yearly')
    ) {
      timeRange = 'year';
    } else if (
      lowerQuery.includes('yesterday') ||
      lowerQuery.includes('last day')
    ) {
      timeRange = 'yesterday';
    }

    return { intent, timeRange };
  }

  /**
   * Get date range based on timeRange
   * @param {string} timeRange
   * @returns {object} - { start, end }
   */
  getDateRange(timeRange) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (timeRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  /**
   * Fetch relevant data based on parsed intent
   * @param {object} parsed - { intent, timeRange }
   * @returns {Promise<object>} - Aggregated data
   */
  async fetchRelevantData(parsed) {
    const { intent, timeRange } = parsed;
    const dateRange = this.getDateRange(timeRange);
    const data = {};

    try {
      // Always fetch dashboard stats
      data.dashboardStats = await this.fetchDashboardStats(dateRange);

      // Fetch based on intent
      if (intent === 'analytics' || intent === 'payments') {
        data.pendingPayments = await this.fetchPendingPayments();
        data.monthlyTrends = await this.fetchMonthlyTrends();
        data.facilityStatus = await this.fetchFacilityStatus();
      }

      if (intent === 'support' || intent === 'payments') {
        data.supportTickets = await this.fetchSupportTickets(dateRange);
      }

      if (intent === 'greeting') {
        // Just fetch today's quick stats for a helpful greeting
        data.quickStats = data.dashboardStats;
      }

      return data;
    } catch (error) {
      console.error('[CHAT PARSER ERROR]', error.message);
      throw error;
    }
  }

  /**
   * Get dashboard stats for given date range
   */
  async fetchDashboardStats(dateRange) {
    const { start, end } = dateRange;

    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      roomBookings,
      courtBookings,
      poolBookings,
      totalRevenue,
      roomRevenue,
      totalTickets,
      openTickets,
      refundTickets,
      totalUsers,
    ] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'success'] }, createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ status: { $in: ['pending', 'pending_payment'] }, createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ status: 'cancelled', createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ bookingType: 'room', createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ bookingType: 'court', createdAt: { $gte: start, $lte: end } }),
      Booking.countDocuments({ bookingType: 'pool', createdAt: { $gte: start, $lte: end } }),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'success'] }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { bookingType: 'room', status: { $in: ['confirmed', 'success'] }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      SupportTicket.countDocuments({ isDeletedByAdmin: false }),
      SupportTicket.countDocuments({ status: 'Open', isDeletedByAdmin: false }),
      SupportTicket.countDocuments({ category: 'Refund Request', isDeletedByAdmin: false }),
      User.countDocuments({ role: 'user' }),
    ]);

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      roomBookings,
      courtBookings,
      poolBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      roomRevenue: roomRevenue[0]?.total || 0,
      totalTickets,
      openTickets,
      refundTickets,
      totalUsers,
      dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
    };
  }

  /**
   * Get pending payments awaiting admin verification
   */
  async fetchPendingPayments() {
    return await Payment.find({ paymentStatus: 'pending_verification' })
      .populate('bookingId', 'bookingType totalAmount')
      .limit(20);
  }

  /**
   * Get monthly trends for last 6 months
   */
  async fetchMonthlyTrends() {
    const now = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const bookings = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const revenue = await Booking.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ['confirmed', 'success'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      trends.push({
        month: start.toLocaleString('default', { month: 'short' }),
        year: start.getFullYear(),
        bookings,
        revenue: revenue[0]?.total || 0,
      });
    }

    return trends;
  }

  /**
   * Get facility availability status
   */
  async fetchFacilityStatus() {
    const [rooms, courts, pools] = await Promise.all([
      Room.countDocuments({ availabilityStatus: 'available' }),
      Court.countDocuments({ availabilityStatus: 'available' }),
      Pool.countDocuments({ availabilityStatus: 'available' }),
    ]);

    const [totalRooms, totalCourts, totalPools] = await Promise.all([
      Room.countDocuments(),
      Court.countDocuments(),
      Pool.countDocuments(),
    ]);

    return [
      { type: 'Rooms', available: rooms, total: totalRooms },
      { type: 'Courts', available: courts, total: totalCourts },
      { type: 'Pools', available: pools, total: totalPools },
    ];
  }

  /**
   * Get support tickets
   */
  async fetchSupportTickets(dateRange) {
    const { start, end } = dateRange;
    return await SupportTicket.find({
      isDeletedByAdmin: false,
      createdAt: { $gte: start, $lte: end }
    })
      .select('category status priority subject')
      .limit(15);
  }
}

module.exports = new ChatQueryParser();
