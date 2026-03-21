require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

const { loadCookies, delay } = require('./utils');
const login = require('./login');
const { goToProfile } = require('./navigation');
const uploadResume = require('./upload');
const simulateActivity = require('./activity');
const notify = require('./notify');

const COOKIE_PATH = './session/cookies.json';
const RESUME_PATH = './resume/resume.pdf';

console.log("EMAIL:", process.env.NAUKRI_EMAIL);

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext();

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