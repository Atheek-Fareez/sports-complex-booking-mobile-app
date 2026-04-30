const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Request Logger (Top Level)
app.use((req, res, next) => {
  if (req.originalUrl.includes('dashboard')) {
    console.log(`[DASHBOARD-DEBUG] ${req.method} ${req.originalUrl} hit!`);
  }
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  
  // Capture response
  const oldSend = res.send;
  res.send = function(data) {
    console.log(`[DEBUG] Response for ${req.method} ${req.originalUrl}: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.log(`[DEBUG] Error Body: ${data}`);
    }
    oldSend.apply(res, arguments);
  };
  
  next();
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'White House Sports Complex API is running...' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/courts', require('./routes/courtRoutes'));
app.use('/api/pools', require('./routes/poolRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CRITICAL-SERVER-ERROR]', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal Server Error',
    error: err.message,
    stack: err.stack
  });
});

app.get("/test-db", async (req, res) => {
  res.send("Database is connected and working!");
});


