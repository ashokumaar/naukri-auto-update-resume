const { delay } = require('./utils');

async function autoApply(page, context, keyword) {
    if (!keyword) {
        console.log("⏭️ No JOB_SEARCH_KEYWORD provided, skipping auto apply.");
        return { appliedCount: 0, openedCount: 0 };
    }

    console.log(`🔍 Searching for jobs to auto-apply: "${keyword}"`);
    let appliedCount = 0;
    let openedCount = 0;

    try {
        // Navigate to homepage to access the global search bar
        await page.goto('https://www.naukri.com/', { waitUntil: 'domcontentloaded' });
        await delay(2000, 4000);

        // Expand search bar if it's minimized (placeholder visible)
        const searchPlaceholder = page.locator('.nI-gNb-sb__placeholder');
        if (await searchPlaceholder.count() > 0 && await searchPlaceholder.isVisible()) {
            await searchPlaceholder.click();
            await delay(1000, 2000);
        }

        // 1. Enter Keyword
        const keywordInput = page.locator('input[placeholder*="Enter keyword"]');
        await keywordInput.waitFor({ state: 'visible', timeout: 5000 });
        await keywordInput.fill(keyword);
        await delay(1000, 1500);

        // 2. Select Experience (3 years)
        const expDropdown = page.locator('#experienceDD');
        if (await expDropdown.isVisible()) {
            await expDropdown.click();
            await delay(1000, 1500);
            await page.locator('.dropdownPrimary').locator('text=/3 years/i').first().click();
            await delay(1000, 1500);
        }

        // 3. Enter Location (Hyderabad)
        const locationInput = page.locator('input[placeholder*="Enter location"]');
        if (await locationInput.isVisible()) {
            await locationInput.fill("Hyderabad");
            await delay(1500, 2000); // Give time for UI state to process the location text
        }

        // 4. Click Search Button
        const searchBtn = page.locator('.nI-gNb-sb__icon-wrapper');
        await searchBtn.click();
        
        await page.waitForLoadState('domcontentloaded');
        await delay(4000, 6000);

        const targetApplyCount = 10; // Number of successful applications desired
        console.log(`🎯 Goal: Successfully apply to ${targetApplyCount} jobs`);

        let hasNextPage = true;

        while (appliedCount < targetApplyCount && hasNextPage) {
            // Locate job title links
            const jobLinks = page.locator('a.title');
            const count = await jobLinks.count();

            if (count === 0) {
                console.log("⚠️ No jobs found on this page.");
                break;
            }

            console.log(`📄 Found ${count} jobs on current page...`);

            for (let i = 0; i < count; i++) {
                if (appliedCount >= targetApplyCount) {
                    console.log(`🎉 Reached target of ${targetApplyCount} successful applications!`);
                    break;
                }
                
                openedCount++;
                console.log(`🖱️ Analyzing job ${openedCount}...`);
            
                try {
                    // Extract the URL instead of clicking, to completely avoid new-tab hanging issues
                    const jobUrl = await jobLinks.nth(i).getAttribute('href');
                    
                    if (!jobUrl) {
                        console.log("⏩ Could not find job URL, skipping.");
                        continue;
                    }

                    const newPage = await context.newPage();
                    await newPage.goto(jobUrl, { waitUntil: 'domcontentloaded' });

                    await delay(2000, 4000);

                    // Look strictly for an exact "Apply" button. Avoids "Apply on company website" or "Already Applied"
                    const applyBtn = newPage.locator('button', { hasText: /^\s*Apply\s*$/i }).first();
                    
                    if (await applyBtn.count() > 0 && await applyBtn.isVisible()) {
                        await applyBtn.click();
                        await delay(3000, 4000); // Wait slightly longer after applying
                        
                        // Verify if application was actually successful (checks for success messages or button state change)
                        const isSuccess = await newPage.locator('text=/successfully applied|applied successfully/i').count() > 0 ||
                                          await newPage.locator('text="Already Applied"').count() > 0;
                        
                        if (isSuccess) {
                            console.log("✅ Successfully applied for a job!");
                            appliedCount++;
                        } else {
                            console.log("⚠️ Questionnaire popup detected. Skipping as it requires manual answers.");
                        }
                    } else {
                        console.log("⏩ No Apply button available or already applied.");
                    }

                    await newPage.close();
                    await delay(1000, 2000);
                } catch (e) {
                    console.log(`❌ Failed to process job: ${e.message}`);
                }
            }

            // Try to navigate to the Next page if target isn't met
            if (appliedCount < targetApplyCount) {
                const nextBtn = page.locator('a:has-text("Next")').last();
                if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
                    console.log("➡️ Moving to next page of search results...");
                    await nextBtn.click();
                    await page.waitForLoadState('domcontentloaded');
                    await delay(4000, 6000);
                } else {
                    console.log("🛑 No more pages available.");
                    hasNextPage = false;
                }
            }
        }
    } catch (error) {
        console.error("❌ Auto apply completely failed:", error.message);
    }
    return { appliedCount, openedCount };
}

module.exports = autoApply;