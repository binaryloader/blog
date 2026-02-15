'use strict';

const puppeteer = require('puppeteer');

let browser = null;

async function launch() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-lcd-text',
      ],
    });
  }
  return browser;
}

async function capture(html, outputPath, { width = 1080, height = 1080 } = {}) {
  const b = await launch();
  const page = await b.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png', omitBackground: false });
  await page.close();
}

async function close() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { launch, capture, close };
