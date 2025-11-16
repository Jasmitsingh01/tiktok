# Technical Architecture

Comprehensive technical documentation for the TikTok Automation Lambda Service.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Component Details](#component-details)
5. [Data Flow](#data-flow)
6. [Session Management](#session-management)
7. [Browser Automation](#browser-automation)
8. [Human Behavior Simulation](#human-behavior-simulation)
9. [Security Architecture](#security-architecture)
10. [Scalability Considerations](#scalability-considerations)
11. [Performance Optimization](#performance-optimization)

## System Overview

The TikTok Automation Lambda Service is a serverless application designed to automate TikTok interactions while maintaining human-like behavior patterns to avoid detection. The system leverages AWS Lambda for compute, MongoDB for session persistence, and Puppeteer for browser automation.

### Key Design Principles

1. **Stateless Execution**: Each Lambda invocation is independent
2. **Session Persistence**: User sessions stored in MongoDB for reuse
3. **Human-like Behavior**: Randomized delays, mouse movements, and interaction patterns
4. **Anti-Detection**: Duplicate action prevention and natural behavior simulation
5. **Scalability**: Serverless architecture for automatic scaling

## Technology Stack

### Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18.x | JavaScript execution environment |
| Framework | Express | 5.1.0 | HTTP server and routing |
| Browser | Puppeteer Core | 23.0.0 | Browser automation |
| Chromium | @sparticuz/chromium | 131.0.0 | Lambda-compatible Chromium |
| Database | MongoDB | 8.19.2 (Mongoose) | Session persistence |
| Serverless | serverless-http | 3.2.0 | Express to Lambda adapter |
| File Upload | Multer | 2.0.2 | Multipart form data handling |

### External Services

- **AWS Lambda**: Serverless compute
- **MongoDB Atlas**: Cloud database (recommended)
- **Proxy Service**: Residential proxy for IP rotation
- **Google Gemini AI**: Analytics interpretation
- **Email Service**: Verification code retrieval

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (HTTP Requests: cURL, Postman, Web Apps, Mobile Apps)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Lambda Function URL                       │
│                  (API Gateway Alternative)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Application                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Route Handlers                         │  │
│  │  /login  /logout  /upload  /warmup  /analysis  /open    │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────────┐ │
│  │                   Middleware Layer                         │ │
│  │  • Session Validation (requireSession)                    │ │
│  │  • File Upload (Multer)                                   │ │
│  │  • Error Handling                                         │ │
│  └────────────────────┬──────────────────────────────────────┘ │
└─────────────────────────┼──────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Controllers │  │   Models    │  │  Utilities  │
│             │  │             │  │             │
│ • Login     │  │ UserSession │  │ • Browser   │
│ • Upload    │  │   Schema    │  │ • Session   │
│ • Warmup    │  │             │  │   Manager   │
│ • Analysis  │  │             │  │ • Like      │
│ • Logout    │  │             │  │ • Follow    │
│             │  │             │  │ • Comment   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Puppeteer  │  │   MongoDB   │  │   External  │
│   Browser   │  │   Database  │  │   Services  │
│             │  │             │  │             │
│ • Chromium  │  │ • Sessions  │  │ • Proxy     │
│ • Pages     │  │ • Cookies   │  │ • Gemini AI │
│ • Actions   │  │ • Storage   │  │ • Email API │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Component Details

### 1. Entry Point (`index.js`)

**Responsibilities:**
- Initialize Express application
- Connect to MongoDB
- Define routes
- Export Lambda handler

**Key Code:**
```javascript
await connectDB();
const app = express();
app.post('/login', Login);
app.post('/upload', upload.single('file'), requireSession, UploadVideoToTiktok);
export const handler = serverless(app);
```

### 2. Controllers

#### Login Controller (`src/controller/login.js`)

**Flow:**
1. Validate input parameters
2. Check for existing valid session
3. If no session, launch browser
4. Navigate to TikTok login page
5. Enter credentials
6. Solve captcha if present
7. Handle email verification
8. Save session to database
9. Return success response

**Key Features:**
- Session reuse optimization
- Automatic captcha solving
- Email verification automation
- Proxy authentication

#### Upload Controller (`src/controller/UploadVideoToTiktok.js`)

**Flow:**
1. Validate file and description
2. Restore session from database
3. Navigate to TikTok Studio
4. Click upload button
5. Upload video file
6. Enter description
7. Click post button
8. Extract post ID from URL
9. Return post ID

**Key Features:**
- Session restoration
- File upload handling
- Post ID extraction
- Error handling

#### Warmup Controller (`src/controller/warmUpAccount.js`)

**Flow:**
1. Restore session
2. Navigate to TikTok For You page
3. Start 10-minute engagement loop
4. For each video:
   - Watch (5-10 seconds)
   - Randomly like (70%)
   - Randomly follow (20%)
   - Randomly comment (10%)
   - Scroll to next video
5. Return engagement statistics

**Key Features:**
- Human-like timing
- Random action selection
- Duplicate prevention
- Statistics tracking

#### Analysis Controller (`src/controller/Analysis.js`)

**Flow:**
1. Validate inputs
2. Restore session
3. Navigate to analytics page
4. Wait for page load
5. Take screenshot
6. Send to Gemini AI
7. Parse analytics data
8. Return structured data

**Key Features:**
- Screenshot capture
- AI-powered data extraction
- Error handling
- Structured response

### 3. Models

#### UserSession Model (`src/models/UserSession.js`)

**Schema:**
```javascript
{
  username: String (unique, indexed),
  type: String (TikTok/Instagram),
  cookies: Array,
  localStorage: Object,
  sessionStorage: Object,
  userAgent: String,
  lastLogin: Date,
  isValid: Boolean,
  metadata: {
    loginCount: Number,
    lastUsed: Date
  }
}
```

**Methods:**
- `markAsUsed()`: Update last used timestamp
- `isSessionValid()`: Check if session is still valid (< 30 days)

**Indexes:**
- `username`: Unique index for fast lookups

### 4. Utilities

#### Browser Manager (`src/utlis/Brower.js`)

**Purpose:** Initialize Puppeteer with Lambda-compatible Chromium

**Key Functions:**
```javascript
getBrowser(): Launch Chromium with Lambda-compatible settings
getPage(): Create new browser page
```

**Configuration:**
- Uses @sparticuz/chromium for Lambda compatibility
- Headless mode enabled
- Custom viewport settings
- Lambda-optimized arguments

#### Session Manager (`src/utlis/SessionManager.js`)

**Key Functions:**

1. **saveSession(page, username, type)**
   - Extract cookies from browser
   - Extract localStorage data
   - Extract sessionStorage data
   - Save to MongoDB
   - Return session object

2. **loadSession(page, username)**
   - Retrieve session from MongoDB
   - Validate session age
   - Restore cookies
   - Restore localStorage
   - Restore sessionStorage
   - Set user agent
   - Mark as used

3. **hasValidSession(username)**
   - Check if session exists
   - Validate session age
   - Return boolean

4. **invalidateSession(username)**
   - Mark session as invalid

5. **deleteSession(username)**
   - Remove session from database

**Session Validation:**
```javascript
isSessionValid() {
  const daysSinceLastLogin = (Date.now() - this.lastLogin) / (1000 * 60 * 60 * 24);
  return this.isValid && daysSinceLastLogin < 30;
}
```

#### Interaction Utilities

**LikeVideo.js:**
- Check if already liked
- Simulate watching video
- Human-like mouse movement
- Click like button
- Wait for animation
- Return success status

**FollowUser.js:**
- Check if already following
- Watch content first
- Check user profile (sometimes)
- Human-like mouse movement
- Click follow button
- Wait for confirmation
- Return success status

**CommentVideo.js:**
- Open comment section
- Read existing comments
- Extract comments for context
- Generate AI comment
- Human-like typing
- Review comment
- Post comment
- Close comment section
- Return success status

### 5. Middleware

#### Session Middleware (`src/middleware/sessionMiddleware.js`)

**requireSession:**
- Validates username in request
- Checks for valid session
- Loads session into browser
- Attaches page to request
- Returns 401 if no session

**optionalSession:**
- Checks for session
- Loads if available
- Continues without session if not found

#### File Upload Middleware (`src/middleware/fileupload.js`)

**Configuration:**
- Uses Multer for multipart/form-data
- Temporary file storage
- File size limits
- File type validation

## Data Flow

### Login Flow

```
Client Request
    ↓
Validate Input
    ↓
Check Existing Session? ──Yes──→ Return Cached Session
    ↓ No
Launch Browser
    ↓
Navigate to TikTok
    ↓
Enter Credentials
    ↓
Captcha Detected? ──Yes──→ Solve Captcha
    ↓ No
Verification Required? ──Yes──→ Get & Enter Code
    ↓ No
Save Session to MongoDB
    ↓
Return Success
```

### Upload Flow

```
Client Request (with file)
    ↓
Validate File & Description
    ↓
Check Session ──No Session──→ Return 401
    ↓ Valid Session
Load Session into Browser
    ↓
Navigate to TikTok Studio
    ↓
Click Upload Button
    ↓
Upload File
    ↓
Enter Description
    ↓
Click Post Button
    ↓
Wait for Upload Complete
    ↓
Extract Post ID
    ↓
Return Post ID
```

### Warmup Flow

```
Client Request
    ↓
Check Session ──No Session──→ Return 401
    ↓ Valid Session
Load Session
    ↓
Navigate to For You Page
    ↓
Start 10-Minute Loop
    ↓
┌─────────────────────┐
│ For Each Video:     │
│ • Watch (5-10s)     │
│ • Like? (70%)       │
│ • Follow? (20%)     │
│ • Comment? (10%)    │
│ • Scroll to Next    │
└─────────────────────┘
    ↓
Return Statistics
```

## Session Management

### Session Lifecycle

```
┌──────────┐
│  Login   │ ──────→ Create Session ──────→ Save to MongoDB
└──────────┘                                      │
                                                  ↓
┌──────────┐                              ┌──────────────┐
│Operation │ ──────→ Load Session ←────── │   MongoDB    │
└──────────┘              │               └──────────────┘
                          ↓
                   ┌──────────────┐
                   │ Use Session  │
                   └──────────────┘
                          │
                          ↓
                   ┌──────────────┐
                   │ Mark as Used │
                   └──────────────┘
                          │
                          ↓
                   ┌──────────────┐
                   │ Expire After │
                   │   30 Days    │
                   └──────────────┘
```

### Session Data Structure

```javascript
{
  _id: ObjectId,
  username: "myaccount",
  type: "TikTok",
  cookies: [
    {
      name: "sessionid",
      value: "encrypted_value",
      domain: ".tiktok.com",
      path: "/",
      expires: 1234567890,
      httpOnly: true,
      secure: true,
      sameSite: "Lax"
    },
    // ... more cookies
  ],
  localStorage: {
    "key1": "value1",
    "key2": "value2"
  },
  sessionStorage: {
    "key1": "value1"
  },
  userAgent: "Mozilla/5.0 ...",
  lastLogin: ISODate("2025-11-16T00:00:00Z"),
  isValid: true,
  metadata: {
    loginCount: 5,
    lastUsed: ISODate("2025-11-16T12:00:00Z")
  },
  createdAt: ISODate("2025-11-01T00:00:00Z"),
  updatedAt: ISODate("2025-11-16T12:00:00Z")
}
```

## Browser Automation

### Puppeteer Configuration

**Lambda-Optimized Settings:**
```javascript
{
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
    '--no-zygote'
  ],
  defaultViewport: { width: 1920, height: 1080 },
  executablePath: '/opt/chromium',
  headless: true
}
```

### Page Lifecycle

```
Launch Browser
    ↓
Create Page
    ↓
Set User Agent
    ↓
Authenticate Proxy
    ↓
Load Session (cookies, storage)
    ↓
Navigate to URL
    ↓
Wait for Selectors
    ↓
Perform Actions
    ↓
Extract Data
    ↓
Close Page
```

### Selector Strategy

**Priority Order:**
1. `data-e2e` attributes (most stable)
2. `aria-label` attributes
3. CSS classes (least stable)

**Example:**
```javascript
// Preferred
await page.waitForSelector('button[data-e2e="post_video_button"]');

// Fallback
await page.waitForSelector('button[aria-label="Post"]');

// Last resort
await page.waitForSelector('.post-button');
```

## Human Behavior Simulation

### Mouse Movement Algorithm

**Easing Function:**
```javascript
const ease = progress < 0.5 
    ? 2 * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
```

**Movement Steps:**
```javascript
const steps = 10 + Math.floor(Math.random() * 10); // 10-20 steps
for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const ease = easingFunction(progress);
    const x = startX + (targetX - startX) * ease;
    const y = startY + (targetY - startY) * ease;
    await page.mouse.move(x, y);
    await wait(10-30ms);
}
```

### Timing Patterns

| Action | Min Delay | Max Delay | Purpose |
|--------|-----------|-----------|---------|
| Watch Video | 5000ms | 10000ms | Simulate viewing |
| Like Hesitation | 200ms | 600ms | Natural pause |
| Follow Hesitation | 300ms | 800ms | Decision time |
| Typing Speed | 60ms | 150ms | Per character |
| Word Pause | 50ms | 100ms | Between words |
| Sentence Pause | 400ms | 900ms | After punctuation |
| Scroll Delay | 2000ms | 3000ms | Between videos |

### Randomization Strategy

**Action Probabilities:**
- Like: 70% (Math.random() > 0.3)
- Follow: 20% (Math.random() > 0.8)
- Comment: 10% (Math.random() > 0.9)

**Behavioral Variations:**
- Profile checking: 40% chance
- Comment reading: 40% chance
- Mouse hover: 30% chance
- Double-tap effect: 10% chance
- Hesitation: 25% chance

### Duplicate Prevention

**Like Check:**
```javascript
const isLiked = await page.evaluate(() => {
  const btn = document.querySelector('button[aria-label^="Like video"]');
  return btn && btn.getAttribute('aria-pressed') === 'true';
});
```

**Follow Check:**
```javascript
const isFollowing = await page.evaluate(() => {
  const btn = document.querySelector('button[data-e2e="feed-follow"]');
  const text = btn ? btn.innerText.trim().toLowerCase() : '';
  return text.includes('following') || text.includes('friends');
});
```

## Security Architecture

### Data Protection

**Sensitive Data:**
- User credentials (never stored)
- Session cookies (encrypted in MongoDB)
- Proxy credentials (environment variables)
- API keys (environment variables)

**Encryption:**
- MongoDB connection: TLS/SSL
- Lambda environment variables: AWS KMS
- Proxy connection: HTTPS

### Access Control

**Current:**
- Username-based session management
- No API authentication

**Recommended:**
```javascript
// API Key Middleware
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

### Input Validation

**Required Validations:**
- Username format
- File type and size
- Description length
- Post ID format (19 digits)

**Sanitization:**
- Remove special characters
- Escape HTML entities
- Validate URLs
- Check file MIME types

## Scalability Considerations

### Lambda Scaling

**Current Configuration:**
- Memory: 2048 MB
- Timeout: 900 seconds (15 minutes)
- Concurrent executions: AWS account limit

**Optimization:**
- Increase memory for faster execution
- Use provisioned concurrency for warm starts
- Implement connection pooling for MongoDB

### Database Scaling

**MongoDB Atlas:**
- Use M10+ tier for production
- Enable auto-scaling
- Configure read replicas
- Implement connection pooling

**Connection Pool:**
```javascript
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000
});
```

### Concurrent Operations

**Limitations:**
- One browser instance per Lambda
- Sequential video processing
- Session lock mechanism needed

**Solutions:**
- Use Step Functions for orchestration
- Implement job queue (SQS)
- Add distributed locking (Redis)

## Performance Optimization

### Cold Start Reduction

**Strategies:**
1. Minimize dependencies
2. Use Lambda layers for Chromium
3. Implement provisioned concurrency
4. Lazy load modules

**Example:**
```javascript
// Lazy load heavy modules
let puppeteer;
async function getBrowser() {
  if (!puppeteer) {
    puppeteer = await import('puppeteer-core');
  }
  return puppeteer.launch(...);
}
```

### Memory Optimization

**Techniques:**
- Close pages after use
- Clear browser cache
- Limit screenshot resolution
- Stream large files

**Example:**
```javascript
// Close unused pages
const pages = await browser.pages();
for (const page of pages.slice(1)) {
  await page.close();
}
```

### Network Optimization

**Strategies:**
- Block unnecessary resources
- Use connection keep-alive
- Implement request caching
- Compress responses

**Example:**
```javascript
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});
```

### Database Optimization

**Indexes:**
```javascript
UserSessionSchema.index({ username: 1 }, { unique: true });
UserSessionSchema.index({ lastLogin: 1 });
UserSessionSchema.index({ 'metadata.lastUsed': 1 });
```

**Query Optimization:**
```javascript
// Use lean() for read-only queries
const session = await UserSession.findOne({ username }).lean();

// Project only needed fields
const session = await UserSession.findOne({ username })
  .select('cookies localStorage sessionStorage');
```

## Monitoring and Logging

### Recommended Logging

**CloudWatch Logs:**
```javascript
console.log(`[${new Date().toISOString()}] [INFO] Operation started`);
console.error(`[${new Date().toISOString()}] [ERROR] ${error.message}`);
```

**Metrics to Track:**
- Login success rate
- Upload success rate
- Session reuse rate
- Average execution time
- Error rates by type
- Warmup engagement rates

### Alerting

**Critical Alerts:**
- High error rate (> 5%)
- Long execution time (> 10 minutes)
- Database connection failures
- Proxy failures

**Monitoring Tools:**
- AWS CloudWatch
- MongoDB Atlas Monitoring
- Custom dashboards

---

**Document Version:** 1.0.0  
**Last Updated:** November 16, 2025  
**Maintained By:** Development Team

