const { delay } = require('./utils');

async function updateHeadline(page, newHeadline) {
    console.log(`📝 Updating headline to: "${newHeadline}"`);

    if (!page.url().includes('profile')) {
        throw new Error("❌ Not on profile page");
    }

    try {
        // Find the edit button for the Resume Headline
        const editBtn = page.locator('.widgetHead:has-text("Resume headline") .edit').first();

        if (await editBtn.count() === 0) {
            console.log("⚠️ Headline edit button not found, skipping headline update.");
            return;
        }

        await editBtn.click();
        await delay(1000, 2000);

        const textarea = page.locator('textarea#resumeHeadlineTxt');
        await textarea.waitFor({ state: 'visible', timeout: 5000 });

        // Clear and fill the new headline
        await textarea.fill(newHeadline);
        await delay(1000, 2000);

        // Click save
        const saveBtn = page.locator('button[type="submit"]', { hasText: /^\s*Save\s*$/i }).first();
        await saveBtn.click();

        await delay(2000, 3000);
        console.log("✅ Headline updated successfully");
    } catch (error) {
        console.error("❌ Failed to update headline:", error.message);
    }
}

module.exports = updateHeadline;