# Plant Care Assistant API Documentation

## Authentication

All plant endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3000/api
```

## Plant Endpoints

### 1. Get All Plants

**GET** `/plants`

Get all plants for the authenticated user with optional filtering and pagination.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page, max 100 (default: 10)
- `search` (string, optional): Search in name, species, and notes
- `species` (string, optional): Filter by species
- `lastWateredFrom` (ISO date, optional): Filter plants watered after this date
- `lastWateredTo` (ISO date, optional): Filter plants watered before this date

**Response:**
```json
{
  "success": true,
  "message": "Plants retrieved successfully",
  "data": [
    {
      "id": "cljk1234567890",
      "name": "Monstera Deliciosa",
      "species": "Monstera deliciosa",
      "notes": "Loves bright, indirect light",
      "imageUrl": "https://example.com/image.jpg",
      "lastWatered": "2024-01-15T10:00:00Z",
      "wateringFrequency": 7,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "userId": "user123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Get Plant by ID

**GET** `/plants/:id`

Get a specific plant by ID.

**Parameters:**
- `id` (string): Plant ID

**Response:**
```json
{
  "success": true,
  "message": "Plant retrieved successfully",
  "data": {
    "id": "cljk1234567890",
    "name": "Monstera Deliciosa",
    "species": "Monstera deliciosa",
    "notes": "Loves bright, indirect light",
    "imageUrl": "https://example.com/image.jpg",
    "lastWatered": "2024-01-15T10:00:00Z",
    "wateringFrequency": 7,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "userId": "user123"
  }
}
```

### 3. Create Plant

**POST** `/plants`

Create a new plant with optional image upload.

**Content-Type:** `multipart/form-data`

**Body Parameters:**
- `name` (string, required): Plant name (1-100 characters)
- `species` (string, optional): Plant species (max 100 characters)
- `notes` (string, optional): Plant notes (max 1000 characters)
- `wateringFrequency` (number, required): Days between watering (1-365)
- `lastWatered` (ISO date, optional): Last watered date
- `image` (file, optional): Plant image (JPEG, PNG, WebP, max 10MB)

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/plants \
  -H "Authorization: Bearer your-token" \
  -F "name=My Monstera" \
  -F "species=Monstera deliciosa" \
  -F "wateringFrequency=7" \
  -F "notes=Beautiful climbing plant" \
  -F "image=@plant-photo.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Plant created successfully",
  "data": {
    "id": "cljk1234567890",
    "name": "My Monstera",
    "species": "Monstera deliciosa",
    "notes": "Beautiful climbing plant",
    "imageUrl": "https://example.com/uploaded-image.jpg",
    "wateringFrequency": 7,
    "lastWatered": null,
    "createdAt": "2024-01-16T10:00:00Z",
    "updatedAt": "2024-01-16T10:00:00Z",
    "userId": "user123"
  }
}
```

### 4. Update Plant

**PUT** `/plants/:id`

Update an existing plant with optional image upload.

**Parameters:**
- `id` (string): Plant ID

**Content-Type:** `multipart/form-data`

**Body Parameters (all optional):**
- `name` (string): Plant name (1-100 characters)
- `species` (string): Plant species (max 100 characters)
- `notes` (string): Plant notes (max 1000 characters)
- `wateringFrequency` (number): Days between watering (1-365)
- `lastWatered` (ISO date): Last watered date
- `image` (file): New plant image (JPEG, PNG, WebP, max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Plant updated successfully",
  "data": {
    "id": "cljk1234567890",
    "name": "Updated Monstera",
    "species": "Monstera deliciosa",
    "notes": "Updated notes",
    "imageUrl": "https://example.com/new-image.jpg",
    "lastWatered": "2024-01-16T10:00:00Z",
    "wateringFrequency": 5,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-16T11:00:00Z",
    "userId": "user123"
  }
}
```

### 5. Delete Plant

**DELETE** `/plants/:id`

Delete a plant.

**Parameters:**
- `id` (string): Plant ID

**Response:**
```json
{
  "success": true,
  "message": "Plant deleted successfully"
}
```

### 6. Water Plant

**POST** `/plants/:id/water`

Update the last watered date for a plant.

**Parameters:**
- `id` (string): Plant ID

**Body Parameters:**
- `wateredAt` (ISO date, optional): Custom watered date (defaults to now)

**Example:**
```json
{
  "wateredAt": "2024-01-16T14:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plant watered successfully",
  "data": {
    "id": "cljk1234567890",
    "name": "Monstera Deliciosa",
    "lastWatered": "2024-01-16T14:30:00Z",
    "wateringFrequency": 7,
    // ... other plant fields
  }
}
```

### 7. Get Plants Needing Water

**GET** `/plants/needs-water`

Get all plants that need watering based on their watering frequency.

**Response:**
```json
{
  "success": true,
  "message": "Plants needing water retrieved successfully",
  "data": [
    {
      "id": "cljk1234567890",
      "name": "Thirsty Plant",
      "lastWatered": "2024-01-01T10:00:00Z",
      "wateringFrequency": 7,
      // ... other plant fields
    }
  ],
  "count": 3
}
```

### 8. Get Plant Statistics

**GET** `/plants/stats`

Get plant statistics for the authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "Plant statistics retrieved successfully",
  "data": {
    "total": 15,
    "needsWatering": 3,
    "averageWateringFrequency": 8.2
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    {
      "field": "name",
      "message": "Plant name is required",
      "value": ""
    }
  ]
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (plant doesn't exist or doesn't belong to user)
- `409` - Conflict (plant name already exists for user)
- `413` - Payload Too Large (file size exceeded)
- `415` - Unsupported Media Type (invalid file type)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited:
- **Default**: 100 requests per 15 minutes per IP
- **File uploads**: Additional limits may apply

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## File Upload Specifications

**Supported formats:** JPEG, PNG, WebP
**Maximum size:** 10MB
**Field name:** `image`

Images are automatically optimized and stored in cloud storage with generated URLs returned in the `imageUrl` field.