import { browser } from "../utlis/Brower.js";
import WaitForSomeTime from "../utlis/WaitForSomeTime.js";
import path from "path";

export default async function UploadVideoToTiktok(req, res){
    try {
        const {  description } = req.body;
        if(!req.file){
            return res.status(400).json({ success: false, message: "Video file is required" });
        }
        const videoPath = req.file.path;
        if(!videoPath || !description){
            return res.status(400).json({ success: false, message: "Video path and description are required" });
        }
        
        // Use page from middleware if session was restored, otherwise get from browser
        let page = req.page;
        if (!page) {
            console.log('⚠️  No session page found, getting from browser');
            const pages = await browser.pages();
            page = pages[0];
        } else {
            console.log('✅ Using page from restored session');
        }
        await page.waitForSelector('button[aria-label="Upload"][role="listitem"]', { 
            visible: true, 
            timeout: 10000 
          });
          await page.click('button[aria-label="Upload"][role="listitem"]');
          await WaitForSomeTime(6000);
      
          await page.waitForSelector('input[type="file"][accept^="video/"]', { 
            visible: false, 
            timeout: 15000 
          });
          const inputElem = await page.$('input[type="file"][accept^="video/"]');
          await inputElem.uploadFile(path.resolve(videoPath));
          console.log('✅ Video file uploaded');
          await WaitForSomeTime(60000/3);
    await page.waitForSelector('div[contenteditable="true"][role="combobox"]', { 
        visible: true, 
        timeout: 20000 
      });
  
      await page.focus('div[contenteditable="true"][role="combobox"]');
      
      // Clear existing text
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      
      await page.keyboard.type(description, { delay: 80 });
      console.log('✅ Description entered');
    await page.waitForSelector('button[data-e2e="post_video_button"][aria-disabled="false"]', { 
        visible: true, 
        timeout: 20000 
      });
      await page.click('button[data-e2e="post_video_button"][aria-disabled="false"]');
      await WaitForSomeTime(60000/3);
      await page.waitForSelector('div[data-tt="components_ActionCell_Container"]', { 
        timeout: 15000 
      });
      await WaitForSomeTime(2000);
  
      const containers = await page.$$('div[data-tt="components_ActionCell_Container"]');
      
      if (containers.length < 2) {
        console.error('❌ Not enough analytics containers found');
        return res.status(400).json({ success: false, message: "Not enough analytics containers found" });
      }
  
      // Click on the second container (index 1)
      await containers[1].click();
      await WaitForSomeTime(5000);
  
      const url = page.url();
      console.log('📍 Current URL:', url);
  
      const match = url.match(/(?:post|analytics|video)\/(\d{19})/);
      const postId = match ? match[1] : null;
      if (!postId) {
        console.error('❌ Failed to extract post ID from URL');
        return res.status(400).json({ success: false, message: "Failed to extract post ID from URL" });
      }
      return res.status(200).json({ success: true, message: "Video uploaded successfully", postId });
  
    } catch (error) {
        console.error('❌ Upload video to TikTok error:', error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

