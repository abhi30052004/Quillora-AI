import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://127.0.0.1:5173';

async function checkOverflow() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });
  await page.goto(APP_URL, { waitUntil: 'networkidle0' });

  const overflowInfo = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const overflowing = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 1) {
        overflowing.push({
          tag: el.tagName,
          className: el.className,
          right: rect.right,
          docWidth: docWidth,
        });
      }
    });
    return overflowing;
  });

  console.log('Overflow elements at 375px:', JSON.stringify(overflowInfo, null, 2));
  await browser.close();
}

checkOverflow();
