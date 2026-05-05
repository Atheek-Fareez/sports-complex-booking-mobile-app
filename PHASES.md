# Sports Complex, Swimming Pool & Room Booking Mobile App
## Phase-Wise Requirements and MVP Plan

---

## Project Overview

| | |
|---|---|
| **Project Name** | Sports Complex, Swimming Pool & Room Booking Mobile App |
| **Goal** | Full-stack mobile app for managing rooms, indoor courts, and swimming pool bookings |
| **Users** | Guests (register, login, browse, book, pay) & Admins (manage facilities, bookings, images) |

---

## Tech Stack

### Frontend
- React Native + Expo
- React Navigation
- Axios

### Backend
- Node.js + Express.js

### Database
- MongoDB Atlas + Mongoose

### Auth & Security
- JWT, bcryptjs, cors, dotenv

### File Upload
- Multer

### Testing & Deployment
- Postman · Render or Railway

---

## Phase 1 — Environment Setup and Project Initialization ✅ COMPLETED

**Goal:** Set up all tools, accounts, folders, and base project structure.

### Prerequisites to Install
- Node.js, npm, Git, VS Code, Postman
- MongoDB Atlas account + GitHub account
- Expo Go app on phone or Android emulator

### Backend Dependencies
```bash
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer
npm install --save-dev nodemon
```

### Frontend Setup
```bash
npx create-expo-app frontend
npm install axios @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated react-native-svg
npx expo install expo-image-picker expo-status-bar
```

### Database Setup Steps
1. Create MongoDB Atlas account
2. Create project and cluster
3. Create database user
4. Add IP access
5. Copy connection string
6. Create `.env` file

### Example `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?appName=Cluster0
JWT_SECRET=mysecretkey123
```

### Backend Folder Structure
```
backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── uploads/
├── .env
├── package.json
└── server.js
```

### Frontend Folder Structure
```
frontend/
├── assets/
├── components/
├── navigation/
├── screens/
├── services/
├── App.js
└── package.json
```

### Phase 1 MVP
- [x] Backend server runs
- [x] Frontend Expo app runs
- [x] MongoDB connection works

---

## Phase 2 — Database Connection and Core Model Creation ✅ COMPLETED

**Goal:** Connect backend with MongoDB Atlas and create all main database models.

### Collections
`users` · `rooms` · `courts` · `pools` · `bookings` · `payments`

### Models to Create
1. **User** — fullName, email, password, phone, role, isActive, createdAt, updatedAt
2. **Room** — roomName, roomNumber, roomType, price, capacity, description, availabilityStatus, imageUrl, createdAt, updatedAt
3. **Court** — courtName, pricePerHour, description, availabilityStatus, imageUrl, isActive, createdAt, updatedAt
4. **Pool** — poolName, pricePerSession, capacity, description, availabilityStatus, imageUrl, isActive, createdAt, updatedAt
5. **Booking** — userId, bookingType, roomId, courtId, poolId, bookingDate, startDate, endDate, timeSlot, totalAmount, status, createdAt, updatedAt
6. **Payment** — userId, bookingId, amount, paymentMethod, transactionId, paymentStatus, paymentDate, receiptUrl, createdAt, updatedAt

### Files to Create
```
models/User.js
models/Room.js
models/Court.js
models/Pool.js
models/Booking.js
models/Payment.js
config/db.js
```

### Phase 2 MVP
- [x] MongoDB Atlas connected
- [x] All Mongoose models created
- [x] User model and Room model fully ready

---

## Phase 3 — Authentication Module ✅ COMPLETED

**Goal:** Build login system and secure private routes.

### Dependencies
`bcryptjs` · `jsonwebtoken` · `dotenv`

### APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/auth/profile` | Get logged-in user profile |

### Files to Create
```
models/User.js
controllers/authController.js
routes/authRoutes.js
middleware/authMiddleware.js
```

### What This Phase Must Do
- Hash password before saving
- Compare password at login
- Generate JWT token
- Verify token in protected routes

### Frontend Screens
- Register Screen · Login Screen · Profile Screen

### Phase 3 MVP
- [x] Register API working
- [x] Login API working
- [x] User receives JWT token
- [x] User can access protected profile route

---

## Phase 4 — Room Management Module ✅ COMPLETED

**Goal:** Build complete room CRUD module.

### APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/rooms` | Add room |
| GET | `/api/rooms` | Get all rooms |
| GET | `/api/rooms/:id` | Get one room |
| PUT | `/api/rooms/:id` | Update room |
| DELETE | `/api/rooms/:id` | Delete room |

### Files to Create
```
models/Room.js
controllers/roomController.js
routes/roomRoutes.js
```

### Frontend Screens
- Room List Screen · Room Details Screen · Room Form Screen

### Phase 4 MVP
- [x] User can view room list
- [x] User can view room details
- [x] Admin can add, update, and delete rooms

---

## Phase 5 — Court and Pool Management Module ✅ COMPLETED

**Goal:** Build court and pool facility modules.

### Court APIs
| Method | Endpoint |
|---|---|
| POST | `/api/courts` |
| GET | `/api/courts` |
| GET | `/api/courts/:id` |
| PUT | `/api/courts/:id` |
| DELETE | `/api/courts/:id` |

### Pool APIs
| Method | Endpoint |
|---|---|
| POST | `/api/pools` |
| GET | `/api/pools` |
| GET | `/api/pools/:id` |
| PUT | `/api/pools/:id` |
| DELETE | `/api/pools/:id` |

### Files to Create
```
models/Court.js        models/Pool.js
controllers/courtController.js
controllers/poolController.js
routes/courtRoutes.js  routes/poolRoutes.js
```

