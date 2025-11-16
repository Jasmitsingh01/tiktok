import WaitForSomeTime from './WaitForSomeTime.js';
import AnalyzeTikTokVideoWithGemini from './AnalyzeTikTokVideoWithGemini.js';
export default async function GetVideoAnalytics(page, postId) {
    try {
      console.log('📊 Fetching analytics for post:', postId);
  
      await page.goto(`https://www.tiktok.com/tiktokstudio/analytics/${postId}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await WaitForSomeTime(60000/2);
  
      const screenshotPath = 'tmp/analytics.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('📸 Analytics screenshot saved');
  
      const analyticsData = await AnalyzeTikTokVideoWithGemini(screenshotPath);
      
      return analyticsData;
    } catch (error) {
      console.error('❌ Get analytics error:', error.message);
      return {
        error: 'Get analytics failed',
        message: error.message
      };
    }
  }