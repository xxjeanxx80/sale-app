const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log('BAD RESPONSE:', response.url(), response.status());
      try {
        console.log('BODY:', await response.text());
      } catch (e) {}
    }
  });

  // Set fake user in local storage so it bypasses login
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('pos_user', JSON.stringify({
      id: 1,
      full_name: 'Test',
      role: 'ADMIN'
    }));
  });

  console.log("Navigating to http://localhost:3000/services");
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle' });
  
  // Wait a bit to ensure useEffect runs
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
