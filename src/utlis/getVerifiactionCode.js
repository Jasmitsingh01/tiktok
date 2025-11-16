import { browser } from "./Brower.js";
import WaitForSomeTime from "./WaitForSomeTime.js";

export default async function getVerificationCode(verificationEmail) {
  let emailPage;
  try {
    console.log('📧 Getting verification code...');

    emailPage = await browser.browser.newPage();

    await emailPage.goto('https://fakemailo.com/partner-authorized-emails', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await WaitForSomeTime(3000);  

    const emailInput = await emailPage.$('#email');
    if (emailInput) {
      await emailInput.click();
      await emailInput.type(verificationEmail, { delay: 100 });
    } else {
      throw new Error('Email input not found');
    }

    await WaitForSomeTime(1000);

    const selectBox = await emailPage.$('#service');
    if (selectBox) {
      await selectBox.select('TikTok');
    } else {
      throw new Error('Service selector not found');
    }

    await WaitForSomeTime(1000);

    const getEmailButton = await emailPage.$('#btn-get-code');
    if (getEmailButton) {
      await getEmailButton.click();
    } else {
      throw new Error('Get code button not found');
    }

    await WaitForSomeTime(15000);

    const verificationCode = await emailPage.evaluate(() => {
      const subjectElement = document.querySelector('#mail-subject');
      if (subjectElement) {
        const match = subjectElement.textContent.match(/\d{6}/);
        return match ? match[0] : null;
      }
      return null;
    });

    if (verificationCode) {
      console.log('✅ Verification code retrieved:', verificationCode);
    } else {
      console.warn('⚠️ No verification code found in email');
    }

    return verificationCode;
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return null;
  } finally {
    if (emailPage) {
      await emailPage.close().catch(() => {});
    }
   }
}