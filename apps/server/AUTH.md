# Authentication System Documentation

## Overview

The Plant Care Assistant API uses a complete JWT-based authentication system with access and refresh tokens. All plant endpoints are protected and require authentication.

## Base URL

```
http://localhost:3000/api/auth
```

## Authentication Flow

1. **Register** or **Login** to get access and refresh tokens
2. Include access token in Authorization header for protected endpoints
3. When access token expires, use refresh token to get new tokens
4. **Logout** to invalidate refresh token

## Authentication Endpoints

### 1. Register

**POST** `/auth/register`

Register a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- At least 8 characters
- At least one lowercase letter
- At least one uppercase letter  
- At least one number

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cljk1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-16T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 2. Login

**POST** `/auth/login`

Login with existing credentials.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cljk1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-16T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 3. Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 4. Logout

**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <access-token>`

Logout and invalidate refresh token.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 5. Get Profile

**GET** `/auth/me`

**Headers:** `Authorization: Bearer <access-token>`

Get current user profile with statistics.

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "cljk1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-16T10:00:00Z",
    "updatedAt": "2024-01-16T11:00:00Z",
    "stats": {
      "plantCount": 15,
      "accountAge": 45,
      "lastLogin": "2024-01-16T11:00:00Z"
    }
  }
}
```

### 6. Update Profile

**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <access-token>`

Update user profile information.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "cljk1234567890",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "updatedAt": "2024-01-16T12:00:00Z"
  }
}
```

### 7. Change Password

**PUT** `/auth/password`

**Headers:** `Authorization: Bearer <access-token>`

Change user password. This will invalidate all refresh tokens.

**Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

### 8. Verify Token

**GET** `/auth/verify`

**Headers:** `Authorization: Bearer <access-token>`

Verify if current access token is valid.

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "cljk1234567890",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## Using Authentication in Client Applications

### 1. Store Tokens Securely

```javascript
// After successful login/register
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

// Store tokens securely (avoid localStorage for sensitive data)
// Use secure storage like httpOnly cookies or encrypted storage
localStorage.setItem('accessToken', data.data.tokens.accessToken);
localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
```

### 2. Include Token in Requests

```javascript
// For all authenticated requests
const token = localStorage.getItem('accessToken');

const response = await fetch('/api/plants', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Handle Token Refresh

```javascript
// Automatic token refresh on 401 responses
async function refreshTokens() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data.tokens.accessToken;
  }
  
  // Refresh failed, redirect to login
  window.location.href = '/login';
}

// Axios interceptor example
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const newToken = await refreshTokens();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 4. Logout

```javascript
async function logout() {
  const token = localStorage.getItem('accessToken');
  
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // Clear stored tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login
  window.location.href = '/login';
}
```

## Token Information

### Access Token
- **Expires in:** 7 days (configurable via JWT_EXPIRES_IN)
- **Purpose:** Authenticate API requests
- **Storage:** Store securely, avoid localStorage in production

### Refresh Token
- **Expires in:** 30 days (fixed)
- **Purpose:** Get new access tokens
- **Storage:** More secure storage required (httpOnly cookies preferred)

## Error Responses

### Authentication Errors

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

**Common Error Codes:**
- `MISSING_TOKEN` - No Authorization header provided
- `INVALID_TOKEN` - Token is malformed or invalid
- `TOKEN_EXPIRED` - Token has expired
- `TOKEN_NOT_ACTIVE` - Token is not yet active
- `USER_NOT_FOUND` - User associated with token no longer exists
- `AUTH_SERVICE_ERROR` - Internal authentication service error
- `RATE_LIMIT_EXCEEDED` - Too many authentication attempts

### Rate Limiting

- **Register/Login:** 5 attempts per 15 minutes per IP
- **Token Refresh:** 10 attempts per 15 minutes per IP
- **Password Change:** 5 attempts per 15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1642345678
```

## Security Features

- ✅ **Password Hashing:** bcrypt with 12 salt rounds
- ✅ **JWT Security:** Signed tokens with configurable expiration
- ✅ **Rate Limiting:** Protection against brute force attacks
- ✅ **Token Validation:** Comprehensive token verification
- ✅ **Secure Headers:** Helmet middleware for security headers
- ✅ **Input Validation:** Zod schema validation for all inputs
- ✅ **SQL Injection Protection:** Prisma ORM with parameterized queries
- ✅ **User Scoping:** All data operations scoped to authenticated user

## Protected Routes

All `/api/plants/*` endpoints require authentication:
- `GET /api/plants` - Get user's plants
- `POST /api/plants` - Create new plant
- `PUT /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Delete plant
- `POST /api/plants/:id/water` - Water plant
- And more...

## Example Integration

```javascript
class PlantCareAPI {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      // Try to refresh token
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  async refreshAccessToken() {
    // Implementation from example above
  }

  // API methods
  async getPlants() {
    const response = await this.request('/plants');
    return response.json();
  }

  async createPlant(plantData) {
    const response = await this.request('/plants', {
      method: 'POST',
      body: JSON.stringify(plantData),
    });
    return response.json();
  }
}
```