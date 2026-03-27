require('dotenv').config();
// Use playwright-extra to apply stealth plugin
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path'); // Import path module

const { loadCookies, delay } = require('./utils');
const login = require('./login');
const { goToProfile } = require('./navigation');
const uploadResume = require('./upload');
const updateHeadline = require('./headline');
const autoApply = require('./apply');
const simulateActivity = require('./activity');
const notify = require('./notify');
const blocklist = require('./blocklist');

// Apply the stealth plugin
chromium.use(StealthPlugin());

const COOKIE_PATH = './session/cookies.json';
const RESUME_PATH = './resume/Resume_AshokKumarVG.pdf';
const MY_PROFILE_PATH = path.resolve(__dirname, '../my_profile.txt'); // Path to my_profile.txt

console.log("EMAIL:", process.env.NAUKRI_EMAIL);

(async () => {
    // Load profile content from my_profile.txt
    let profileContent = '';
    try {
        profileContent = fs.readFileSync(MY_PROFILE_PATH, 'utf8');
        console.log("✅ Loaded profile content from my_profile.txt");
    } catch (error) {
        console.error(`❌ Error loading my_profile.txt: ${error.message}`);
        process.exit(1);
    }

    // Launch browser with stealth options
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized' // Launch browser maximized
        ]
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: null // Set viewport to null to use the browser's full size
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
        // await page.waitForLoadState('domcontentloaded');

        // Step 4.5: Update Headline (based on Even/Odd day)
        // const currentDay = new Date().getDate();
        // const newHeadline = currentDay % 2 === 0 ? process.env.NAUKRI_HEADLINE_EVEN : process.env.NAUKRI_HEADLINE_ODD;
        // if (newHeadline) {
        //     await updateHeadline(page, newHeadline);
        // }

        // Step 5: upload resume (NO activity here)
        // console.log("Before upload URL:", page.url());
        // await uploadResume(page, RESUME_PATH);

        // 🎯 Step 5.5: Auto Apply to Jobs
        const applyKeyword = process.env.JOB_SEARCH_KEYWORD;
        let appliedCount = 0;
        let openedCount = 0;
        if (applyKeyword) {
            // Pass profileContent to autoApply
            const result = await autoApply(page, context, applyKeyword, blocklist, profileContent);
            appliedCount = result.appliedCount;
            openedCount = result.openedCount;
        }

        // 📩 Step 6: notify success
        let summaryMessage;
        if (applyKeyword) {
            if (appliedCount > 0) {
                summaryMessage = `\n🎯 Auto-applied to ${appliedCount} jobs and opened ${openedCount} jobs to achieve this.`;
            } else {
                summaryMessage = `\n🚫 No new jobs found to apply. Opened ${openedCount} jobs.`;
            }
        } else {
            summaryMessage = '';
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