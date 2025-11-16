import { checkUserAndLikeStatus, scrollUntilDifferentUser, checkAndDecideAction } from "./CheckUserAndLikeStatus.js";
import LikeVideo from "./LikeVideo.js";
import ScrollVideo from "./ScrollVideo.js";
import WaitForSomeTime from "./WaitForSomeTime.js";
import RandomDelay from "./RandomDelay.js";

/**
 * Like all videos from a specific user (scrolling past already liked ones)
 * @param {Object} page - Puppeteer page instance
 * @param {string} targetUsername - Username to like videos from (e.g., "trinityy.nicolee")
 * @param {number} maxVideos - Maximum number of videos to process (default: 20)
 * @returns {Object} - { success: boolean, videosLiked: number, videosSkipped: number }
 */
export async function likeUserVideos(page, targetUsername, maxVideos = 20) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 Starting to like videos from: ${targetUsername}`);
        console.log(`📊 Max videos to process: ${maxVideos}`);
        console.log('='.repeat(60));
        
        let videosProcessed = 0;
        let videosLiked = 0;
        let videosSkipped = 0;
        let differentUserEncountered = false;
        
        while (videosProcessed < maxVideos && !differentUserEncountered) {
            videosProcessed++;
            
            console.log(`\n📹 Video ${videosProcessed}/${maxVideos}`);
            console.log('-'.repeat(40));
            
            // Wait for page to stabilize
            await WaitForSomeTime(RandomDelay(2000, 3000));
            
            // Check user and like status
            const decision = await checkAndDecideAction(page, targetUsername, true);
            
            // If different user, stop
            if (!decision.status.isSameUser) {
                console.log(`⚠️  Encountered different user (${decision.status.currentUsername}). Stopping.`);
                differentUserEncountered = true;
                break;
            }
            
            // If same user and not liked, like it
            if (decision.shouldLike) {
                console.log(`\n💚 Target user's video - Attempting to like...`);
                const liked = await LikeVideo(page);
                if (liked) {
                    videosLiked++;
                    console.log(`✅ Successfully liked! (Total: ${videosLiked})`);
                } else {
                    videosSkipped++;
                    console.log(`⏭️  Skipped (Total skipped: ${videosSkipped})`);
                }
            } else if (decision.status.isLiked) {
                console.log(`\n⏭️  Video already liked, skipping...`);
                videosSkipped++;
            }
            
            // Scroll to next video
            if (videosProcessed < maxVideos) {
                console.log(`\n⬇️  Scrolling to next video...`);
                await ScrollVideo(page);
            }
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 SUMMARY`);
        console.log('='.repeat(60));
        console.log(`Videos Processed: ${videosProcessed}`);
        console.log(`Videos Liked: ${videosLiked}`);
        console.log(`Videos Skipped: ${videosSkipped}`);
        console.log('='.repeat(60));
        
        return {
            success: true,
            videosProcessed,
            videosLiked,
            videosSkipped
        };
    } catch (error) {
        console.error('❌ Error in likeUserVideos:', error.message);
        return {
            success: false,
            videosProcessed: 0,
            videosLiked: 0,
            videosSkipped: 0,
            error: error.message
        };
    }
}

/**
 * Like videos from a specific user until all their consecutive videos are liked
 * Then scroll past their videos to find the next user
 * @param {Object} page - Puppeteer page instance
 * @param {string} targetUsername - Username to like videos from
 * @param {number} maxScrolls - Max scrolls to find next different user (default: 10)
 * @returns {Object} - Result summary
 */
export async function likeAndScrollPastUser(page, targetUsername, maxScrolls = 10) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 Like all videos from ${targetUsername} and scroll past`);
        console.log('='.repeat(60));
        
        // First, like all videos from the user
        const likeResult = await likeUserVideos(page, targetUsername, 50);
        
        // Then scroll until we find a different user
        console.log(`\n🔄 Now scrolling to find different user...`);
        const scrollResult = await scrollUntilDifferentUser(page, targetUsername, maxScrolls);
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 FINAL SUMMARY`);
        console.log('='.repeat(60));
        console.log(`Videos Liked: ${likeResult.videosLiked}`);
        console.log(`Videos Skipped: ${likeResult.videosSkipped}`);
        console.log(`Scrolls to Different User: ${scrollResult.scrollCount}`);
        console.log(`Next User: ${scrollResult.newUsername || 'N/A'}`);
        console.log('='.repeat(60));
        
        return {
            success: scrollResult.success,
            likeResult,
            scrollResult
        };
    } catch (error) {
        console.error('❌ Error in likeAndScrollPastUser:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

export default likeUserVideos;

