# MERN Assignment

## Features
- User authentication (register, login)
- User profile management
- Role-based access (admin, user)
- User list and details (admin only)
- Protected routes (frontend)
- Status and role badges

## Setup Instructions

### Prerequisites
- Node.js (v18 or above recommended)
- npm or yarn
- MongoDB database (cloud or local)

### 1. Clone the repository
```
git clone <your-repo-url>
cd Mern-Assignment
```

### 2. Backend Setup
```
cd backend
npm install
```
- Create a `.env` file in the backend folder with:
  - `MONGO_URI=your-mongodb-uri`
  - `JWT_SECRET=your-jwt-secret`
  - `PORT=5000` (optional)
- Start the backend server:
```
npm run dev
```

### 3. Frontend Setup
```
cd frontend
npm install
```
- Create a `.env` file in the frontend folder with:
  - `VITE_API_URL=your-backend-api-url`
  - `VITE_ENV=production` (optional)
- Start the frontend server:
```
npm run dev
```

### 4. Access the App
- Frontend: https://mern-assignment-coral.vercel.app
- Backend: https://mern-assignment-j8j7.onrender.com

---


