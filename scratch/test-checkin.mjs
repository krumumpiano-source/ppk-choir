import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Set geolocation in context
  const context = await browser.newContext({
    geolocation: { latitude: 19.169867, longitude: 99.910017 },
    permissions: ['geolocation'],
    locale: 'th-TH'
  });
  
  const page = await context.newPage();
  
  try {
    console.log("Navigating to login...");
    await page.goto('https://ppk-choir.pages.dev/login');
    
    console.log("Entering credentials...");
    await page.fill('input[type="text"]', 'teststring');
    await page.fill('input[type="password"]', 'teststring');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    console.log("Logged in successfully!");

    console.log("Navigating to check-in...");
    await page.goto('https://ppk-choir.pages.dev/check-in');
    
    console.log("Waiting for session selector...");
    // Wait for the session selection or check-in button
    await page.waitForSelector('.btn-primary', { timeout: 10000 });
    
    // Check if there is a session to select
    const sessionDivs = await page.$$('text=ซ้อมช่วงปิดเทอมเดืออนตุลาคม');
    if (sessionDivs.length > 0) {
      console.log("Selecting session...");
      await sessionDivs[0].click();
    }
    
    console.log("Clicking check-in button...");
    await page.click('.btn-primary');
    
    // There might be a PDPA modal
    try {
      const pdpaBtn = await page.waitForSelector('text=ยินยอมและดำเนินการต่อ', { timeout: 2000 });
      if (pdpaBtn) {
        console.log("Accepting PDPA...");
        await pdpaBtn.click();
      }
    } catch(e) {
      // no PDPA modal
    }
    
    console.log("Waiting for GPS resolution and success message...");
    await page.waitForSelector('text=เช็คชื่อเข้าสำเร็จ', { timeout: 25000 });
    console.log("Check-in successful!");
    
    // Now Check-out
    console.log("Clicking check-out button...");
    await page.click('text=เช็คชื่อออก (เมื่อกลับบ้าน)');
    
    await page.waitForSelector('text=เช็คชื่อครบทั้งขาเข้าและขาออก', { timeout: 10000 });
    console.log("Check-out successful!");
    
  } catch(e) {
    console.error("Test failed:");
    console.error(e);
  } finally {
    await browser.close();
  }
})();
