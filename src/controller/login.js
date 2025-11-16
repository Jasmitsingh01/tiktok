import { browser } from "../utlis/Brower.js";
import solveAudioCaptcha from "../utlis/solveAudioCaptcha.js";
import getVerificationCode from "../utlis/getVerifiactionCode.js";
import enterVerificationCode from "../utlis/enterVerificationCode.js";
import WaitForSomeTime from "../utlis/WaitForSomeTime.js";
import { saveSession, hasValidSession } from "../utlis/SessionManager.js";

export default async function Login(req, res, next){
    try {
        const { username, password , verification_email } = req.body;
        console.log("🔑 Login request received:", req.body);
        if(!username || !password || !verification_email){
            return res.status(400).json({ success: false, message: "Username, password and verification email are required" });
        }
        
        // Check if valid session already exists
        const hasSession = await hasValidSession(username);
        if (hasSession) {
            console.log(`✅ Valid session already exists for ${username}. Skipping login.`);
            if (next) {
                return next(); // Continue to next middleware if this is called from upload route
            }
            return res.status(200).json({ 
                success: true, 
                message: "Session already active",
                fromCache: true 
            });
        }
        
        console.log(`🔑 No valid session found for ${username}. Performing fresh login...`);
        const {page}= await browser;
      
        await page.authenticate({
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD
          });
     
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
        await page.goto('https://www.tiktok.com/login/phone-or-email/email', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
          await page.waitForSelector('input[name="username"]', { timeout: 10000 });
          await page.type('input[name="username"]', username, { delay: 100 });
          await page.waitForSelector('input[type="password"]', { timeout: 10000 });
          await page.type('input[type="password"]', password, { delay: 120 });      
          await page.keyboard.press('Enter');
          await WaitForSomeTime(60000/3);
          const captchaContainer = await page.$('#captcha-verify-container-main-page');
          if (captchaContainer) {
            console.log('🎯 Captcha detected, solving...');
            const solved = await solveAudioCaptcha(page);
            if (!solved) {
              console.log('⚠️ Failed to solve captcha, waiting for manual solve...');
              await WaitForSomeTime(60000/2);
              return res.status(400).json({ success: false, message: "Failed to solve captcha" });
            }
          }
          await WaitForSomeTime(60000/4);
          const needsVerification = await page.evaluate(() => {
            return document.body.textContent.includes('verification code') ||
                   document.body.textContent.includes('Enter code') ||
                   document.querySelector('#twv-code') !== null ||
                   document.querySelector('.twv-components-mobile-code-input') !== null;
          });
          if (needsVerification) {
            console.log('🔐 Email verification required');
            const verificationCode = await getVerificationCode(verification_email);
            if (verificationCode) {
              const success = await enterVerificationCode(page, verificationCode);
              if (!success) {
                console.warn('❌ Verification code entry failed, waiting for manual input...');
                await WaitForSomeTime(60000/2);
                return res.status(400).json({ success: false, message: "Failed to enter verification code" });
              }
            } else {
              console.warn('❌ Could not retrieve verification code');
              await WaitForSomeTime(60000/2);
              return res.status(400).json({ success: false, message: "Failed to retrieve verification code" });
            }
          }
          
          // Navigate to TikTok Studio after successful login
          
          await WaitForSomeTime(5000);
          const captchaContainer2 = await page.$('#captcha-verify-container-main-page');
          if (captchaContainer2) {
            console.log('🎯 Captcha detected, solving...');
            const solved = await solveAudioCaptcha(page);
            if (!solved) {
              console.log('⚠️ Failed to solve captcha, waiting for manual solve...');
              await WaitForSomeTime(60000/2);
              return res.status(400).json({ success: false, message: "Failed to solve captcha" });
            }
          }
          console.log('✅ Successfully logged in');
          await WaitForSomeTime(5000);
          
          // Save session to database
          try {
            await saveSession(page, username, "TikTok");
            console.log('💾 Session data saved to database');
          } catch (sessionError) {
            console.error('⚠️  Failed to save session:', sessionError.message);
            // Continue even if session save fails
          }
          
          // If this is called from middleware (next exists), continue to next route
          if (next) {
            return next();
          }
          
          return res.status(200).json({ 
            success: true, 
            message: "Login successful and session saved",
            fromCache: false 
          });
        } catch (error) {
            console.error('❌ Login error:', error);
            return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
        }
    }
