import WaitForSomeTime from "./WaitForSomeTime.js";
import RandomDelay from "./RandomDelay.js";

const UsersScrolled = new Set();

/**
 * Simulate human-like scroll behavior with various methods
 */
async function humanScroll(page, retryCount = 0) {
    try {
        // Random scroll method (to appear more human)
        const scrollMethod = Math.random();
        
        if (scrollMethod < 0.6 || retryCount > 0) {
            // Method 1: Keyboard scroll (60% chance or retry) - most reliable
            console.log('⌨️  Keyboard scroll (ArrowDown)');
            await page.keyboard.press('ArrowDown');
            await WaitForSomeTime(500);
        } else if (scrollMethod < 0.85) {
            // Method 2: Mouse wheel scroll (25% chance)
            console.log('🖱️  Mouse wheel scroll');
            await page.evaluate(() => {
                window.scrollBy({
                    top: window.innerHeight,
                    behavior: 'smooth'
                });
            });
            await WaitForSomeTime(500);
        } else {
            // Method 3: Swipe simulation (15% chance)
            console.log('👆 Swipe scroll simulation');
            const startY = 600;
            const endY = 200;
            
            await page.mouse.move(500, startY);
            await page.mouse.down();
            
            // Simulate drag with multiple steps
            const steps = 15 + Math.floor(Math.random() * 10);
            for (let i = 0; i <= steps; i++) {
                const progress = i / steps;
                const currentY = startY + (endY - startY) * progress;
                await page.mouse.move(500, currentY);
                await WaitForSomeTime(RandomDelay(5, 15));
            }
            
            await page.mouse.up();
            await WaitForSomeTime(500);
        }
        
        return true;
    } catch (scrollError) {
        console.error(`⚠️  Scroll method failed: ${scrollError.message}`);
        
        // Retry with keyboard method if first attempt failed
        if (retryCount < 2) {
            console.log(`🔄 Retrying scroll (attempt ${retryCount + 2})...`);
            await WaitForSomeTime(1000);
            return await humanScroll(page, retryCount + 1);
        }
        
        return false;
    }
}

/**
 * Simulate human watching before scrolling
 */
async function watchBeforeScroll(page) {
    // Sometimes pause to "watch" the video a bit more (40% chance)
    if (Math.random() < 0.4) {
        const pauseTime = RandomDelay(1000, 3000);
        console.log(`👀 Pausing to watch (${(pauseTime / 1000).toFixed(1)}s)...`);
        await WaitForSomeTime(pauseTime);
    }
    
    // Sometimes move mouse during pause (20% chance)
    if (Math.random() < 0.2) {
        console.log('🖱️  Casual mouse movement...');
        const randomX = 300 + Math.random() * 500;
        const randomY = 200 + Math.random() * 600;
        await page.mouse.move(randomX, randomY, { steps: 20 });
        await WaitForSomeTime(RandomDelay(300, 800));
    }
}

/**
 * Scroll to next video with human-like behavior
 */
