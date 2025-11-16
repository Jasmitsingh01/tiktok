# TikTok Automation Lambda Service

A comprehensive serverless automation system for TikTok that handles authentication, video uploads, account warm-up, and analytics tracking using AWS Lambda and Puppeteer.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## 🎯 Overview

This project is a serverless TikTok automation system built with Node.js, Express, and Puppeteer, designed to run on AWS Lambda. It provides automated solutions for:

- **Authentication**: Automated login with captcha solving and email verification
- **Session Management**: Persistent session storage using MongoDB
- **Video Upload**: Automated video posting with descriptions
- **Account Warm-up**: Human-like engagement (likes, follows, comments)
- **Analytics**: Video performance tracking and analysis

## ✨ Features

### 🔐 Authentication & Session Management
- Automated TikTok login with proxy support
- Audio captcha solving capability
- Email verification code retrieval and entry
- Session persistence (30-day validity)
- Cookie, localStorage, and sessionStorage management

### 📹 Video Operations
- Automated video upload to TikTok Studio
- Custom description/caption support
- Post ID extraction for analytics tracking
- Multi-format video support

### 🤖 Human-like Account Warm-up
- Intelligent video watching simulation
- Random like interactions (70% probability)
- Follow users (20% probability)
- AI-generated contextual comments (10% probability)
- Human-like mouse movements and delays
- 10-minute automated engagement sessions

### 📊 Analytics
- Video performance tracking
- Screenshot-based analytics capture
- AI-powered analytics interpretation (Gemini integration)

### 🛡️ Anti-Detection Features
- Human-like mouse movements with easing
- Random delays and hesitations
- Duplicate action prevention
- Natural scrolling patterns
- Variable typing speeds
- Profile checking simulation

## 🏗️ Architecture

```
┌─────────────────┐
│   AWS Lambda    │
│   (Serverless)  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Express │
    │   API   │
    └────┬────┘
         │
    ┌────▼─────────────────────┐
    │                          │
┌───▼────┐  ┌──────▼──────┐  ┌▼────────┐
│Puppeteer│  │   MongoDB   │  │ Proxy   │
│ Browser │  │  (Sessions) │  │ Service │
└─────────┘  └─────────────┘  └─────────┘
```

## 📦 Prerequisites

- Node.js 18.x or higher
- MongoDB database (local or cloud)
- AWS Account (for Lambda deployment)
- Proxy service (optional but recommended)
- Email service for verification codes
- Google Gemini API key (for analytics)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd tiktok
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tiktok-automation

# Proxy Configuration (Optional)
PROXY_USERNAME=your_proxy_username
PROXY_PASSWORD=your_proxy_password
PROXY_SERVER=your_proxy_server:port

# Google Gemini API (for analytics)
GEMINI_API_KEY=your_gemini_api_key

# Email Service (for verification codes)
EMAIL_API_KEY=your_email_api_key
EMAIL_SERVICE_URL=your_email_service_url
```

4. **Test locally**
```bash
npm start
```

## ⚙️ Configuration

### MongoDB Setup

The system uses MongoDB to store user sessions. The database schema includes:

- **UserSession Collection**:
  - `username`: Unique TikTok username
  - `type`: Platform type (TikTok/Instagram)
  - `cookies`: Browser cookies array
  - `localStorage`: Local storage data
  - `sessionStorage`: Session storage data
  - `userAgent`: Browser user agent
  - `lastLogin`: Last login timestamp
  - `isValid`: Session validity flag
  - `metadata`: Login count and last used timestamp

### Proxy Configuration

For better anti-detection, configure a residential proxy:

```javascript
await page.authenticate({
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
});
```

## 🔌 API Endpoints

### 1. **POST /login**
Authenticate a TikTok account and create a session.

**Request Body:**
```json
{
  "username": "your_tiktok_username",
  "password": "your_password",
  "verification_email": "your_email@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful and session saved",
  "fromCache": false
}
```

**Features:**
- Automatic captcha solving
- Email verification code handling
- Session persistence
- Duplicate login prevention

---

### 2. **POST /logout**
Invalidate and delete a user session.

**Request Body:**
```json
{
  "username": "your_tiktok_username"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 3. **POST /upload**
Upload a video to TikTok with a description.

**Request (multipart/form-data):**
- `file`: Video file (required)
- `description`: Video caption (required)
- `username`: TikTok username (required)

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "postId": "1234567890123456789"
}
```

**Process:**
1. Validates session
2. Navigates to TikTok Studio
3. Uploads video file
4. Adds description
5. Posts video
6. Extracts post ID for analytics

---

### 4. **POST /warmup**
Perform automated account warm-up with human-like engagement.

**Request Body:**
```json
{
  "username": "your_tiktok_username"
}
```

**Response:**
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

**Behavior:**
- Runs for 10 minutes
- Watches videos (5-10 seconds each)
- Randomly likes videos (70% chance)
- Randomly follows users (20% chance)
- Randomly comments (10% chance with AI)
- Human-like mouse movements
- Variable delays between actions

---

### 5. **POST /analysis**
Get analytics for a specific video post.

**Request Body:**
```json
{
  "username": "your_tiktok_username",
  "postId": "1234567890123456789"
}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "views": 12500,
    "likes": 850,
    "comments": 45,
    "shares": 23,
    "engagement_rate": 7.34,
    "watch_time": "2.5 minutes average"
  }
}
```

**Process:**
1. Navigates to TikTok Studio analytics
2. Takes full-page screenshot
3. Uses Google Gemini AI to extract metrics
4. Returns structured analytics data

---

### 6. **POST /open**
Open browser and navigate to TikTok (utility endpoint).

**Request Body:**
```json
{
  "username": "your_tiktok_username"
}
```

## 💡 Usage Examples

### Example 1: Complete Workflow

```javascript
// 1. Login
const loginResponse = await fetch('https://your-lambda-url/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'myaccount',
    password: 'mypassword',
    verification_email: 'myemail@example.com'
  })
});

