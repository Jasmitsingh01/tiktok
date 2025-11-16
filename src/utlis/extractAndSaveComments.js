import path from 'path';
import fs from 'fs/promises';
import WaitForSomeTime from './WaitForSomeTime.js';
export default async function extractAndSaveComments(page, maxCount = 20, outputFile = 'tmp/comments.txt') {
    try {
      console.log('📥 Waiting for comments to load...');
      
      await page.waitForSelector('div[class*="DivCommentItemWrapper"]', { timeout: 15000 });
      await WaitForSomeTime(2000);
  
      const comments = await page.evaluate((maxCount) => {
        const results = [];
        const commentItems = document.querySelectorAll('div[class*="DivCommentItemWrapper"]');
        
        for (let item of commentItems) {
          if (results.length >= maxCount) break;
          
          try {
            // Extract username
            const usernameDiv = item.querySelector('div[data-e2e="comment-username-1"]');
            const usernameLink = usernameDiv?.querySelector('a p');
            const username = usernameLink?.innerText?.trim() || 'Unknown';
            
            // Extract comment text
            const commentSpan = item.querySelector('span[data-e2e="comment-level-1"]');
            const commentText = commentSpan?.innerText?.trim() || '';
            
            if (!commentText || commentText.length < 1) continue;
            
            // Extract timestamp
            const timeSpans = item.querySelectorAll('span.TUXText--weight-normal');
            let timestamp = 'unknown';
            console.log('🔍 Extracting timestamp...');
            for (let span of timeSpans) {
              const text = span.innerText?.trim() || '';
              if (/\d+[smhdw]\s*ago/i.test(text)) {
                timestamp = text;
                break;
              }
            }
            
            // Extract likes
            const likeContainer = item.querySelector('div[class*="DivLikeContainer"]');
            const likeSpan = likeContainer?.querySelector('span.TUXText--weight-normal:last-child');
            const likes = likeSpan?.innerText?.trim() || '0';
            
            results.push({ username, comment: commentText, timestamp, likes });
          } catch (err) {
            console.error('❌ Error extracting comments:', err.message);
          }
        }
        console.log('✅ Comments extracted successfully');
        return results;
      }, maxCount);
  
      if (!comments.length) {
        console.log('⚠️ No comments extracted');
        return false;
      }
  
      // Format output
      const fileContent = comments.map((c, index) => 
        `[${index + 1}] ${c.username}\nPosted: ${c.timestamp}\nLikes: ${c.likes}\nComment: ${c.comment}`
      ).join('\n\n' + '─'.repeat(60) + '\n\n');
      
      const header = `TikTok Comments Extraction\nTotal Comments: ${comments.length}\nExtracted: ${new Date().toLocaleString()}\n${'═'.repeat(60)}\n\n`;

      const filePath = path.join(process.cwd(), outputFile);
      await fs.writeFile(filePath, header + fileContent);
      
      console.log(`✅ ${comments.length} comments saved to ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ Error extracting comments:', error.message);
      return false;
    }
  }
  