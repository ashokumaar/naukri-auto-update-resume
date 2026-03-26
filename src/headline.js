const { delay } = require('./utils');
//const { generateContent } = require('./AI/gemini');
const { generateGroqContent } = require('./AI/groq');
const generateContent = generateGroqContent;

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

        let finalHeadline = newHeadline;

        // If Grok API key is available, generate a new headline
        if (process.env.GROQ_API_KEY) {
            console.log('✨ Generating new headline with Groq...');
            const prompt = `Generate a creative and professional headline for a ${process.env.JOB_TITLE || 'Software Engineer'} with ${process.env.YEARS_OF_EXPERIENCE || '5'} years of experience. The headline should be concise and suitable for a job portal profile. Only return the headline text.`;
            const generatedHeadline = await generateContent(prompt);
            if (generatedHeadline) {
                finalHeadline = generatedHeadline.trim().replace(/"/g, ''); // Remove quotes
                console.log(`✨ New headline: ${finalHeadline}`);
            } else {
                console.log('⚠️ Could not generate a new headline using Groq. Using the provided headline.');
            }
        }

        // Clear and fill the new headline
        await textarea.fill(finalHeadline);
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