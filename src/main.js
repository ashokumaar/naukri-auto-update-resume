require('dotenv').config();
// Use playwright-extra to apply stealth plugin
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

const { loadCookies, delay } = require('./utils');
const login = require('./login');
const { goToProfile } = require('./navigation');
const uploadResume = require('./upload');
const simulateActivity = require('./activity');
const notify = require('./notify');

// Apply the stealth plugin
chromium.use(StealthPlugin());

const COOKIE_PATH = './session/cookies.json';
const RESUME_PATH = './resume/Resume_AshokKumarVG.pdf';

console.log("EMAIL:", process.env.NAUKRI_EMAIL);

(async () => {
    // Launch browser with stealth options
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1920,1080'
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
        }
    });

    await loadCookies(context, COOKIE_PATH);

    const page = await context.newPage();

    try {
        await page.goto('https://www.naukri.com');
        await delay();

        // 🔐 Step 1: login or skip
        await login(page, context, process.env.NAUKRI_EMAIL, process.env.NAUKRI_PASSWORD, COOKIE_PATH);

        // 📈 Step 2: simulate activity ONLY ON HOMEPAGE
        await simulateActivity(page);

        // 🔥 Step 3: go to profile
        await goToProfile(page);

        // 🔥 Step 4: ensure profile loaded
        await page.waitForLoadState('domcontentloaded');

        // 📄 Step 5: upload resume (NO activity here)
        console.log("Before upload URL:", page.url());
        await uploadResume(page, RESUME_PATH);

        // 📩 Step 6: notify success
        await notify(`✅ Naukri Update Success\n📅 ${new Date().toLocaleString()}`);

    } catch (err) {
        console.error(err);

        await page.screenshot({ path: 'error.png' });

        await notify("❌ Naukri Automation Failed");

        process.exit(1);
    } finally {
        await browser.close();
    }
})();
