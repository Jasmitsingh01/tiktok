import express from "express";
import dotenv from "dotenv";
import Login from "./src/controller/login.js";
import Logout from "./src/controller/Logout.js";
import UploadVideoToTiktok from "./src/controller/UploadVideoToTiktok.js";
import upload from "./src/middleware/fileupload.js";
import warmUpAccount from "./src/controller/warmUpAccount.js";
import { browser } from "./src/utlis/Brower.js";
import connectDB from "./src/config/database.js";
import { requireSession } from "./src/middleware/sessionMiddleware.js";
import Open from "./src/controller/Open.js";
import Analysis from "./src/controller/Analysis.js";
import serverless from 'serverless-http';
dotenv.config();

// Connect to MongoDB
await connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', Login);
app.post('/logout', Logout);
app.post('/open',requireSession, Open);  
// Upload route with optional session middleware and login fallback
app.post('/upload', upload.single('file'), requireSession, UploadVideoToTiktok);

// Warmup route with required session (must login first)
app.post('/warmup', requireSession, warmUpAccount);

// Analysis route with required session (must login first)
app.post('/analysis', requireSession, Analysis);


export const handler = serverless(app);