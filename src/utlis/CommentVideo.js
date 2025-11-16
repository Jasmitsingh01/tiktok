import WaitForSomeTime from './WaitForSomeTime.js';
import RandomDelay from './RandomDelay.js';
import extractAndSaveComments from './extractAndSaveComments.js';
import getAiHumanizedComment from './getAiHumanizedComment.js';

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
 * Close comment section using the exit button
 */
async function closeCommentSection(page) {
    try {
        // Use the specific exit button with aria-label="exit"
        const exitButtonSelector = 'button[aria-label="exit"]';
        
        // Wait for exit button to be visible
        await page.waitForSelector(exitButtonSelector, { 
            visible: true, 
            timeout: 5000 
        });
        
        console.log('🖱️  Moving to exit button...');
        await humanMouseMove(page, exitButtonSelector);
        
        // Brief pause before clicking (human behavior)
        await WaitForSomeTime(RandomDelay(200, 500));
        
        // Click the exit button
        await page.click(exitButtonSelector);
        console.log('✅ Comment section closed via exit button');
        
        // Wait for section to close
        await WaitForSomeTime(RandomDelay(800, 1500));
        
        return true;
    } catch (error) {
        console.error('⚠️  Could not find exit button, trying fallback method...');
        
        // Fallback to old method
        try {
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(
                    el => el.getAttribute('aria-label')?.startsWith('Read or add comments')
                );
                if (btn) btn.click();
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}

/**
 * Human-like typing with variable speed and occasional pauses
 */
async function humanTypeComment(page, text) {
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Type each character with variable delay
        for (const char of word) {
            const charDelay = RandomDelay(60, 150); // Variable typing speed
            await page.keyboard.type(char, { delay: charDelay });
            
            // Occasionally pause mid-word (10% chance - like thinking)
            if (Math.random() < 0.1) {
                await WaitForSomeTime(RandomDelay(100, 300));
            }
        }
        
        // Add space after word (except for last word)
        if (i < words.length - 1) {
            await page.keyboard.type(' ', { delay: RandomDelay(50, 100) });
            
            // Longer pause between words (simulate thinking) - 20% chance
            if (Math.random() < 0.2) {
                await WaitForSomeTime(RandomDelay(300, 800));
            }
        }
        
        // Longer pause after punctuation (simulate natural flow)
        if (word.match(/[.!?]$/)) {
            await WaitForSomeTime(RandomDelay(400, 900));
        }
    }
}

/**
 * Simulate reading existing comments before posting
 */
async function simulateReadingComments(page) {
    // Sometimes scroll through comments (40% chance)
    if (Math.random() < 0.4) {
        console.log('📖 Reading existing comments...');
        
        // Random scroll in comments section
        const scrollAmount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < scrollAmount; i++) {
            await page.evaluate(() => {
                const commentSection = document.querySelector('[role="dialog"]');
                if (commentSection) {
                    commentSection.scrollBy({
                        top: 200 + Math.random() * 200,
                        behavior: 'smooth'
                    });
                }
            });
            await WaitForSomeTime(RandomDelay(1000, 2000));
        }
        
        // Scroll back to top
        await page.evaluate(() => {
            const commentSection = document.querySelector('[role="dialog"]');
            if (commentSection) {
                commentSection.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        await WaitForSomeTime(RandomDelay(500, 1000));
    }
}

export default async function CommentVideo(page) {
    try {
      console.log('\n💬 Starting human-like comment interaction...');
      
      // Open comments section with human-like behavior
      console.log('🖱️  Opening comments section...');
      await page.waitForSelector('button[aria-label^="Read or add comments"]', { timeout: 10000 });
      
      // Move mouse to comment button
      await humanMouseMove(page, 'button[aria-label^="Read or add comments"]');
      await WaitForSomeTime(RandomDelay(200, 500));
      
      // Click to open comments
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(
          el => el.getAttribute('aria-label')?.startsWith('Read or add comments')
        );
        if (btn) btn.click();
      });
  
      // Wait for comments section to load
      const loadWait = RandomDelay(2500, 4000);
      console.log(`⏳ Waiting ${(loadWait / 1000).toFixed(1)}s for comments to load...`);
      await WaitForSomeTime(loadWait);
  
      // Simulate reading existing comments
      await simulateReadingComments(page);
  
      // Extract existing comments for context
      console.log('📊 Analyzing existing comments...');
      const extractSuccess = await extractAndSaveComments(page);
      
      if (!extractSuccess) {
        console.warn('⚠️  No comments to analyze, using fallback');
      }
  
      // Get humanized comment
      console.log('🤖 Generating humanized comment...');
      const commentData = await getAiHumanizedComment();
      
      if (!commentData || !commentData.comment) {
        console.error('❌ Failed to get humanized comment');
        await closeCommentSection(page);
        return false;
      }
  
      console.log('📝 Comment ready:', commentData.comment.substring(0, 50) + '...');
  
      // Move to comment box
      console.log('🖱️  Moving to comment box...');
      await page.waitForSelector('div[contenteditable="true"][role="textbox"]', { 
        visible: true, 
        timeout: 15000 
      });
      
      await humanMouseMove(page, 'div[contenteditable="true"][role="textbox"]');
      await WaitForSomeTime(RandomDelay(300, 700));
      
      // Click comment box
      const commentBox = await page.$('div[contenteditable="true"][role="textbox"]');
      await commentBox.click();
      
      // Wait before typing (humans don't type immediately)
      await WaitForSomeTime(RandomDelay(500, 1200));
      
      // Type comment with human-like behavior
      console.log('⌨️  Typing comment...');
      await humanTypeComment(page, commentData.comment);
      
      // Pause to review comment (humans review before posting)
      console.log('👀 Reviewing comment...');
      await WaitForSomeTime(RandomDelay(1500, 3000));
      
      // Sometimes move mouse away and back (25% chance - simulate hesitation)
      if (Math.random() < 0.25) {
        console.log('🤔 Brief hesitation...');
        const randomX = 400 + Math.random() * 200;
        const randomY = 300 + Math.random() * 200;
        await page.mouse.move(randomX, randomY, { steps: 10 });
        await WaitForSomeTime(RandomDelay(500, 1000));
      }
  
      // Move to post button
      console.log('🖱️  Moving to post button...');
      await page.waitForSelector('div[data-e2e="comment-post"][aria-disabled="false"]', { 
        visible: true, 
        timeout: 10000 
      });
      
      await humanMouseMove(page, 'div[data-e2e="comment-post"][aria-disabled="false"]');
      await WaitForSomeTime(RandomDelay(300, 700));
      
      // Click post button
      console.log('📤 Posting comment...');
      await page.click('div[data-e2e="comment-post"][aria-disabled="false"]');
      
      // Wait for comment to post and show confirmation
      const postWait = RandomDelay(2500, 4000);
      console.log(`⏳ Waiting ${(postWait / 1000).toFixed(1)}s for comment to post...`);
      await WaitForSomeTime(postWait);
      
      console.log('✅ Comment posted successfully!');
      
      // Sometimes briefly look at posted comment (30% chance)
      if (Math.random() < 0.3) {
        console.log('👀 Viewing posted comment...');
        await WaitForSomeTime(RandomDelay(1000, 2000));
      }
  
      // Close comments section using exit button
      console.log('❌ Closing comment section...');
      const closed = await closeCommentSection(page);
      
      if (!closed) {
        console.warn('⚠️  Failed to close comment section gracefully');
      }
  
      // Final pause after closing
      await WaitForSomeTime(RandomDelay(500, 1000));
      
      console.log('✅ Comment interaction completed\n');
      return true;
    } catch (error) {
      console.error('❌ Comment posting failed:', error.message);
      
      // Try to close comments section on error
      try {
        console.log('🔄 Attempting to close comment section after error...');
        await closeCommentSection(page);
      } catch (e) {
        console.error('❌ Could not close comment section:', e.message);
      }
      
      return false;
    }
  }
