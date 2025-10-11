# Authentication System

Complete user authentication system with email verification and JWT tokens.

## Features

- ✅ User Registration with email verification
- ✅ Email verification via secure tokens
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Password reset functionality
- ✅ Protected routes with middleware
- ✅ Input validation and error handling

## File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js          # User model with validation
│   │   └── Visit.js         # Existing visit tracking
│   ├── routes/
│   │   └── auth.js          # Authentication routes
│   ├── utils/
│   │   ├── auth.js          # JWT and token utilities
│   │   └── emailService.js  # Email sending service
│   ├── db.js               # Database connection
│   └── server.js           # Main server file
├── .env.example            # Environment variables template
└── README-AUTH.md          # This file
```

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=visitsdb

# Server
PORT=4000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
APP_NAME=Your App Name
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

### 2. Verify Email
```
GET /api/auth/verify-email?token=verification_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

### 3. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "verified": true
  }
}
```

### 4. Get Profile (Protected)
```
GET /api/auth/profile
Authorization: Bearer your_jwt_token_here
```

### 5. Resend Verification Email
```
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### 6. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### 7. Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "password": "newpassword123"
}
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up Gmail App Password:**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for this application
   - Use the App Password in `SMTP_PASS`

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Testing with Postman

### Register a new user:
1. POST to `http://localhost:4000/api/auth/register`
2. Check your email for verification link
3. Click the verification link or use the token in GET request

### Login:
1. POST to `http://localhost:4000/api/auth/login`
2. Copy the JWT token from response
3. Use token in Authorization header for protected routes

### Test protected route:
1. GET to `http://localhost:4000/api/auth/profile`
2. Add header: `Authorization: Bearer your_jwt_token`

## Security Features

- ✅ Passwords hashed with bcrypt (salt rounds: 12)
- ✅ JWT tokens with expiration
- ✅ Email verification required before login
- ✅ Secure password reset with time-limited tokens
- ✅ Input validation and sanitization
- ✅ Rate limiting ready (can be added)
- ✅ CORS configured
- ✅ No sensitive data in responses

## Database Collections

- **users**: User accounts with verification status
- **visits**: IP tracking data (existing)

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

Success responses:
```json
{
  "success": true,
  "message": "Success description",
  "data": { ... }
}
```
