require('dotenv').config();
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

const { loadCookies, delay } = require('./utils');
const login = require('./login');
const { goToProfile } = require('./navigation');
const uploadResume = require('./upload');
const updateHeadline = require('./headline');
const autoApply = require('./apply');
const simulateActivity = require('./activity');
const notify = require('./notify');
const blocklist = require('./blocklist');

chromium.use(StealthPlugin());

const COOKIE_PATH = './session/cookies.json';
const RESUME_PATH = './resume/Resume_AshokKumarVG.pdf';
const MY_PROFILE_PATH = path.resolve(__dirname, '../my_profile.txt');

console.log("EMAIL:", process.env.NAUKRI_EMAIL ? "Loaded" : "Not Found");

(async () => {
    let profileContent = '';
    try {
        profileContent = fs.readFileSync(MY_PROFILE_PATH, 'utf8');
        console.log("✅ Loaded profile content from my_profile.txt");
    } catch (error) {
        console.error(`❌ Error loading my_profile.txt: ${error.message}`);
        process.exit(1);
    }

    // Launch a browser instance with stealth settings to avoid detection.
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized'
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: null
    });

    await loadCookies(context, COOKIE_PATH);
    const page = await context.newPage();

    try {
        // AUTOMATION STEPS
        await page.goto('https://www.naukri.com');
        await delay();

        // 1. Log in if cookies are invalid or missing.
        await login(page, context, process.env.NAUKRI_EMAIL, process.env.NAUKRI_PASSWORD, COOKIE_PATH);

        // 2. Simulate some random user activity on the homepage to appear more human.
        await simulateActivity(page);

        // 3. Navigate to the user's profile page.
        await goToProfile(page);
        await page.waitForLoadState('domcontentloaded');

        // 4. Update profile headline with a minor change to trigger "profile updated" status.
        //    (Appends a dot on odd days, removes it on even days).
        const currentDay = new Date().getDate();
        const newHeadline = currentDay % 2 === 0 ? process.env.NAUKRI_HEADLINE : process.env.NAUKRI_HEADLINE + '.';
        if (newHeadline) {
            await updateHeadline(page, newHeadline);
        }

        // 5. Re-upload the resume to ensure it's the latest version on the profile.
        await uploadResume(page, RESUME_PATH);

        // 6. Automatically search for and apply to jobs based on the keyword in the .env file.
        const applyKeyword = process.env.JOB_SEARCH_KEYWORD;
        let appliedCount = 0;
        let openedCount = 0;
        if (applyKeyword) {
            const result = await autoApply(page, context, applyKeyword, blocklist, profileContent);
            appliedCount = result.appliedCount;
            openedCount = result.openedCount;
        }

        // SUCCESS NOTIFICATION
        let summaryMessage;
        if (applyKeyword) {
            if (appliedCount > 0) {
                summaryMessage = `\n🎯 Auto-applied to ${appliedCount} jobs and opened ${openedCount} jobs to achieve this.`;
            } else {
                summaryMessage = `\n🚫 No new jobs found to apply. Opened ${openedCount} jobs.`;
            }
        } else {
            summaryMessage = '\n⏩ Auto-apply was skipped (no keyword provided).';
        }
        await notify(`✅ Naukri Update Success\n📅 ${new Date().toLocaleString()}` + summaryMessage);

    } catch (err) {
        console.error(err);
        await page.screenshot({ path: 'error.png' });
        await notify("❌ Naukri Automation Failed");
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
