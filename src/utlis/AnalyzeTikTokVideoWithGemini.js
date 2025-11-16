import fs from 'fs/promises';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();


function cleanJsonResponse(text) {
    let cleaned = text.trim();
    // Remove markdown code blocks (``````javascript, ```
    cleaned = cleaned.replace(/```(?:json|javascript)?\s*/g, '');
    cleaned = cleaned.replace(/```/g, '');
    return cleaned.trim();
  }
export default async function AnalyzeTikTokVideoWithGemini(imagePath) {
    try {
      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not configured');
        console.log('💡 Please add OPENROUTER_API_KEY to your .env file');
        console.log('💡 Get your API key from: https://openrouter.ai/keys');
        return {
          error: 'API key not configured',
          message: 'OPENROUTER_API_KEY environment variable is required',
          note: 'Get your API key from https://openrouter.ai/keys and add it to .env file'
        };
      }
      
      console.log('📸 Reading TikTok screenshot from:', imagePath);
      
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageDataUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('🤖 Analyzing TikTok video with Gemini...');
      
      const prompt = `You are an expert at analyzing TikTok video analytics screenshots.
  
  Analyze this TikTok video analytics image and extract all the data you can see.
  Please return ONLY a valid JSON object (no markdown code blocks, no explanation) with the following structure:
  
  {
    "videoViews": number or null,
    "totalPlayTime": string or null,
    "averageWatchTime": string or null,
    "watchedFullVideo": string or null,
    "newFollowers": number or null,
    "likes": number or null,
    "comments": number or null,
    "shares": number or null,
    "saved": number or null,
    "profileViews": number or null,
    "retentionRate": {
      "status": "processing" or "available",
      "data": null or object
    },
    "trafficSource": {
      "status": "processing" or "available",
      "threshold": number or null,
      "sources": []
    },
    "searchQueries": {
      "status": "processing" or "available",
      "queries": []
    },
    "additionalMetrics": {}
  }
  
  Important:
  - Extract all numeric values you can see in the screenshot
  - For time values (like "0h:0m:0s"), keep them as strings
  - If a value is "0" or not visible, use appropriate null or 0
  - If data is being processed, set status to "processing"
  - Return ONLY the JSON object, no additional text
  - Ensure all numbers are actual numbers, not strings (except time formats)
  - Include any additional metrics you find in the "additionalMetrics" object`;
  
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }],
          temperature: 0.1,
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://github.com/tiktok-automation',
            'X-Title': 'TikTok Analytics Automation',
            'Content-Type': 'application/json'
          }
        }
      );
  
      const text = response.data.choices[0].message.content;
      console.log('✅ Gemini analysis complete');
      
      try {
        const cleanedText = cleanJsonResponse(text);
        const analyticsData = JSON.parse(cleanedText);
        
        await fs.writeFile('tmp/tiktok-analytics-data.json', JSON.stringify(analyticsData, null, 2));
        console.log('💾 Analytics data saved');
        
        return analyticsData;
      } catch (parseError) {
        console.error('⚠️ Failed to parse JSON:', parseError.message);
        return {
          error: 'Failed to parse JSON',
          rawResponse: text
        };
      }
    } catch (error) {
      console.error('❌ Gemini analysis error:', error.message);
      
      // Specific error handling
      if (error.response) {
        if (error.response.status === 401) {
          console.error('❌ Authentication failed: Invalid OPENROUTER_API_KEY');
          console.log('💡 Please check your API key in .env file');
          console.log('💡 Get a valid key from: https://openrouter.ai/keys');
          return {
            error: 'Authentication failed',
            message: 'Invalid or expired OPENROUTER_API_KEY',
            statusCode: 401,
            solution: 'Check your API key at https://openrouter.ai/keys'
          };
        } else if (error.response.status === 429) {
          console.error('❌ Rate limit exceeded for OpenRouter API');
          return {
            error: 'Rate limit exceeded',
            message: 'Too many requests to OpenRouter API',
            statusCode: 429,
            solution: 'Wait a few minutes before trying again'
          };
        } else if (error.response.status === 402) {
          console.error('❌ Insufficient credits on OpenRouter account');
          return {
            error: 'Insufficient credits',
            message: 'Your OpenRouter account needs credits',
            statusCode: 402,
            solution: 'Add credits to your OpenRouter account'
          };
        }
      }
      
      if (error.code === 'ENOENT') {
        console.error('❌ Screenshot file not found:', imagePath);
        return {
          error: 'File not found',
          message: `Screenshot file does not exist: ${imagePath}`,
          solution: 'Make sure the screenshot was created successfully'
        };
      }
      
      return {
        error: 'Gemini analysis failed',
        message: error.message,
        details: error.response?.data || error.stack
      };
    }
  }
  