// 2. Upload Video
const formData = new FormData();
formData.append('file', videoFile);
formData.append('description', 'Check out this amazing content! #viral');
formData.append('username', 'myaccount');

const uploadResponse = await fetch('https://your-lambda-url/upload', {
  method: 'POST',
  body: formData
});

const { postId } = await uploadResponse.json();

// 3. Warm-up Account
await fetch('https://your-lambda-url/warmup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'myaccount' })
});

// 4. Get Analytics
const analyticsResponse = await fetch('https://your-lambda-url/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'myaccount',
    postId: postId
  })
});
```

### Example 2: Python Integration

```python
import requests

BASE_URL = "https://your-lambda-url"

# Login
login_data = {
    "username": "myaccount",
    "password": "mypassword",
    "verification_email": "myemail@example.com"
}
response = requests.post(f"{BASE_URL}/login", json=login_data)
print(response.json())

# Upload Video
files = {'file': open('video.mp4', 'rb')}
data = {
    'description': 'My awesome video!',
    'username': 'myaccount'
}
response = requests.post(f"{BASE_URL}/upload", files=files, data=data)
print(response.json())
```

## 📁 Project Structure

```
tiktok/
├── index.js                          # Main Express app & Lambda handler
├── package.json                      # Dependencies
├── trust-policy.json                 # AWS IAM trust policy
├── function.zip                      # Deployment package
│
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection
│   │
│   ├── controller/
│   │   ├── login.js                 # Login controller
│   │   ├── Logout.js                # Logout controller
│   │   ├── UploadVideoToTiktok.js   # Video upload controller
│   │   ├── warmUpAccount.js         # Account warm-up controller
│   │   ├── Analysis.js              # Analytics controller
│   │   └── Open.js                  # Browser open utility
│   │
│   ├── middleware/
│   │   ├── fileupload.js            # Multer file upload config
│   │   └── sessionMiddleware.js     # Session validation middleware
│   │
│   ├── models/
│   │   └── UserSession.js           # MongoDB session schema
│   │
│   └── utlis/
│       ├── Brower.js                # Puppeteer browser setup
│       ├── SessionManager.js        # Session save/load/validate
│       ├── LikeVideo.js             # Like interaction logic
│       ├── FollowUser.js            # Follow interaction logic
│       ├── CommentVideo.js          # Comment interaction logic
│       ├── ScrollVideo.js           # Video scrolling
│       ├── GetVideoAnalytics.js     # Analytics fetching
│       ├── AnalyzeTikTokVideoWithGemini.js  # AI analytics
│       ├── solveAudioCaptcha.js     # Captcha solver
│       ├── getVerifiactionCode.js   # Email code retrieval
│       ├── enterVerificationCode.js # Code entry automation
│       ├── extractAndSaveComments.js # Comment extraction
│       ├── getAiHumanizedComment.js # AI comment generation
│       ├── CheckUserAndLikeStatus.js # Duplicate prevention
│       ├── RandomDelay.js           # Random delay generator
│       └── WaitForSomeTime.js       # Wait utility
```

## 🔑 Key Components

### 1. Browser Management (`Brower.js`)

Uses `@sparticuz/chromium` for AWS Lambda compatibility:

```javascript
export async function getBrowser() {
  return await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}
