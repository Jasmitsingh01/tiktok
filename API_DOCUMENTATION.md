# API Documentation

Complete API reference for the TikTok Automation Lambda Service.

## Base URL

```
https://zbmeo4jfp55axwwediyxhwl2qm0mveia.lambda-url.us-east-1.on.aws
```

## Authentication

Currently, the API uses username-based session management. Future versions may include API key authentication.

## Response Format

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* endpoint-specific data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type"
}
```

## Endpoints

### 1. Login

Authenticate a TikTok account and create a persistent session.

**Endpoint:** `POST /login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "verification_email": "string (required)"
}
```

**Parameters:**
- `username`: TikTok account username or email
- `password`: TikTok account password
- `verification_email`: Email address for receiving verification codes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful and session saved",
  "fromCache": false
}
```

**Success Response - Cached Session (200):**
```json
{
  "success": true,
  "message": "Session already active",
  "fromCache": true
}
```

**Error Responses:**

**400 - Missing Parameters:**
```json
{
  "success": false,
  "message": "Username, password and verification email are required"
}
```

**400 - Captcha Failed:**
```json
{
  "success": false,
  "message": "Failed to solve captcha"
}
```

**400 - Verification Failed:**
```json
{
  "success": false,
  "message": "Failed to enter verification code"
}
```

**500 - Server Error:**
```json
{
  "success": false,
  "message": "Internal server error: [error details]"
}
```

**Process Flow:**
1. Checks for existing valid session
2. If no session, launches browser with proxy
3. Navigates to TikTok login page
4. Enters credentials
5. Solves audio captcha if detected
6. Retrieves and enters email verification code
7. Saves session to MongoDB
8. Returns success response

**Session Validity:**
- Sessions are valid for 30 days
- Automatically reused if valid session exists
- Includes cookies, localStorage, and sessionStorage

**Example cURL:**
```bash
curl -X POST https://your-lambda-url/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "myaccount",
    "password": "mypassword",
    "verification_email": "myemail@example.com"
  }'
```

---

### 2. Logout

Invalidate and delete a user session from the database.

**Endpoint:** `POST /logout`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Username is required"
}
```

**Example cURL:**
```bash
curl -X POST https://your-lambda-url/logout \
  -H "Content-Type: application/json" \
  -d '{"username": "myaccount"}'
```

---

### 3. Upload Video

Upload a video to TikTok with a custom description.

**Endpoint:** `POST /upload`

**Request Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
- `file`: Video file (required) - Binary file upload
- `description`: Video caption/description (required) - String
- `username`: TikTok username (required) - String

**File Requirements:**
- Format: MP4, MOV, AVI, or other TikTok-supported formats
- Max size: Depends on TikTok limits (typically 287MB)
- Duration: 3 seconds to 10 minutes
- Aspect ratio: 9:16 (vertical) recommended

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "postId": "1234567890123456789"
}
```

**Error Responses:**

**400 - Missing File:**
```json
{
  "success": false,
  "message": "Video file is required"
}
```

**400 - Missing Parameters:**
```json
{
  "success": false,
  "message": "Video path and description are required"
}
```

**401 - No Session:**
```json
{
  "success": false,
  "message": "No valid session found. Please login first.",
  "requiresLogin": true
}
```

**400 - Upload Failed:**
```json
{
  "success": false,
  "message": "Failed to extract post ID from URL"
}
```

**Process Flow:**
1. Validates session exists
2. Restores session in browser
3. Navigates to TikTok Studio
4. Clicks upload button
5. Uploads video file
6. Enters description
7. Clicks post button
8. Extracts post ID from URL
9. Returns post ID for analytics

**Example cURL:**
```bash
curl -X POST https://your-lambda-url/upload \
  -F "file=@/path/to/video.mp4" \
  -F "description=Check out this amazing content! #viral #trending" \
  -F "username=myaccount"
```

**Example JavaScript (FormData):**
```javascript
const formData = new FormData();
formData.append('file', videoFile); // File object from input
formData.append('description', 'My awesome video! #tiktok');
formData.append('username', 'myaccount');

const response = await fetch('https://your-lambda-url/upload', {
  method: 'POST',
  body: formData
});
```

---

### 4. Warm-up Account

Perform automated account engagement to simulate human behavior.

