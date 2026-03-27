const { delay } = require('./utils');
const fs = require('fs');
const path = require('path');
const { generateGroqContent } = require('./AI/groq');

/**
 * Handles the chatbot-style questionnaire that appears after clicking "Apply".
 * @param {import('playwright').Page} page - The Playwright page object.
 * @param {string} profileContent - The content of my_profile.txt to use as context for Groq.
 * @returns {Promise<boolean>} - True if the questionnaire was handled successfully, false otherwise.
 */
async function handleQuestionnaire(page, profileContent) { // Added profileContent parameter
    console.log("🤖 Questionnaire detected. Starting AI-powered answering...");

    try {
        // Wait for the chatbot container to be visible
        const questionnaireContainer = page.locator('.chatbot_DrawerContentWrapper');
        await questionnaireContainer.waitFor({ state: 'visible', timeout: 10000 });

        let questionCount = 0;
        const maxQuestions = 10; // Safety break to avoid infinite loops

        // Loop through the questions until the questionnaire is submitted or we hit the max limit
        while (questionCount < maxQuestions) {
            // Wait for a new question from the bot
            await page.waitForSelector('.botMsg.msg', { timeout: 15000 });

            // Get all bot messages and extract the last one as the current question
            const questions = await page.locator('.botMsg.msg span').allTextContents();
            const currentQuestion = questions[questions.length - 1].trim();

            // If the bot says thank you, the application is likely complete
            if (currentQuestion.toLowerCase().includes('thank you') || currentQuestion.toLowerCase().includes('thanks')) {
                console.log("✅ Questionnaire completed (Thank you message detected).");
                return true;
            }

            console.log(`❓ Question ${questionCount + 1}: "${currentQuestion}"`);

            // Check for radio button answers first
            const radioOptions = page.locator('.ssrc__label');
            // Check for a text input field
            const textInput = page.locator('div[contenteditable="true"]');

            let answer = '';

            if (await radioOptions.count() > 0) {
                // --- Radio Button Question ---
                const options = await radioOptions.allTextContents();
                console.log(`🔍 Available options: ${options.join(', ')}`);

                // Construct a prompt for Groq to choose the best option using the full profileContent
                const prompt = `You are an expert job applicant. Based on the following profile, choose the best option for the question.
                Focus on the "Specific Q&A" section of the profile for direct answers.

                MY PROFILE:
                ${profileContent}

                QUESTION: "${currentQuestion}"
                OPTIONS: [${options.map(o => `"${o}"`).join(', ')}]

                Your answer should be ONLY the text of the best option from the list. For example: "15 days or less".`;

                // Get the answer from Groq
                const groqAnswer = await generateGroqContent(prompt);
                await delay(5000, 10000); // Add delay AFTER the API call to respect rate limits

                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate an answer. Attempting to skip question.");
                    // Try to find and click a skip button if available
                    const skipButton = page.locator('label:has-text("Skip this question")');
                    if (await skipButton.count() > 0) {
                        await skipButton.first().click();
                    } else {
                        return false; // No skip option, fail safely
                    }
                } else {
                    answer = groqAnswer.replace(/"/g, '').trim();
                    console.log(`🤖 Groq chose: "${answer}"`);
                    // Click the label corresponding to the chosen answer
                    await page.locator(`label:has-text("${answer}")`).first().click();
                }

            } else if (await textInput.count() > 0) {
                // --- Text Input Question ---
                console.log("🔍 Text input detected. Generating AI answer...");

                // Construct a prompt for Groq to generate a text answer using the full profileContent
                const prompt = `You are an expert job applicant. Extract a concise, direct answer from the provided profile for the given question.

                **INSTRUCTIONS:**
                1.  **Understand Question Variations**:
                    *   "d.o.b" or "DOB" means "Date of Birth".
                    *   "N.P" or "NP" means "Notice Period".
                    *   "CTC" means "Cost to Company" or salary.
                    *   "Exp" means "Experience".
                    *   "GitHub", "LinkedIn", "LeetCode" refer to profile links.
                2.  **Prioritize Sections**:
                    *   For common factual questions (Notice Period, CTC, DOB, Location, Visa, Career Break, Profile Links), look FIRST in the "Specific Q&A" section.
                    *   For experience in specific technologies (Java, Spring Boot, React, etc.), look in the "Skill Experience Breakdown" section.
                3.  **Handle Yes/No Questions**: If the question asks "Do you have experience in X?" or "Are you proficient with Y?", answer "Yes" if you find X or Y in your profile. If you find it, start your answer with "Yes" and then add the relevant experience (e.g., "Yes, 3.5 years"). If not found, answer "No".
                4.  **Default Response**: If you absolutely cannot find a relevant answer in the profile, respond with "N/A".

                **MY PROFILE:**
                ${profileContent}

                **QUESTION:** "${currentQuestion}"

                Respond with ONLY the direct answer, nothing else. Do not add explanations or conversational text.
                **Good Answer Examples**: "Yes, 3.5 years", "01-01-1995", "7.5", "N/A", "https://github.com/ashokumaar".`;

                const groqAnswer = await generateGroqContent(prompt);
                await delay(5000, 8000); // Add delay AFTER the API call to respect rate limits

                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate a text answer. Skipping.");
                    return false;
                }

                answer = groqAnswer.replace(/"/g, '').trim();
                console.log(`🤖 Groq generated: "${answer}"`);
                await textInput.fill(answer);

            } else {
                // This part can be expanded if we find other input types
                console.log("⚠️ Could not find radio buttons or a text input. Skipping for now.");
                return false; // Exit if we don't know how to handle it
            }

            // Click the "Save" or "Continue" button to submit the answer
            const saveButton = page.locator('.sendMsgbtn_container .sendMsg');
            await saveButton.click();
            console.log("✅ Answer submitted.");

            questionCount++;
            await delay(3000, 5000); // Wait for the next question to appear

            // Check if the application was successful after submitting an answer
            const isSuccess = await page.locator('text=/^Applied to/i').count() > 0 ||
                              await page.locator('text="Already Applied"').count() > 0;
            if (isSuccess) {
                console.log("✅ Application successful after questionnaire.");
                return true;
            }
        }

        console.log("⚠️ Reached max question limit. Exiting questionnaire handler.");
        return false;

    } catch (error) {
        console.error("❌ Error during questionnaire handling:", error.message);
        return false;
    }
}


