#  Sports Complex Booking Mobile App

**Y2S2 · Group: WE.AI.12**  
A full-stack mobile application for managing room, indoor court, and swimming pool bookings at a sports complex facility.

---

## Live Backend

| Service | URL |
|---|---|
| **Hosted Backend (Render)** | `https://sports-complex-booking-mobile-app.onrender.com` |
| **GitHub Repository** | `https://github.com/Atheek-Fareez/sports-complex-booking-mobile-app` |

---

##  Team

| Student ID | Name | Module |
|---|---|---|
| IT24103933 | Atheek M.F | Authentication & System Maintenance |
| IT24101893 | Ranasinghe N.A | Room Management |
| IT24103891 | Perera J.M.C.S | Indoor Court & Swimming Pool Management |
| IT24100647 | Jayasekara A.J.M.P.N | Booking Management |
| IT24104048 | Thennakoon T.M.P.N | Payment Management |
| IT24104252 | Thennakoon T.M.P.N | Upload, Deployment & Ticket Management |

---

## 📁 Project Structure

```
sports-complex-booking-mobile-app/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js        # Register, login, profile
│   │   ├── roomController.js        # Room CRUD
│   │   ├── courtController.js       # Court CRUD
│   │   ├── poolController.js        # Pool CRUD
│   │   ├── bookingController.js     # Booking logic + overlap detection
│   │   ├── paymentController.js     # Payment processing + admin verification
│   │   ├── uploadController.js      # Image upload
│   │   └── ticketController.js      # Support tickets + refund workflow
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── uploadMiddleware.js      # Multer configuration
│   ├── models/
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Court.js
│   │   ├── Pool.js
│   │   ├── Booking.js
│   │   ├── Payment.js
│   │   └── SupportTicket.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── courtRoutes.js
│   │   ├── poolRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── ticketRoutes.js
│   ├── uploads/                     # Stored image files
│   ├── .env                         # Environment variables (not committed)
│   ├── package.json
│   └── server.js                    # Express app entry point
│
└── frontend/
    ├── assets/                      # App icons and images
    ├── components/
    │   └── (shared UI components)
    ├── navigation/
    │   └── AppNavigator.js          # React Navigation stack
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   ├── RegisterScreen.js
    │   │   └── ProfileScreen.js
    │   ├── rooms/
    │   │   ├── RoomListScreen.js
    │   │   ├── RoomDetailsScreen.js
    │   │   └── RoomFormScreen.js
    │   ├── courts/
    │   │   ├── CourtListScreen.js
    │   │   └── CourtDetailsScreen.js
    │   ├── pools/
    │   │   ├── PoolListScreen.js
    │   │   └── PoolDetailsScreen.js
    │   ├── booking/
    │   │   ├── BookingScreen.js
    │   │   ├── BookingHistoryScreen.js
    │   │   └── BookingDetailsScreen.js
    │   ├── payment/
    │   │   ├── PaymentScreen.js
    │   │   └── PaymentHistoryScreen.js
    │   ├── admin/
    │   │   ├── AdminDashboardScreen.js
    │   │   ├── AdminVerificationScreen.js
    │   │   └── AdminTicketDetailsScreen.js
    │   └── tickets/
    │       ├── SupportTicketScreen.js
    │       └── TicketHistoryScreen.js
    ├── services/
    │   └── api.js                   # Axios base URL config
    ├── App.js
    └── package.json
```

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo |
| Navigation | React Navigation (Native Stack) |
| HTTP Client | Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JWT + bcryptjs |
| File Upload | Multer |
| Deployment | Render |

---

##  Prerequisites

Install these before running the project:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://npmjs.com/) v9 or higher
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/client) app on your phone **or** an Android emulator
- [Postman](https://postman.com/) (optional, for API testing)

---

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Atheek-Fareez/sports-complex-booking-mobile-app.git
cd sports-complex-booking-mobile-app
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://<your-user>:<your-password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
JWT_SECRET=your_secret_key_here
```

>  Replace the MongoDB URI with your own MongoDB Atlas connection string.

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated react-native-svg
npx expo install expo-image-picker expo-status-bar
```

Configure the API base URL in `frontend/services/api.js`:

```javascript
// For local development (use your machine's local IP, not localhost)
const BASE_URL = 'http://192.168.x.x:5000';

// For live production backend on Render
const BASE_URL = 'https://sports-complex-booking-mobile-app.onrender.com';
```

Start the Expo app:

```bash
npx expo start
```

Then:
- **Phone:** Scan the QR code using the Expo Go app
- **Android Emulator:** Press `a` in the terminal
- **Web:** Press `w` in the terminal

---

##  Running Against the Live Backend (Render)

The backend is already deployed at:

```
https://sports-complex-booking-mobile-app.onrender.com
```

To connect the mobile app to the live backend, set `services/api.js`:

```javascript
const BASE_URL = 'https://sports-complex-booking-mobile-app.onrender.com';
```

> **Note:** Render free-tier servers spin down after inactivity. The first request may take 30–60 seconds to respond. Subsequent requests will be fast.

---

##  Roles

| Role | Access |
|---|---|
| `user` | Register, login, browse facilities, book, pay, view history, submit tickets |
| `admin` | All user access + manage facilities, verify payments, process refunds, manage tickets |

---

##  Testing APIs with Postman

1. Open Postman
2. Import or manually create requests using the endpoints above
3. For protected routes, add header: `Authorization: Bearer <your_jwt_token>`
4. Use the live Render URL or `http://localhost:5000` for local testing

---

##  Booking Status Flow

```
User Submits Payment
        ↓
Pending Verification
        ↓
Admin Reviews in Dashboard
        ↓
    Accept          Reject
        ↓               ↓
  Confirmed          Rejected
  
```

---

##  Refund Policy

- **Pool / Futsal:** Refund ticket must be submitted at least **12 hours** before booking time
- **Room:** Refund ticket must be submitted at least **48 hours** before check-in
- Only the **paid amount** is refunded (advance payments: only the paid portion)

---

##  License

This project is developed as part of an academic module (Y2S2) and is for educational purposes.
