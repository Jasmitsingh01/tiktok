import { browser } from "../utlis/Brower.js";
import LikeVideo from "../utlis/LikeVideo.js";
import FollowUser from "../utlis/FollowUser.js";
import CommentVideo from "../utlis/CommentVideo.js";
import ScrollVideo from "../utlis/ScrollVideo.js";
import WaitForSomeTime from "../utlis/WaitForSomeTime.js";
import RandomDelay from "../utlis/RandomDelay.js";

export default async function warmUpAccount(req, res){
    try {
        // Get page from middleware if session was restored, otherwise get from browser
        let page = await browser.page;
        
        
            console.log('⚠️  No session found, using fresh browser page');
            page = await browser.page;
            
            console.log('🔐 Setting up proxy authentication...');
            await page.authenticate({
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            });
        
        
        console.log('🌐 Navigating to TikTok...');
        await page.goto('https://www.tiktok.com/foryou', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        
        console.log('⏳ Waiting for page to stabilize...');
        await WaitForSomeTime(5000);
        
        const endTime = Date.now() + 10 * 60 * 1000; // 10 minutes
        let videoCount = 0;
        let likesCount = 0;
        let followsCount = 0;
        let commentsCount = 0;
        
        console.log('🚀 Starting warm-up session...');
        
            
        while(Date.now() < endTime){
            try {
                videoCount++;
                console.log(`\n📹 Video #${videoCount} (${new Date().toLocaleTimeString()})`);
                
                const currentPos = await page.evaluate(() => window.location.href);
                
                
                  
                
                const watchTime = RandomDelay(5000, 10000); // Slower, more human-like
                console.log(`👀 Watching for ${(watchTime/1000).toFixed(1)}s...`);
                await WaitForSomeTime(watchTime);
            
            // Randomly decide on actions
            const shouldLike = Math.random() > 0.3; // 70% chance to like
            const shouldFollow = Math.random() > 0.8; // 20% chance to follow
            const shouldComment = Math.random() > 0.9; // 10% chance to comment
            
            if(shouldLike){
                const liked = await LikeVideo(page);
                if (liked) {
                    likesCount++;
                    console.log(`📊 Total likes: ${likesCount}`);
                }
                await WaitForSomeTime(RandomDelay(1000, 2000));
            }
            
            if(shouldFollow){
                console.log('👤 Following user');
                await WaitForSomeTime(RandomDelay(1000, 2000));
                const followed = await FollowUser(page);
                if (followed) {
                    followsCount++;
                    console.log(`📊 Total follows: ${followsCount}`);
                }
                await WaitForSomeTime(RandomDelay(1000, 2000));
            }
            
            if(shouldComment){
                console.log('💬 Commenting on video');
                await WaitForSomeTime(RandomDelay(1000, 2000));
                const commented = await CommentVideo(page);
                if (commented) {
                    commentsCount++;
                    console.log(`📊 Total comments: ${commentsCount}`);
                }
                await WaitForSomeTime(RandomDelay(1000, 2000));
            }
            
            // Always scroll to next video
            console.log('⬇️  Scrolling to next video...');
            await WaitForSomeTime(RandomDelay(1000, 2000));
            await ScrollVideo(page);
            
            // Check URL after scroll
            const urlAfterScroll = await page.evaluate(() => window.location.href);
            console.log(`📍 After scroll: ${urlAfterScroll}`);
            
            await WaitForSomeTime(RandomDelay(2000, 3000)); // Wait for new video to load
            
            } catch (iterationError) {
                console.error(`❌ Error in video #${videoCount}:`, iterationError.message);
                // Continue to next video even if there's an error
                await WaitForSomeTime(3000);
            }
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ WARM-UP COMPLETE!`);
        console.log('='.repeat(60));
        console.log(`📊 Statistics:`);
        console.log(`   Videos Watched: ${videoCount}`);
        console.log(`   Videos Liked: ${likesCount}`);
        console.log(`   Users Followed: ${followsCount}`);
        console.log(`   Comments Posted: ${commentsCount}`);
        console.log('='.repeat(60));
        
        return res.status(200).json({ 
            success: true, 
            message: "Warmup account successfully",
            stats: {
                videosWatched: videoCount,
                videosLiked: likesCount,
                usersFollowed: followsCount,
                commentsPosted: commentsCount
            }
        });
    }
 catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
}
}