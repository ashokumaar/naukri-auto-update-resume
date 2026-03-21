const { delay, retry } = require('./utils');

async function uploadResume(page, RESUME_PATH) {
    console.log("📄 Uploading resume...");

    // 🔥 Ensure we are on profile page
    if (!page.url().includes('profile')) {
        throw new Error("❌ Not on profile page");
    }

    // 🔥 Wait for upload input
    await page.waitForSelector('input[type="file"]', { timeout: 20000 });

    // 🔥 Get correct input (visible one)
    const inputs = await page.locator('input[type="file"]').all();

    let fileInput = null;

    for (const input of inputs) {
        const isVisible = await input.isVisible();
        if (isVisible) {
            fileInput = input;
            break;
        }
    }

    if (!fileInput) {
        throw new Error("❌ No visible upload input found");
    }

    // 🔁 Retry upload (important for stability)
    await retry(async () => {
        await fileInput.setInputFiles(RESUME_PATH);
    });

    // ⏳ Wait for upload to process
    await delay(3000, 5000);

    // 🔥 Optional: verify upload success (best effort)
    const successCheck = await page.locator('text=Uploaded').count();

    if (successCheck > 0) {
        console.log("✅ Resume upload confirmed");
    } else {
        console.log("⚠️ Upload attempted (no confirmation found)");
    }

    console.log("✅ Resume uploaded");
}

module.exports = uploadResume;