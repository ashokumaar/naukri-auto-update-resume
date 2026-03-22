const { delay, retry } = require('./utils');

async function uploadResume(page, RESUME_PATH) {
    console.log("📄 Uploading resume...");

    if (!page.url().includes('profile')) {
        throw new Error("❌ Not on profile page");
    }

    // 🔥 Step 1: Click Update Resume (IMPORTANT)
    const updateBtn = page.locator('text=Update Resume');

    if (await updateBtn.count() > 0) {
        await updateBtn.click();
        console.log("🖱️ Clicked Update Resume");
        await delay(2000, 4000);
    }

    // 🔥 Step 2: Wait for file input
    // Use state: 'attached' because file inputs are often visually hidden on the page
    await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 20000 });

    const fileInput = page.locator('input[type="file"]').first();

    await retry(async () => {
        await fileInput.setInputFiles(RESUME_PATH);
    });

    await delay(3000, 5000);

    console.log("✅ Resume uploaded");
}

module.exports = uploadResume;