export default async function ScrollVideo(page) {
    try {
        console.log('\n🔄 Starting human-like scroll interaction...');
        
        // Auto-clean if too many users tracked
        autoCleanScrolledUsers();
        
        // Get current username before scrolling
        const currentUsername = await page.evaluate(() => {
            const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
            return usernameElement ? usernameElement.textContent.trim() : null;
        });
        
        if (currentUsername) {
            console.log(`📝 Current user: ${currentUsername}`);
            
            // Check if we've already scrolled past this user
            if (UsersScrolled.has(currentUsername)) {
                console.log(`⏭️  User ${currentUsername} already seen, continuing to scroll...`);
                // Don't watch or interact, just scroll past quickly
            } else {
                console.log(`➕ Adding ${currentUsername} to scrolled users list`);
                UsersScrolled.add(currentUsername);
                
                // Watch video a bit before scrolling (human behavior)
                await watchBeforeScroll(page);
            }
            
            // Always scroll regardless of whether user was seen before
            // Random delay before scroll action
            await WaitForSomeTime(RandomDelay(300, 1000));
            
            // Perform human-like scroll
            const scrollSuccess = await humanScroll(page);
            
            if (!scrollSuccess) {
                console.error('⚠️  All scroll attempts failed');
                // Try simple keyboard press as last resort
                try {
                    await page.keyboard.press('ArrowDown');
                    await WaitForSomeTime(2000);
                } catch (e) {
                    console.error('⚠️  Even basic scroll failed');
                }
                return true;
            }
            
            // Variable wait time after scroll (humans have different timing)
            const waitTime = RandomDelay(4000, 7000);
            console.log(`⏳ Waiting ${(waitTime / 1000).toFixed(1)}s for next video to load...`);
            await WaitForSomeTime(waitTime);
            
            // Verify video changed
            const newUsername = await page.evaluate(() => {
                const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
                return usernameElement ? usernameElement.textContent.trim() : null;
            });
            
            if (newUsername && newUsername !== currentUsername) {
                console.log(`✅ Scrolled to new video from: ${newUsername}`);
            } else if (newUsername === currentUsername) {
                console.log(`⚠️  Still on ${currentUsername}'s video, trying additional scroll...`);
                
                // Try one more scroll if still on same video
                await WaitForSomeTime(1000);
                await page.keyboard.press('ArrowDown');
                await WaitForSomeTime(3000);
                
                const retryUsername = await page.evaluate(() => {
                    const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
                    return usernameElement ? usernameElement.textContent.trim() : null;
                });
                
                if (retryUsername !== currentUsername) {
                    console.log(`✅ Second scroll succeeded, now on: ${retryUsername}`);
                } else {
                    console.log('⚠️  Still on same video after retry');
                }
            } else {
                console.log('⚠️  Could not detect new username');
            }
        } else {
            // No username found, just scroll normally
            console.log('⚠️  No username detected, scrolling anyway...');
            
            await WaitForSomeTime(RandomDelay(500, 1500));
            const scrollSuccess = await humanScroll(page);
            
            if (!scrollSuccess) {
                console.error('⚠️  Scroll failed, attempting fallback methods...');
                
                // Fallback 1: Try direct keyboard press
                try {
                    await page.keyboard.press('PageDown');
                    await WaitForSomeTime(1000);
                } catch (e) {
                    console.error('⚠️  Fallback scroll also failed');
                }
            }
            
            await WaitForSomeTime(RandomDelay(5000, 7000));
        }
        
        // Sometimes random micro-pause after scroll (10% chance)
        if (Math.random() < 0.1) {
            console.log('⏸️  Brief pause (natural behavior)...');
            await WaitForSomeTime(RandomDelay(500, 1500));
        }
        
        console.log('✅ Scroll interaction completed\n');
        return true;
    }
    catch (error) {
        console.error('❌ Scroll video error:', error.message);
        return false;
    }
}

/**
 * Clear the scrolled users history
 */
export function clearScrolledUsers() {
    const count = UsersScrolled.size;
    UsersScrolled.clear();
    console.log(`🗑️  Cleared ${count} users from scrolled history`);
    return count;
}

/**
 * Get all scrolled users
 */
export function getScrolledUsers() {
    return Array.from(UsersScrolled);
}

/**
 * Get count of scrolled users
 */
export function getScrolledUsersCount() {
    return UsersScrolled.size;
}

/**
 * Auto-clear scrolled users if set gets too large
 * Prevents memory issues and allows re-seeing content after many scrolls
 */
function autoCleanScrolledUsers() {
    const MAX_USERS = 100; // Clear after 100 unique users
    if (UsersScrolled.size >= MAX_USERS) {
        console.log(`⚠️  Scrolled users limit reached (${MAX_USERS}), clearing history...`);
        UsersScrolled.clear();
        console.log('✅ Ready to see new content');
    }
}