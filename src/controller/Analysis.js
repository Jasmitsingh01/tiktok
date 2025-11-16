import GetVideoAnalytics from '../utlis/GetVideoAnalytics.js';
import { browser } from '../utlis/Brower.js';

export default async function Analysis(req, res){
    try {
        const { postId, username } = req.body;
        
        if(!postId || !username){
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields',
                message: 'Both postId and username are required'
            });
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 ANALYTICS REQUEST`);
        console.log('='.repeat(60));
        console.log(`Username: ${username}`);
        console.log(`Post ID: ${postId}`);
        console.log('='.repeat(60));
        
        const page = await browser.page;
        
        // Authenticate proxy if configured
        if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
            await page.authenticate({
                username: process.env.PROXY_USERNAME,
                password: process.env.PROXY_PASSWORD
            });
        }
        
        const analytics = await GetVideoAnalytics(page, postId);
        
        // Check if analytics contains an error
        if (analytics.error) {
            console.log(`\n⚠️  Analytics request completed with error`);
            return res.status(400).json({ 
                success: false,
                error: analytics.error,
                message: analytics.message,
                solution: analytics.solution || analytics.note
            });
        }
        
        console.log(`\n✅ Analytics retrieved successfully`);
        return res.status(200).json({ 
            success: true,
            analytics: analytics 
        });
        
    } catch (error) {
        console.error('❌ Analysis controller error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
}
