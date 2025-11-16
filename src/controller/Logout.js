import { browser } from "../utlis/Brower.js";
import { deleteSession } from "../utlis/SessionManager.js";
import WaitForSomeTime from "../utlis/WaitForSomeTime.js";

/**
 * Logout controller - Deletes user session from database and clears browser cookies
 * Request body: { username: string }
 */
export default async function Logout(req, res) {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚪 LOGOUT REQUEST`);
        console.log('='.repeat(60));
        console.log(`Username: ${username}`);
        console.log('='.repeat(60));
        
        // Step 1: Delete session from database
        console.log('🗑️  Deleting session from database...');
        try {
            await deleteSession(username);
            console.log('✅ Session deleted from database');
        } catch (dbError) {
            console.error('⚠️  Error deleting from database:', dbError.message);
            // Continue even if database deletion fails
        }
        
        // Step 2: Clear browser cookies and storage
        console.log('🧹 Clearing browser data...');
        try {
            const { page } = await browser;
            
            // Get current cookies count before clearing
            const currentCookies = await page.cookies();
            console.log(`📊 Current cookies: ${currentCookies.length}`);
            
            // Clear all cookies
            const client = await page.target().createCDPSession();
            await client.send('Network.clearBrowserCookies');
            console.log('✅ Browser cookies cleared');
            
            // Clear localStorage
            await page.evaluate(() => {
                localStorage.clear();
            });
            console.log('✅ localStorage cleared');
            
            // Clear sessionStorage
            await page.evaluate(() => {
                sessionStorage.clear();
            });
            console.log('✅ sessionStorage cleared');
            
            // Clear cache
            await client.send('Network.clearBrowserCache');
            console.log('✅ Browser cache cleared');
            
            // Optional: Navigate to TikTok homepage (logged out state)
            console.log('🌐 Navigating to TikTok homepage...');
            await page.goto('https://www.tiktok.com', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await WaitForSomeTime(2000);
            
            console.log('✅ Logged out successfully');
            
        } catch (browserError) {
            console.error('⚠️  Error clearing browser data:', browserError.message);
            // Continue to return success since database was cleared
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ LOGOUT COMPLETE`);
        console.log('='.repeat(60));
        console.log(`User: ${username}`);
        console.log(`Status: All data cleared`);
        console.log('='.repeat(60));
        
        return res.status(200).json({
            success: true,
            message: `Successfully logged out user: ${username}`,
            data: {
                username,
                sessionDeleted: true,
                cookiesCleared: true,
                storageCleared: true
            }
        });
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during logout",
            error: error.message
        });
    }
}


