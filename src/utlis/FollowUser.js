import WaitForSomeTime from './WaitForSomeTime.js';
import RandomDelay from './RandomDelay.js';

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
 * Simulate checking user profile before following
 */
async function checkUserProfile(page) {
    // Sometimes hover over username to "check" profile (40% chance)
    if (Math.random() < 0.4) {
        console.log('👤 Checking user profile...');
        
        // Try to find and hover over username element
        const usernameSelector = 'p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText';
        const usernameElement = await page.$(usernameSelector);
        
        if (usernameElement) {
            await humanMouseMove(page, usernameSelector);
            await WaitForSomeTime(RandomDelay(800, 1500));
            
            // Sometimes move back to center (simulate looking at video again)
            if (Math.random() < 0.5) {
                const centerX = 500 + Math.random() * 200;
                const centerY = 400 + Math.random() * 200;
                await page.mouse.move(centerX, centerY, { steps: 15 });
                await WaitForSomeTime(RandomDelay(500, 1000));
            }
        }
    }
}

/**
 * Simulate watching content before following
 */
async function watchBeforeFollow(page) {
    // Watch a bit of the video before following (humans usually watch first)
    const watchTime = RandomDelay(2000, 4000);
    console.log(`👀 Watching content (${(watchTime / 1000).toFixed(1)}s) before following...`);
    
    // Sometimes move mouse during watching (25% chance)
    if (Math.random() < 0.25) {
        await WaitForSomeTime(watchTime / 2);
        
        const randomX = 350 + Math.random() * 400;
        const randomY = 300 + Math.random() * 400;
        await page.mouse.move(randomX, randomY, { steps: 20 });
        
        await WaitForSomeTime(watchTime / 2);
    } else {
        await WaitForSomeTime(watchTime);
    }
}

/**
 * Follow a user with human-like behavior
 */
export default async function FollowUser(page) {
    try {
      console.log('\n👥 Starting human-like follow interaction...');
      
      // Wait for follow button with better error handling
      try {
        await page.waitForSelector('button[data-e2e="feed-follow"]', { 
          visible: true, 
          timeout: 8000 
        });
      } catch (selectorError) {
        console.error('⚠️  Follow button not found within timeout');
        // Try to check if button exists but not visible
        const buttonExists = await page.$('button[data-e2e="feed-follow"]');
        if (buttonExists) {
          console.log('ℹ️  Button exists but may not be visible, attempting anyway...');
        } else {
          console.error('❌ Follow button does not exist on this page');
          return false;
        }
      }
      
      // Check if already following
      const buttonText = await page.evaluate(() => {
        const btn = document.querySelector('button[data-e2e="feed-follow"]');
        return btn ? btn.innerText.trim().toLowerCase() : '';
      });
      
      console.log(`🔍 Button text: "${buttonText}"`);
      
      if (buttonText.includes('following') || buttonText.includes('friends') || buttonText.includes('unfollow')) {
        console.log('ℹ️  Already following this user, skipping...');
        return false; // Don't count as new follow
      }
      
      // Get username for logging
      const username = await page.evaluate(() => {
        const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
        return usernameElement ? usernameElement.textContent.trim() : 'Unknown';
      });
      
      console.log(`✅ User: ${username} - proceeding to follow`);
      
      // Watch content before following (human behavior)
      await watchBeforeFollow(page);
      
      // Check user profile (sometimes)
      await checkUserProfile(page);
      
      // Move mouse to follow button in human-like way
      console.log('🖱️  Moving to follow button...');
      await humanMouseMove(page, 'button[data-e2e="feed-follow"]');
      
      // Brief pause before clicking (humans hesitate slightly)
      const hesitationTime = RandomDelay(300, 800);
      console.log(`🤔 Hesitation (${(hesitationTime / 1000).toFixed(1)}s)...`);
      await WaitForSomeTime(hesitationTime);
      
      // Sometimes move mouse slightly away and back (20% chance - simulate uncertainty)
      if (Math.random() < 0.2) {
        console.log('💭 Second thought...');
        const nearbyX = (await page.$eval('button[data-e2e="feed-follow"]', el => el.getBoundingClientRect().x)) + RandomDelay(-30, 30);
        const nearbyY = (await page.$eval('button[data-e2e="feed-follow"]', el => el.getBoundingClientRect().y)) + RandomDelay(-30, 30);
        await page.mouse.move(nearbyX, nearbyY, { steps: 8 });
        await WaitForSomeTime(RandomDelay(400, 800));
        
        // Move back to button
        await humanMouseMove(page, 'button[data-e2e="feed-follow"]');
        await WaitForSomeTime(RandomDelay(200, 400));
      }
      
      // Click follow button
      console.log('👆 Clicking follow button...');
      await page.click('button[data-e2e="feed-follow"]');
      console.log('💚 Follow button clicked!');
      
      // Wait for confirmation with multiple methods
      try {
        await page.waitForFunction(() => {
          const btn = document.querySelector('button[data-e2e="feed-follow"]');
          const text = btn ? btn.innerText.trim().toLowerCase() : '';
          return text.includes('following') || text.includes('friends') || text.includes('unfollow');
        }, { timeout: 5000 });
        console.log('✅ Follow confirmed via button text change');
      } catch (waitError) {
        // If button text doesn't change, check if button exists and is clickable
        const buttonStillExists = await page.$('button[data-e2e="feed-follow"]');
        if (buttonStillExists) {
          console.log('⚠️  Button text did not change, but follow likely succeeded');
        } else {
          console.log('⚠️  Could not confirm follow, but action was performed');
        }
      }
      
      // Watch the follow animation/confirmation (humans pause to see result)
      await WaitForSomeTime(RandomDelay(1000, 2000));
      
      // Sometimes move mouse away from button after following (50% chance)
      if (Math.random() < 0.5) {
        const randomX = 400 + Math.random() * 300;
        const randomY = 300 + Math.random() * 300;
        await page.mouse.move(randomX, randomY, { steps: 15 });
      }
      
      // Additional wait for server persistence
      const persistTime = RandomDelay(1500, 2500);
      console.log(`⏳ Waiting ${(persistTime / 1000).toFixed(1)}s for server persistence...`);
      await WaitForSomeTime(persistTime);
      
      // Sometimes check the follow button again (15% chance - verify action)
      if (Math.random() < 0.15) {
        try {
          console.log('✓ Verifying follow status...');
          const verifyText = await page.evaluate(() => {
            const btn = document.querySelector('button[data-e2e="feed-follow"]');
            return btn ? btn.innerText.trim() : 'Button not found';
          });
          console.log(`📊 Button status: ${verifyText}`);
          await WaitForSomeTime(RandomDelay(500, 1000));
        } catch (verifyError) {
          console.log('⚠️  Could not verify follow status');
        }
      }
      
      console.log('✅ Follow interaction completed\n');
      return true;
    } catch (error) {
      console.error('❌ Follow failed:', error.message);
      console.error('Stack:', error.stack);
      
      // Still return true if click was performed (we may have followed despite the error)
      try {
        const currentButtonText = await page.evaluate(() => {
          const btn = document.querySelector('button[data-e2e="feed-follow"]');
          return btn ? btn.innerText.trim().toLowerCase() : '';
        });
        
        if (currentButtonText.includes('following') || currentButtonText.includes('friends')) {
          console.log('✅ Despite error, follow appears to have succeeded');
          return true;
        }
      } catch (checkError) {
        // Ignore
      }
      
      return false;
    }
  }