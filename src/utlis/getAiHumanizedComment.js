import fs from 'fs';
import axios from 'axios';
function cleanJsonResponse(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```(?:json|javascript)?\s*/g, '');
    cleaned = cleaned.replace(/```/g, '');
    return cleaned.trim();
  }
/**
 * Generate a random fallback comment when AI is not available
 */
function getRandomFallbackComment() {
    const fallbackComments = [
        'Nice video! 👍',
        'Love this! ❤️',
        'Amazing content! 🔥',
        'This is so good! 😍',
        'Great video! 👏',
        'Keep it up! 💪',
        'Awesome! ⭐',
        'So cool! 😎',
        'Incredible! 🤩',
        'Love your content! 💕',
        'This is fire! 🔥',
        'So talented! 👑',
        'Amazing! 😊',
        'Beautiful! ✨',
        'Perfect! 💯',
        'Can\'t stop watching! 😍',
        'This made my day! 🌟',
        'So creative! 🎨',
        'Wow! 😲',
        'Impressive! 👌'
    ];
    
    const randomIndex = Math.floor(Math.random() * fallbackComments.length);
    return fallbackComments[randomIndex];
}

export default async function getAiHumanizedComment() {
    try {
      // Check if API key is configured
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('⚠️  OPENROUTER_API_KEY not configured, using fallback comments');
        return {
          comment: getRandomFallbackComment(),
          language: 'en'
        };
      }
      
      // Check if comments file exists
      if (!fs.existsSync('tmp/comments.txt')) {
        console.warn('⚠️  Comments file not found, using fallback comment');
        return {
          comment: getRandomFallbackComment(),
          language: 'en'
        };
      }
      
      const content = fs.readFileSync('tmp/comments.txt', 'utf8');
      
      if (!content || content.trim().length === 0) {
        console.warn('⚠️  Comments file is empty, using fallback comment');
        return {
          comment: getRandomFallbackComment(),
          language: 'en'
        };
      }
  
      console.log('🤖 Requesting AI humanized comment...');
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `You are a helpful assistant that humanizes comments.
  
  You will receive a list of comments from different users on a video. Analyze each comment and its language, then make it more natural and human-like while preserving the original language.
  
  Input format:
  <username> (<time>): <comment>
  
  Output ONLY a valid JSON array in this exact format:
  [
    {
      "comment": "Your humanized comment",
      "language": "The language of the comment"
    }
  ]
  
  Rules:
  - Keep the same tone and sentiment
  - Preserve emojis and special characters
  - Make it sound natural and conversational
  - Output ONLY the JSON array, no other text`
            },
            { role: 'user', content: content }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
  
      let rawContent = response.data.choices[0].message.content;
      console.log('✅ AI response received successfully');
      
      rawContent = cleanJsonResponse(rawContent);
      
      const parsedComments = JSON.parse(rawContent);
      const commentData = Array.isArray(parsedComments) ? parsedComments[0] : parsedComments;
      
      if (!commentData || !commentData.comment) {
        throw new Error('Invalid response format from AI');
      }
      
      console.log(`💬 Generated comment: ${commentData.comment.substring(0, 50)}...`);
      
      return {
        comment: String(commentData.comment),
        language: commentData.language || 'en'
      };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('❌ Authentication failed: Invalid or missing OPENROUTER_API_KEY');
        console.log('💡 Please add OPENROUTER_API_KEY to your .env file');
      } else if (error.response && error.response.status === 429) {
        console.error('❌ Rate limit exceeded for OpenRouter API');
      } else if (error.code === 'ECONNABORTED') {
        console.error('❌ Request timeout: OpenRouter API took too long to respond');
      } else {
        console.error('❌ AI humanize comment error:', error.message);
      }
      
      console.log('🔄 Using fallback comment instead');
      
      return {
        comment: getRandomFallbackComment(),
        language: 'en'
      };
    }
  }