```

### 2. Session Manager (`SessionManager.js`)

**Key Functions:**
- `saveSession(page, username, type)`: Saves cookies and storage
- `loadSession(page, username)`: Restores session
- `hasValidSession(username)`: Checks session validity
- `invalidateSession(username)`: Marks session as invalid
- `deleteSession(username)`: Removes session from database

**Session Validity:**
- Sessions expire after 30 days
- Automatically validates on each use
- Tracks login count and last used timestamp

### 3. Human-like Interactions

**Mouse Movement Algorithm:**
```javascript
// Easing function for natural movement
const ease = progress < 0.5 
    ? 2 * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
```

**Random Delays:**
- Watch time: 5-10 seconds
- Like hesitation: 200-600ms
- Follow hesitation: 300-800ms
- Comment typing: 60-150ms per character
- Scroll delay: 2-3 seconds

### 4. Anti-Detection Features

- **Duplicate Prevention**: Checks if already liked/followed
- **Human Patterns**: Random pauses, mouse movements, hesitations
- **Variable Timing**: No fixed intervals
- **Natural Scrolling**: Smooth scroll with random amounts
- **Profile Checking**: Sometimes hovers over usernames
- **Comment Reading**: Scrolls through existing comments

## 🚢 Deployment

### AWS Lambda Deployment

1. **Create deployment package**
```bash
zip -r function.zip . -x "*.git*" "node_modules/@sparticuz/chromium/bin/*"
```

2. **Create Lambda function**
```bash
aws lambda create-function \
  --function-name tiktok-automation \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 900 \
  --memory-size 2048
```

3. **Create Function URL**
```bash
aws lambda create-function-url-config \
  --function-name tiktok-automation \
  --auth-type NONE
```

4. **Configure environment variables**
```bash
aws lambda update-function-configuration \
  --function-name tiktok-automation \
  --environment Variables="{MONGODB_URI=your_uri,PROXY_USERNAME=user,PROXY_PASSWORD=pass}"
```

### Using Serverless Framework

```yaml
# serverless.yml
service: tiktok-automation

provider:
  name: aws
  runtime: nodejs18.x
  timeout: 900
  memorySize: 2048

functions:
  api:
    handler: index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
```

Deploy:
```bash
serverless deploy
```

## 🐛 Troubleshooting

### Common Issues

**1. Session Not Found**
```
Error: No valid session found. Please login first.
```
**Solution**: Call `/login` endpoint first to create a session.

---

**2. Captcha Not Solving**
```
Error: Failed to solve captcha
```
**Solution**: 
- Check audio captcha solver configuration
- Increase timeout values
- Consider manual intervention fallback

---

**3. Video Upload Fails**
```
Error: Not enough analytics containers found
```
**Solution**:
- Ensure video file is valid format
- Check TikTok Studio page structure hasn't changed
- Verify session is still valid

---

**4. MongoDB Connection Error**
```
Error: MongoDB Connection Error
```
**Solution**:
- Verify `MONGODB_URI` environment variable
- Check MongoDB server is running
- Ensure network connectivity from Lambda

---

**5. Lambda Timeout**
```
Error: Task timed out after 900.00 seconds
```
**Solution**:
- Increase Lambda timeout (max 15 minutes)
- Optimize operations
- Consider breaking into multiple Lambda functions

## 🔒 Security Considerations

### Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Proxy Usage**: Use residential proxies to avoid IP bans
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **Session Encryption**: Consider encrypting session data in MongoDB
5. **API Authentication**: Add authentication layer (API keys, JWT)
6. **Input Validation**: Sanitize all user inputs
7. **Error Handling**: Don't expose internal errors to clients

### Recommended Security Additions

```javascript
// Add API key middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Add rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

## 📊 Performance Optimization

### Tips for Better Performance

1. **Session Reuse**: Always reuse existing sessions
2. **Parallel Operations**: Use Promise.all() for independent operations
3. **Lazy Loading**: Only load browser when needed
4. **Memory Management**: Close pages after operations
5. **Database Indexing**: Index username field in MongoDB
6. **Caching**: Cache frequently accessed data

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is for educational purposes only. Use responsibly and in accordance with TikTok's Terms of Service.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Automated interactions with TikTok may violate their Terms of Service. Use at your own risk. The authors are not responsible for any consequences of using this software.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## 🔄 Version History

- **v1.0.0** (Current)
  - Initial release
  - Login automation
  - Video upload
  - Account warm-up
  - Analytics tracking
  - Session management

---

**Built with ❤️ using Node.js, Express, Puppeteer, and AWS Lambda**

