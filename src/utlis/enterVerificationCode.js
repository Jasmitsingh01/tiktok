import WaitForSomeTime from "./WaitForSomeTime.js";
export default async function enterVerificationCode(page, code) {
    try {
      console.log('🔢 Entering verification code:', code);
  
      await page.waitForSelector('input.code-input', { timeout: 10000 });
      await page.type('input.code-input', code, { delay: 100 });
      
      await WaitForSomeTime(1000);
      
      const submitButton = await page.$('button.twv-component-button.email-view-wrapper__button');
      if (submitButton) {
        await submitButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
  
      await WaitForSomeTime(10000);
      
      console.log('✅ Verification code entered');
      return true;
    } catch (error) {
      console.error('❌ Code entry error:', error.message);
      return false;
    }
  }