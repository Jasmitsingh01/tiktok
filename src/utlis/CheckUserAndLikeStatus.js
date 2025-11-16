import WaitForSomeTime from "./WaitForSomeTime.js";
import RandomDelay from "./RandomDelay.js";

/**
 * Check if video is from the same user and if it's already liked
 * @param {Object} page - Puppeteer page instance
 * @param {string} targetUsername - The username to check against (e.g., "trinityy.nicolee")
 * @returns {Object} - { isSameUser: boolean, isLiked: boolean, currentUsername: string }
 */
export async function checkUserAndLikeStatus(page, targetUsername) {
    try {
        await WaitForSomeTime(RandomDelay(500, 1000));
        
        const status = await page.evaluate(() => {
            // Get username from the specific element structure
            const usernameElement = document.querySelector('p.TUXText.TUXText--tiktok-sans.TUXText--weight-medium.css-1uqre0i-5e6d46e3--StyledTUXText');
            const currentUsername = usernameElement ? usernameElement.textContent.trim() : null;
            
            // Check if video is liked
            const likeButton = document.querySelector('button[aria-label^="Like video"]');
            const isLiked = likeButton ? likeButton.getAttribute('aria-pressed') === 'true' : false;
            
            return {
                currentUsername,
                isLiked
            };
        });
        
        const isSameUser = status.currentUsername === targetUsername;
        
        console.log(`👤 Current user: ${status.currentUsername}`);
        console.log(`🎯 Target user: ${targetUsername}`);
        console.log(`✅ Same user: ${isSameUser}`);
        console.log(`❤️  Already liked: ${status.isLiked}`);
        
        return {
            isSameUser,
            isLiked: status.isLiked,
            currentUsername: status.currentUsername
        };
    } catch (error) {
        console.error('❌ Error checking user and like status:', error.message);
        return {
            isSameUser: false,
            isLiked: false,
            currentUsername: null
        };
    }
}

/**
 * Scroll through videos until finding one from a different user
 * @param {Object} page - Puppeteer page instance
 * @param {string} targetUsername - The username to avoid
 * @param {number} maxScrolls - Maximum number of scrolls before giving up (default: 10)
 * @returns {Object} - { success: boolean, scrollCount: number, newUsername: string }
 */
export async function scrollUntilDifferentUser(page, targetUsername, maxScrolls = 10) {
    try {
        console.log(`🔄 Scrolling until finding different user from: ${targetUsername}`);
        let scrollCount = 0;
        
        while (scrollCount < maxScrolls) {
            // Scroll to next video
            console.log(`⬇️  Scroll ${scrollCount + 1}/${maxScrolls}...`);
            await page.keyboard.press('ArrowDown');
            await WaitForSomeTime(RandomDelay(3000, 5000)); // Wait for video to load
            
            scrollCount++;
            
            // Check if current video is from different user
            const status = await checkUserAndLikeStatus(page, targetUsername);
            
            if (!status.isSameUser && status.currentUsername) {
                console.log(`✅ Found different user: ${status.currentUsername}`);
                return {
                    success: true,
                    scrollCount,
                    newUsername: status.currentUsername
                };
            }
            
            console.log(`⏭️  Still on ${targetUsername}'s video, continuing...`);
        }
        
        console.log(`⚠️  Reached max scrolls (${maxScrolls}) without finding different user`);
        return {
            success: false,
            scrollCount,
            newUsername: null
        };
    } catch (error) {
        console.error('❌ Error scrolling to different user:', error.message);
        return {
            success: false,
            scrollCount: 0,
            newUsername: null
        };
    }
}

/**
 * Check if video is from target user and already liked, then scroll if needed
 * @param {Object} page - Puppeteer page instance
 * @param {string} targetUsername - The username to check (e.g., "trinityy.nicolee")
 * @param {boolean} shouldScrollIfLiked - Whether to scroll if video is already liked (default: true)
 * @returns {Object} - { shouldLike: boolean, shouldScroll: boolean, status: Object }
 */
export async function checkAndDecideAction(page, targetUsername, shouldScrollIfLiked = true) {
    try {
        const status = await checkUserAndLikeStatus(page, targetUsername);
        
        // Determine actions
        const shouldLike = status.isSameUser && !status.isLiked;
        const shouldScroll = !status.isSameUser || (shouldScrollIfLiked && status.isLiked);
        
        console.log(`\n📊 Action Decision:`);
        console.log(`   Should Like: ${shouldLike ? '✅ YES' : '❌ NO'} ${!status.isSameUser ? '(different user)' : status.isLiked ? '(already liked)' : ''}`);
        console.log(`   Should Scroll: ${shouldScroll ? '✅ YES' : '❌ NO'}`);
        
        return {
            shouldLike,
            shouldScroll,
            status
        };
    } catch (error) {
        console.error('❌ Error deciding action:', error.message);
        return {
            shouldLike: false,
            shouldScroll: true,
            status: null
        };
    }
}

export default checkUserAndLikeStatus;

