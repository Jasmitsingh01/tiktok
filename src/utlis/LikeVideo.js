import WaitForSomeTime from "./WaitForSomeTime.js";
import RandomDelay from "./RandomDelay.js";
import { checkUserAndLikeStatus } from "./CheckUserAndLikeStatus.js";

/**
 * Simulate human-like mouse movement to an element
 */
async function humanMouseMove(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element) return false;
        
        const box = await element.boundingBox();
        if (!box) return false;
        
        // Get current mouse position
        const currentPos = await page.evaluate(() => ({
            x: window.lastMouseX || window.innerWidth / 2,
            y: window.lastMouseY || window.innerHeight / 2
        }));
        
        // Calculate target position (random point within element)
        const targetX = box.x + box.width * (0.3 + Math.random() * 0.4);
        const targetY = box.y + box.height * (0.3 + Math.random() * 0.4);
        
        // Move mouse in steps (more human-like)
        const steps = 10 + Math.floor(Math.random() * 10);
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            // Easing function for more natural movement
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const x = currentPos.x + (targetX - currentPos.x) * ease;
            const y = currentPos.y + (targetY - currentPos.y) * ease;
            
            await page.mouse.move(x, y);
            await WaitForSomeTime(RandomDelay(10, 30));
        }
        
        // Store last position
        await page.evaluate((x, y) => {
            window.lastMouseX = x;
            window.lastMouseY = y;
        }, targetX, targetY);
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Simulate human reading/watching behavior
 */
async function simulateWatchingVideo(page) {
    // Random watch time between 2-5 seconds
    const watchTime = RandomDelay(2000, 5000);
    console.log(`👀 Watching video for ${(watchTime / 1000).toFixed(1)}s...`);
    
    // Occasionally move mouse during watching (30% chance)
    if (Math.random() < 0.3) {
        await WaitForSomeTime(watchTime / 2);
        
        // Move mouse to random area (simulate checking description, etc.)
        const randomX = 300 + Math.random() * 400;
        const randomY = 300 + Math.random() * 400;
        await page.mouse.move(randomX, randomY, { steps: 20 });
        
        await WaitForSomeTime(watchTime / 2);
    } else {
        await WaitForSomeTime(watchTime);
    }
}

/**
 * Like a video with human-like behavior
 * @param {Object} page - Puppeteer page instance
 * @returns {boolean} - true if liked, false if skipped or failed
 */
export default async function LikeVideo(page) {
    try {
      console.log('🎬 Starting human-like like interaction...');
      
      // Wait for like button to be visible
      await page.waitForSelector('button[aria-label^="Like video"]', { 
        visible: true, 
        timeout: 10000 
      });
      
      // Get current video's username
      const targetUsername = await page.evaluate(() => {
        const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
        return usernameElement ? usernameElement.textContent.trim() : null;
      });
      
      // Check if video is already liked
      const status = await checkUserAndLikeStatus(page, targetUsername);
      
      if (status.isLiked) {
        console.log(`ℹ️  Video from ${targetUsername} already liked, skipping...`);
        return false; // Don't count as new like
      }
      
      console.log(`✅ Video from ${targetUsername} - proceeding to like`);
      
      // Simulate watching the video first (more human-like)
      await simulateWatchingVideo(page);
      
      // Sometimes hover over username first (20% chance)
      if (Math.random() < 0.2) {
        console.log('👤 Checking username...');
        const usernameSelector = 'p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText';
        await humanMouseMove(page, usernameSelector);
        await WaitForSomeTime(RandomDelay(500, 1000));
      }
      
      // Move mouse to like button in human-like way
      console.log('🖱️  Moving to like button...');
      await humanMouseMove(page, 'button[aria-label^="Like video"]');
      
      // Brief pause before clicking (humans don't click instantly)
      await WaitForSomeTime(RandomDelay(200, 600));
      
      // Sometimes double-tap effect (10% chance)
      if (Math.random() < 0.1) {
        console.log('💫 Double-tap effect...');
        // Double click like button (TikTok style)
        await page.click('button[aria-label^="Like video"]');
        await WaitForSomeTime(RandomDelay(100, 200));
      }
      
      // Click like button
      await page.click('button[aria-label^="Like video"]');
      console.log('❤️  Liked video successfully!');
      
      // Wait for the like animation to complete
      await page.waitForFunction(() => {
        const btn = document.querySelector('button[aria-label^="Like video"]');
        return btn && btn.getAttribute('aria-pressed') === 'true';
      }, { timeout: 5000 });
      
      // Watch the like animation (humans pause to see the heart animation)
      await WaitForSomeTime(RandomDelay(800, 1500));
      
      // Sometimes move mouse away from like button (40% chance)
      if (Math.random() < 0.4) {
        const randomX = 400 + Math.random() * 200;
        const randomY = 400 + Math.random() * 200;
        await page.mouse.move(randomX, randomY, { steps: 15 });
      }
      
      // Brief wait for server persistence
      await WaitForSomeTime(RandomDelay(500, 1000));
      
      console.log('✅ Like interaction completed');
      return true;
    } catch (error) {
      console.error('❌ Like failed:', error.message);
      return false;
    }
  }