**Endpoint:** `POST /warmup`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Warmup account successfully",
  "stats": {
    "videosWatched": 45,
    "videosLiked": 32,
    "usersFollowed": 9,
    "commentsPosted": 4
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "No valid session found. Please login first.",
  "requiresLogin": true
}
```

**Behavior Details:**

**Duration:** 10 minutes (600 seconds)

**Actions:**
- **Watch Videos**: 5-10 seconds per video
- **Like Videos**: 70% probability, checks if already liked
- **Follow Users**: 20% probability, checks if already following
- **Comment on Videos**: 10% probability, AI-generated contextual comments

**Human-like Features:**
- Random delays between actions (1-3 seconds)
- Variable watch times
- Mouse movement simulation
- Scroll patterns
- Profile checking (occasional)
- Comment reading before posting

**Anti-Detection:**
- Duplicate action prevention
- Natural timing variations
- Human-like mouse movements
- Random hesitations
- Profile hover simulation

**Example cURL:**
```bash
curl -X POST https://your-lambda-url/warmup \
  -H "Content-Type: application/json" \
  -d '{"username": "myaccount"}'
```

**Expected Timeline:**
```
0:00 - Start warm-up session
0:00-0:10 - Watch video 1, like
0:10-0:18 - Watch video 2, scroll
0:18-0:30 - Watch video 3, like, follow user
0:30-0:38 - Watch video 4, scroll
...
9:50-10:00 - Final video, return stats
```

---

### 5. Get Analytics

Retrieve analytics for a specific video post.

**Endpoint:** `POST /analysis`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)",
  "postId": "string (required)"
}
```

**Parameters:**
- `username`: TikTok account username
- `postId`: 19-digit post ID (obtained from upload response)

**Success Response (200):**
```json
{
  "success": true,
  "analytics": {
    "views": 12500,
    "likes": 850,
    "comments": 45,
    "shares": 23,
    "saves": 67,
    "engagement_rate": 7.34,
    "watch_time": "2.5 minutes average",
    "completion_rate": "65%",
    "traffic_sources": {
      "for_you": 8500,
      "following": 2000,
      "profile": 1500,
      "other": 500
    },
    "audience": {
      "gender": {
        "male": 45,
        "female": 55
      },
      "age_groups": {
        "13-17": 15,
        "18-24": 45,
        "25-34": 25,
        "35-44": 10,
        "45+": 5
      },
      "top_territories": [
        {"country": "US", "percentage": 35},
        {"country": "UK", "percentage": 15},
        {"country": "CA", "percentage": 10}
      ]
    }
  }
}
```

**Error Responses:**

**400 - Missing Parameters:**
```json
{
  "success": false,
  "error": "Missing required fields",
  "message": "Both postId and username are required"
}
```

**401 - No Session:**
```json
{
  "success": false,
  "message": "No valid session found. Please login first.",
  "requiresLogin": true
}
```

**400 - Analytics Error:**
```json
{
  "success": false,
  "error": "Get analytics failed",
  "message": "Error details",
  "solution": "Suggested solution"
}
```

**Process Flow:**
1. Validates session
2. Navigates to TikTok Studio analytics page
3. Waits for page to load (30 seconds)
4. Takes full-page screenshot
5. Sends screenshot to Google Gemini AI
6. Extracts structured analytics data
7. Returns parsed analytics

**Example cURL:**
```bash
curl -X POST https://your-lambda-url/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "username": "myaccount",
    "postId": "1234567890123456789"
  }'
```

**Note:** Analytics may take 30-60 seconds to retrieve due to page loading and AI processing.

---

### 6. Open Browser

Utility endpoint to open browser and navigate to TikTok.

