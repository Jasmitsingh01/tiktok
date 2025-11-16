import axios from "axios";
import fs from "fs";
import path from "path";
import WaitForSomeTime from "./WaitForSomeTime.js";
import FormData from "form-data";

async function transcribeAudioWithWhisper(audioFilePath) {
    try {
      console.log('🎤 Transcribing audio with Groq Whisper...');
      
      // Use form-data package for Node.js (not browser FormData)
      const form = new FormData();
      
      // Read file as buffer and create a Blob-like object
      const fileBuffer = fs.readFileSync(audioFilePath);
      form.append('file', fileBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });
      form.append('model', 'whisper-large-v3');
      form.append('response_format', 'json');
      form.append('language', 'en');
      form.append('temperature', '0');
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          timeout: 30000
        }
      );
      
      const transcription = response.data.text.trim();
      console.log('✅ Transcription:', transcription.substring(0, 50) + '...');
      
      const cleaned = transcription.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      return cleaned;
    } catch (error) {
      console.error('❌ Transcription error:', error.response?.data || error.message);
      return null;
    }
  }
async function downloadAudio(audioUrl, outputPath) {
    try {
      console.log('📥 Downloading audio file...');
      const response = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      fs.writeFileSync(outputPath, response.data);
      console.log('✅ Audio downloaded');
      return true;
    } catch (error) {
      console.error('❌ Download error:', error.message);
      return false;
    }
  }

export default async function solveAudioCaptcha(page, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🎧 Audio captcha attempt ${attempt}/${maxRetries}...`);
      
      try {
        if (attempt === 1) {
          const audioButton = await page.$('#captcha_switch_button');
          if (!audioButton) {
            console.log('❌ Audio button not found');
            return false;
          }
          
          console.log('🔊 Switching to audio captcha...');
          await audioButton.click();
          await WaitForSomeTime(3000);
        } else {
          console.log('🔄 Refreshing captcha...');
          const refreshButton = await page.$('#captcha_refresh_button');
          if (refreshButton) {
            await refreshButton.click();
            await WaitForSomeTime(3000);
          }
        }
        
        await WaitForSomeTime(5000);
        
        const audioUrl = await page.evaluate(() => {
          const audioElement = document.querySelector('audio');
          return audioElement ? audioElement.src : null;
        });
        
        if (!audioUrl) {
          console.log('❌ Audio URL not found');
          continue;
        }
        if(!fs.existsSync(path.join(process.cwd(), '/tmp/audios'))){
            fs.mkdirSync(path.join(process.cwd(), '/tmp/audios'), { recursive: true });
         }
        const audioPath = path.join(process.cwd(), `/tmp/audios/captcha-audio-${attempt}.mp3`);
        const downloaded = await downloadAudio(audioUrl, audioPath);
        
        if (!downloaded) continue;
        
        const transcription = await transcribeAudioWithWhisper(audioPath);
        
        if (!transcription) continue;
        
        const inputField = await page.$('input[placeholder="Enter what you hear"]') ||
                          await page.$('input[type="text"].TUXTextInputCore-input');
        
        if (!inputField) continue;
        
        await inputField.click();
        await WaitForSomeTime(300);
        await inputField.evaluate(el => el.value = '');
        await inputField.type(transcription.toLowerCase(), { delay: 100 });
        await WaitForSomeTime(1000);
        
        const verifyButton = await page.$('button.TUXButton--primary');
        if (verifyButton) {
          await verifyButton.click();
        } else {
          await page.keyboard.press('Enter');
          }
        
        await WaitForSomeTime(12000);
        
        const stillHasCaptcha = await page.$('#captcha-verify-container-main-page');
        
        if (!stillHasCaptcha) {
          console.log('✅ Audio captcha solved!');
          
          // Cleanup audio file
          try {
            if (fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          
          return true;
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} error:`, error.message);
      }
    }
    
    return false;
  }