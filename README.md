# sports-complex-booking-mobile-app
Full Stack Mobile Application for booking indoor courts, swimming pool slots, and rental rooms in a sports complex. Built using React Native, Node.js, Express.js, and MongoDB.

# Indoor Court & Swimming Pool Management

This module is a core component of the Sports Complex Booking system, specifically managing the inventory, pricing, and availability of Indoor Courts and Swimming Pools.

## Notable Features

### 1. Dynamic Status Tracking (`isActive` Flag)
Both the Court and Pool models implement an `isActive` boolean flag. This provides soft-delete capabilities and allows administrators to instantly toggle the visibility and bookability of a facility without deleting historical data.

### 2. Advanced Price Tracking
The system supports granular price tracking to maximize revenue and accommodate peak hours:
*   **Courts**: Implements specific `dayPrice` and `nightPrice` fields to handle time-based rate variations.
*   **Pools**: Includes a base `pricePerSession` along with `dayPrice` and `nightPrice` configurations, providing flexible billing options for different types of pool access.

### 3. Capacity Management
*   **Pools**: Features a strict `capacity` tracking schema to prevent overcrowding and ensure user safety. The system validates that the capacity is always a minimum of 1, allowing the booking engine to halt reservations once the pool reaches its maximum safe occupancy.

## Technologies Used
*   **Backend**: Node.js, Express, MongoDB, Mongoose
*   **Frontend**: React Native, Expo, React Navigation

## Setup Instructions
1. Ensure your `.env` contains the correct `MONGO_URI` and `PORT`.
2. Run `npm install` in both the `backend/` and `frontend/` directories.
3. Start the backend: `npm run dev` (or `node server.js`).
4. Start the frontend: `npx expo start`.