**Endpoint:** `POST /open`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Browser opened successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "No valid session found. Please login first.",
  "requiresLogin": true
}
```

**Use Case:**
- Testing session validity
- Debugging browser issues
- Pre-warming browser before operations

---

## Rate Limits

**Recommended Limits:**
- Login: 1 request per 5 minutes per account
- Upload: 3 videos per hour per account
- Warmup: 1 session per 2 hours per account
- Analytics: 10 requests per minute per account

**TikTok Platform Limits:**
- Video uploads: ~10 per day per account
- Likes: ~500 per day per account
- Follows: ~200 per day per account
- Comments: ~50 per day per account

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - No valid session |
| 500  | Internal Server Error |

## Common Error Scenarios

### Session Expired
```json
{
  "success": false,
  "message": "No valid session found. Please login first.",
  "requiresLogin": true
}
```
**Solution:** Call `/login` endpoint to create new session.

### Captcha Challenge
```json
{
  "success": false,
  "message": "Failed to solve captcha"
}
```
**Solution:** Retry request or implement manual captcha solving.

### Upload Failed
```json
{
  "success": false,
  "message": "Failed to extract post ID from URL"
}
```
**Solution:** Check video format, size, and TikTok account status.

## Best Practices

### 1. Session Management
- Always check if session exists before operations
- Reuse sessions when possible (valid for 30 days)
- Handle session expiration gracefully

### 2. Upload Optimization
- Compress videos before upload
- Use optimal format (MP4, H.264)
- Keep descriptions under 150 characters
- Include relevant hashtags

### 3. Warm-up Strategy
- Run warm-up once per day
- Space out warm-up sessions (2-4 hours apart)
- Vary engagement patterns
- Don't overuse on new accounts

### 4. Analytics Timing
- Wait 1-2 hours after upload before checking analytics
- Check analytics periodically (every 6-12 hours)
- Don't poll analytics too frequently

### 5. Error Handling
- Implement exponential backoff for retries
- Log all errors for debugging
- Handle network timeouts gracefully
- Validate inputs before sending requests

## SDK Examples

### Node.js SDK Example

```javascript
class TikTokAutomationClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async login(username, password, verificationEmail) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, verification_email: verificationEmail })
    });
    return response.json();
  }

  async uploadVideo(username, videoFile, description) {
    const formData = new FormData();
    formData.append('file', videoFile);
    formData.append('description', description);
    formData.append('username', username);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }

  async warmup(username) {
    const response = await fetch(`${this.baseUrl}/warmup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return response.json();
  }

  async getAnalytics(username, postId) {
    const response = await fetch(`${this.baseUrl}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, postId })
    });
    return response.json();
  }

  async logout(username) {
    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return response.json();
  }
}

// Usage
const client = new TikTokAutomationClient('https://your-lambda-url');

// Login
await client.login('myaccount', 'mypassword', 'myemail@example.com');

// Upload video
const result = await client.uploadVideo('myaccount', videoFile, 'My video!');
console.log('Post ID:', result.postId);

// Warm-up
await client.warmup('myaccount');

// Get analytics
const analytics = await client.getAnalytics('myaccount', result.postId);
console.log('Views:', analytics.analytics.views);
```

### Python SDK Example

```python
import requests
from typing import Dict, Any

class TikTokAutomationClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def login(self, username: str, password: str, verification_email: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/login",
            json={
                "username": username,
                "password": password,
                "verification_email": verification_email
            }
        )
        return response.json()
    
    def upload_video(self, username: str, video_path: str, description: str) -> Dict[str, Any]:
        files = {'file': open(video_path, 'rb')}
        data = {'username': username, 'description': description}
        response = requests.post(f"{self.base_url}/upload", files=files, data=data)
        return response.json()
    
    def warmup(self, username: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/warmup",
            json={"username": username}
        )
        return response.json()
    
    def get_analytics(self, username: str, post_id: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/analysis",
            json={"username": username, "postId": post_id}
        )
        return response.json()
    
    def logout(self, username: str) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/logout",
            json={"username": username}
        )
        return response.json()

# Usage
client = TikTokAutomationClient("https://your-lambda-url")

# Login
client.login("myaccount", "mypassword", "myemail@example.com")

# Upload video
result = client.upload_video("myaccount", "video.mp4", "My video!")
print(f"Post ID: {result['postId']}")

# Warm-up
stats = client.warmup("myaccount")
print(f"Videos watched: {stats['stats']['videosWatched']}")

# Get analytics
analytics = client.get_analytics("myaccount", result['postId'])
print(f"Views: {analytics['analytics']['views']}")
```

## Webhooks (Future Feature)

Planned webhook support for asynchronous notifications:

- `upload.completed`: Triggered when video upload finishes
- `warmup.completed`: Triggered when warm-up session ends
- `analytics.updated`: Triggered when analytics data changes significantly

---

**Last Updated:** November 16, 2025  
**API Version:** 1.0.0