### Frontend Screens
- Court List Screen · Court Details Screen · Pool List Screen · Pool Details Screen

> **Shortcut:** Copy Room module structure, rename fields, reuse CRUD logic.

### Phase 5 MVP
- [x] User can browse courts and pools
- [x] User can view court and pool details
- [x] Admin can add, update, and delete courts and pools

---

## Phase 6 — Booking Module ✅ COMPLETED

**Goal:** Build booking system for rooms, courts, and pools.

### APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | Get all bookings |
| GET | `/api/bookings/:id` | Get booking by ID |
| GET | `/api/bookings/user/:userId` | Get bookings by user |
| PUT | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Delete booking |

### Files to Create
```
models/Booking.js
controllers/bookingController.js
routes/bookingRoutes.js
```

### Frontend Screens
- Booking Screen · Booking History Screen · Booking Details Screen

### Phase 6 MVP
- [x] Visual Availability Calendar (Red/Green/Orange/Yellow indicators)
- [x] Hourly Time-Slot Picker with "Two-Click" range selection
- [x] Backend Overlap Detection (Supports adjacent 9-10 & 10-11 slots)
- [ ] Recurring Booking Eligibility (10+ bookings in 2 months)
- [x] Facility Status Checks (Maintenance/Closed/Active)
- [x] Professional Error Handling (Past dates, 1h-3h limits)
- [x] Booking History & Details Screens connected to live API

---

## Phase 7 — Payment Module ✅ COMPLETED

**Goal:** Build professional payment and validation system with terms acceptance and admin verification.

### APIs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments` | Create payment (requires T&C acceptance) |
| GET | `/api/payments/myhistory` | Get user payment history |
| PUT | `/api/payments/:id/admin-confirm` | Admin validates booking and confirms payment |

### Key Features Implemented
- **Status Lifecycle**: `PENDING_PAYMENT` → `PAID_PENDING_ADMIN_APPROVAL` → `CONFIRMED` / `REJECTED`.
- **Policy Enforcement**: Mandatory Refund Policy (24h rule) and Terms acceptance.
- **Admin Validation**: Explicit "Confirm" and "Reject" actions for oversight.
- **Mock Gateway**: Simulated "Redirecting to secure gateway..." workflow.
- **Visual Feedback**: Orange (Reserved/Paid) vs Red (Confirmed/Final) slots.
- **Mock SMS**: Professional confirmation text sent upon admin approval.

### Phase 7 MVP
- [x] Payment Screen with Summary, Policies, and Mandatory Checkbox
- [x] Backend status transition upon successful (mock) payment
- [x] Admin endpoint for Reject/Confirm with status updates
- [x] Integrated visual status in BookingScreen slot grid

---

## Phase 8 — Image Upload Module ✅ COMPLETED

**Goal:** Upload and store images for rooms, courts, and pools.

### Dependencies
`multer` · `expo-image-picker` (frontend)

### API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload image file |

### Files to Create
```
controllers/uploadController.js
middleware/uploadMiddleware.js
routes/uploadRoutes.js
uploads/   (folder)
```

### Frontend Flow
1. Choose image from phone gallery
2. Send image to backend
3. Save returned image URL to facility record

### Phase 8 MVP
- [x] At least one image uploads successfully
- [x] Image URL saved in one facility record

---

## Phase 9 — Frontend Integration ✅ COMPLETED

**Goal:** Connect all mobile screens to backend APIs.

### Screens to Connect
Register · Login · Profile · Room List · Room Details · Court List · Pool List · Booking · Booking History · Payment · Payment History

### Key Requirements
- Send API requests using Axios (`services/api.js`)
- Show real backend data — **no hardcoded values**
- Submit forms and store JWT token after login
- Handle loading states and error messages
- Navigate between screens using React Navigation

### Phase 9 MVP
- [x] User can register and log in
- [x] User can browse rooms
- [x] User can create a booking
- [x] User can create a payment record

---

## Phase 10 — Testing, Deployment, and Final MVP

**Goal:** Test the project, deploy backend online, and deliver the final working app.

### Testing Checklist
- [ ] All APIs tested in Postman
- [ ] Login flow works
- [ ] Booking flow works
- [ ] Payment flow works
- [ ] Image upload flow works

### Deployment Steps
1. Deploy backend to **Render** or **Railway**
2. Connect MongoDB Atlas to deployed backend
3. Update `services/api.js` BASE_URL to live backend URL
4. Test full app with live backend

### Final Project Checklist
- [ ] Authentication works
- [ ] Room, Court, Pool modules work
- [ ] Booking and Payment work
- [ ] Image upload works
- [ ] MongoDB connected
- [ ] Backend hosted online

### Final MVP Requirements
- User registration & login with JWT
- Room listing & details
- One working booking flow
- One working payment record flow
- MongoDB database storage
- Hosted backend + mobile app connected to live API

---

## Final Development Order

| Step | Task |
|---|---|
| 1 | Setup backend and frontend |
| 2 | Connect MongoDB Atlas |
| 3 | Build User model and auth APIs |
| 4 | Build Room CRUD |
| 5 | Copy Room logic for Court and Pool |
| 6 | Build Booking APIs |
| 7 | Build Payment APIs |
| 8 | Build Upload API |
| 9 | Connect frontend with Axios |
| 10 | Deploy backend and test final flow |

---

## Quick Command Reference

### Backend
```bash
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer
npm install --save-dev nodemon
```

### Frontend
```bash
npx create-expo-app frontend
npm install axios @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated react-native-svg
npx expo install expo-image-picker expo-status-bar
```

---

> **Important:** Complete one phase fully before moving to the next.  
> At the end of each phase, verify the MVP checklist before continuing.