async function autoApply(page, context, keyword, blocklist, profileContent) { // Added profileContent parameter
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

        const targetApplyCount = 5; // Number of successful applications desired
        console.log(`🎯 Goal: Successfully apply to ${targetApplyCount} jobs`);

        let hasNextPage = true;

        while (appliedCount < targetApplyCount && hasNextPage) {
            // Use the new selector for job cards
            const jobCards = page.locator('.sjw__tuple');
            const count = await jobCards.count();

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

                const jobCard = jobCards.nth(i);
                // Use the new selector for the company name
                const companyNameElement = jobCard.locator('.comp-name').first();
                let companyName = '';
                if (await companyNameElement.count() > 0) {
                    companyName = (await companyNameElement.textContent()).trim();
                }

                if (companyName && blocklist.includes(companyName)) {
                    console.log(`🚫 Skipping job at blocked company: ${companyName}`);
                    continue;
                }

                openedCount++;
                console.log(`🖱️ Analyzing job ${openedCount}...`);

                try {
                    // The 'a.title' selector is still correct within the job card
                    const jobLink = jobCard.locator('a.title');
                    const jobUrl = await jobLink.getAttribute('href');

                    if (!jobUrl) {
                        console.log("⏩ Could not find job URL, skipping.");
                        continue;
                    }

                    const newPage = await context.newPage();
                    await newPage.goto(jobUrl, { waitUntil: 'domcontentloaded' });
                    await delay(2000, 4000);

                    // CORRECTED: Use .first() to avoid strict mode violation
                    const companySiteButton = newPage.locator('#company-site-button').first();
                    if (await companySiteButton.count() > 0 && await companySiteButton.isVisible()) {
                        // Use a more robust selector for the company name on the details page
                        const companyElement = newPage.locator('div[class*="jd-header-comp-name"] a').first();
                        let companyNameToBlock = '';
                        if (await companyElement.count() > 0) {
                            companyNameToBlock = (await companyElement.textContent()).trim();
                        }

                        if (companyNameToBlock && !blocklist.includes(companyNameToBlock)) {
                            console.log(`🚫 Found "Apply on company site" for: ${companyNameToBlock}. Adding to blocklist.`);
                            blocklist.push(companyNameToBlock);
                            const blocklistPath = path.resolve(__dirname, 'blocklist.js');
                            const newBlocklistContent = `module.exports = ${JSON.stringify(blocklist, null, 4)};`;
                            fs.writeFileSync(blocklistPath, newBlocklistContent, 'utf8');
                        }
                        await newPage.close();
                        continue;
                    }

                    const applyBtn = newPage.locator('button', { hasText: /^\s*Apply\s*$/i }).first();

                    if (await applyBtn.count() > 0 && await applyBtn.isVisible()) {
                        await applyBtn.click();
                        await delay(3000, 4000); // Wait slightly longer after applying

                        // Check for immediate success OR a questionnaire
                        const isSuccess = await newPage.locator('text=/^Applied to/i').count() > 0 ||
                                          await newPage.locator('text="Already Applied"').count() > 0;

                        const isQuestionnaire = await newPage.locator('.chatbot_DrawerContentWrapper').count() > 0;

                        if (isSuccess) {
                            console.log("✅ Successfully applied for a job!");
                            appliedCount++;
                        } else if (isQuestionnaire) {
                            // Pass profileContent to handleQuestionnaire
                            const questionnaireSuccess = await handleQuestionnaire(newPage, profileContent); // Passed profileContent
                            if (questionnaireSuccess) {
                                console.log("✅ Application submitted via questionnaire.");
                                appliedCount++;
                            } else {
                                console.log("⚠️ Failed to complete questionnaire. Skipping job.");
                            }
                        } else {
                            console.log("⏩ No simple apply button or questionnaire found. Skipping.");
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
