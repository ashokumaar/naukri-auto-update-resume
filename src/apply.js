const { delay } = require('./utils');
const fs = require('fs');
const path = require('path');
const { generateGroqContent } = require('./AI/groq');

/**
 * Handles the chatbot-style questionnaire with improved stability and error handling.
 * @param {import('playwright').Page} page - The Playwright page object.
 * @param {string} profileContent - The content of my_profile.txt.
 * @param {string} jobUrl - The URL of the job being applied to.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
async function handleQuestionnaire(page, profileContent, jobUrl) {
    console.log("🤖 Questionnaire detected. Starting AI-powered answering...");

    try {
        const questionnaireContainer = page.locator('.chatbot_DrawerContentWrapper');
        await questionnaireContainer.waitFor({ state: 'visible', timeout: 10000 });

        let questionCount = 0;
        const maxQuestions = 15;

        while (questionCount < maxQuestions) {
            const botMessages = page.locator('.botMsg.msg span');
            await botMessages.last().waitFor({ state: 'visible', timeout: 15000 });
            const currentQuestion = (await botMessages.last().textContent() || '').trim();
            const initialBotMessageCount = await botMessages.count();

            if (!currentQuestion) {
                console.log("⚠️ Detected an empty question. Waiting for a valid question...");
                await delay(2000);
                continue;
            }

            if (currentQuestion.toLowerCase().includes('thank you') || currentQuestion.toLowerCase().includes('thanks')) {
                console.log("✅ Questionnaire completed (Thank you message detected).");
                return true;
            }

            console.log(`❓ Question ${questionCount + 1}: "${currentQuestion}"`);

            const textInput = page.locator('div[contenteditable="true"]');
            const radioOptions = page.locator('.ssrc__label');
            const checkboxOptions = page.locator('.mcc__label');
            const chipOptions = page.locator('.chatbot_Chip');
            let needsSaveButton = false;

            if (await textInput.isVisible({ timeout: 1000 })) {
                needsSaveButton = true;
                console.log("🔍 Text input detected. Generating AI answer...");

                const prompt = `You are an expert job applicant. Your task is to extract a concise, direct answer from the provided profile for the given question.

                **INSTRUCTIONS:**
                1.  **Analyze Holistically**: Read the entire profile to understand the user's skills and experience. Infer skills from job titles (e.g., a "Java Backend Developer" knows "REST APIs").
                2.  **Direct Extraction**: If the question asks for years of experience in a skill (e.g., "Java"), find the number in the profile and respond with only that (e.g., "3.5 years").
                3.  **No Conversational Text**: Do not add prefixes like "Yes," or any other conversational text.
                4.  **"N/A" as a Last Resort**: Only if the skill is completely unrelated to the profile and cannot be reasonably inferred, respond with the single word: "N/A".

                **MY PROFILE:**
                ${profileContent}

                **QUESTION:** "${currentQuestion}"

                Respond with ONLY the direct answer or "N/A".`;

                const groqAnswer = await generateGroqContent(prompt);
                await delay(5000, 8000);

                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate a text answer. Skipping.");
                    return false;
                }

                const answer = groqAnswer.replace(/"/g, '').trim();
                console.log(`🤖 Groq generated: "${answer}"`);

                await textInput.fill(answer);

            } else if (await checkboxOptions.first().isVisible({ timeout: 1000 })) {
                needsSaveButton = true;
                const options = await checkboxOptions.allTextContents();
                console.log(`🔍 Available options (Checkbox): ${options.join(', ')}`);
                const prompt = `You are an expert job applicant. Based on your profile, select all relevant options for the question.
                MY PROFILE:
                ${profileContent}
                QUESTION: "${currentQuestion}"
                OPTIONS: [${options.map(o => `"${o}"`).join(', ')}]
                Respond with a semicolon-separated list of the options to select (e.g., "Option 1;Option 2").`;
                const groqAnswer = await generateGroqContent(prompt);
                await delay(2000, 3000);
                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate answers for checkboxes. Skipping job.");
                    return false;
                }
                const selectedOptions = groqAnswer.split(';').map(opt => opt.trim().replace(/"/g, ''));
                console.log(`🤖 Groq chose: ${selectedOptions.join('; ')}`);
                let allOptionsFoundAndClicked = true;
                await delay(1000);
                const allLabelLocators = await page.locator('label.mcc__label').all();
                for (const optionToClick of selectedOptions) {
                    let foundMatch = false;
                    for (const label of allLabelLocators) {
                        const labelText = await label.textContent();
                        if (labelText && labelText.trim().toLowerCase() === optionToClick.toLowerCase()) {
                            await label.click();
                            console.log(`✅ Clicked checkbox label: "${optionToClick}"`);
                            foundMatch = true;
                            break;
                        }
                    }
                    if (!foundMatch) {
                        console.log(`⚠️ Could not find a clickable label for option: "${optionToClick}"`);
                        allOptionsFoundAndClicked = false;
                        break;
                    }
                }
                if (!allOptionsFoundAndClicked) {
                    console.error("❌ Failed to select one or more checkbox options. Aborting.");
                    return false;
                }
            } else if (await radioOptions.first().isVisible({ timeout: 1000 })) {
                needsSaveButton = true;
                const options = await radioOptions.allTextContents();
                console.log(`🔍 Available options (Radio): ${options.join(', ')}`);
                const prompt = `You are an expert job applicant. Based on your profile, choose the single best option for the question.
                **INSTRUCTIONS:**
                1.  **Analyze**: Read the question and the options carefully.
                2.  **Select**: Choose the most fitting option from the list based on the profile.
                3.  **Respond**: Your response must be ONLY the exact text of the chosen option. Do not add any other words, explanations, or punctuation.
                **MY PROFILE:**
                ${profileContent}
                **QUESTION:** "${currentQuestion}"
                **OPTIONS:** [${options.map(o => `"${o}"`).join(', ')}]
                Your response must be one of: [${options.map(o => `"${o}"`).join(', ')}].`;

                const groqAnswer = await generateGroqContent(prompt);
                await delay(5000, 10000);
                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate an answer. Skipping.");
                    return false;
                }
                const answer = groqAnswer.replace(/"/g, '').trim();
                console.log(`🤖 Groq chose: "${answer}"`);

                const isValidOption = options.some(opt => opt.trim().toLowerCase() === answer.toLowerCase());
                if (!isValidOption) {
                    console.error(`❌ AI generated an invalid option: "${answer}". Valid options are: [${options.join(', ')}]. Aborting.`);
                    return false;
                }

                await page.locator(`label:has-text("${answer}")`).first().click();

            } else if (await chipOptions.first().isVisible({ timeout: 1000 })) {
                needsSaveButton = false;
                const options = await chipOptions.allTextContents();
                console.log(`🔍 Available options (Chips): ${options.join(', ')}`);
                const prompt = `You are an expert job applicant. Based on your profile, choose the single best option for the question.
                **INSTRUCTIONS:**
                1.  **Analyze**: Read the question and the options carefully.
                2.  **Select**: Choose the most fitting option from the list based on the profile.
                3.  **Respond**: Your response must be ONLY the exact text of the chosen option. Do not add any other words, explanations, or punctuation.
                **MY PROFILE:**
                ${profileContent}
                **QUESTION:** "${currentQuestion}"
                **OPTIONS:** [${options.map(o => `"${o}"`).join(', ')}]
                Your response must be one of: [${options.map(o => `"${o}"`).join(', ')}].`;

                const groqAnswer = await generateGroqContent(prompt);
                if (!groqAnswer) {
                    console.log("⚠️ Groq could not generate an answer for chips. Skipping.");
                    return false;
                }
                const answer = groqAnswer.replace(/"/g, '').trim();
                console.log(`🤖 Groq chose: "${answer}"`);

                const isValidOption = options.some(opt => opt.trim().toLowerCase() === answer.toLowerCase());
                if (!isValidOption) {
                    console.error(`❌ AI generated an invalid option: "${answer}". Valid options are: [${options.join(', ')}]. Aborting.`);
                    return false;
                }

                await page.locator('.chatbot_Chip', { hasText: new RegExp(`^${answer}$`, 'i') }).first().click();
            } else {
                console.log("⚠️ Unhandled question type detected. Logging for manual review.");
                if (jobUrl) fs.appendFileSync(path.resolve(__dirname, '../review_queue.txt'), `${jobUrl}\n`);
                return false;
            }

            if (needsSaveButton) {
                const saveButton = page.locator('.sendMsgbtn_container .sendMsg');
                if (await saveButton.isVisible()) {
                    await saveButton.click({ force: true });
                    console.log("✅ Answer submitted.");
                } else {
                    console.log("✅ Answer submitted (no save button needed).");
                }
            } else {
                console.log("✅ Answer submitted (auto-submit).");
            }

            await delay(2000);
            questionCount++;

            try {
                await page.waitForFunction(
                    (initialCount) => document.querySelectorAll('.botMsg.msg span').length > initialCount,
                    initialBotMessageCount,
                    { timeout: 15000 }
                );
            } catch (e) {
                console.log("⏳ Timeout waiting for bot's reaction. Checking for success before failing...");
                const isSuccess = await page.locator('text=/^Applied to/i').count() > 0 ||
                                  await page.locator('text="Already Applied"').count() > 0;
                if (isSuccess) {
                    console.log("✅ Application successful after timeout.");
                    return true;
                }
                throw new Error("Timeout waiting for the bot to respond after submitting an answer.");
            }

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
        if (jobUrl) {
            console.log(`📝 Saving failed job URL for review: ${jobUrl}`);
            fs.appendFileSync(path.resolve(__dirname, '../review_queue.txt'), `${jobUrl}\n`);
        }
        return false;
    }
}


async function autoApply(page, context, keyword, blocklist, profileContent) {
    if (!keyword) {
        console.log("⏭️ No JOB_SEARCH_KEYWORD provided, skipping auto apply.");
        return { appliedCount: 0, openedCount: 0 };
    }

    console.log(`🔍 Searching for jobs to auto-apply: "${keyword}"`);
    let appliedCount = 0;
    let openedCount = 0;

    try {
        await page.goto('https://www.naukri.com/', { waitUntil: 'domcontentloaded' });
        await delay(2000, 4000);

        const searchPlaceholder = page.locator('.nI-gNb-sb__placeholder');
        if (await searchPlaceholder.count() > 0 && await searchPlaceholder.isVisible()) {
            await searchPlaceholder.click();
            await delay(1000, 2000);
        }

        const keywordInput = page.locator('input[placeholder*="Enter keyword"]');
        await keywordInput.waitFor({ state: 'visible', timeout: 5000 });
        await keywordInput.fill(keyword);
        await delay(1000, 1500);

        const expDropdown = page.locator('#experienceDD');
        if (await expDropdown.isVisible()) {
            await expDropdown.click();
            await delay(1000, 1500);
            await page.locator('.dropdownPrimary').locator('text=/3 years/i').first().click();
            await delay(1000, 1500);
        }

        const locationInput = page.locator('input[placeholder*="Enter location"]');
        if (await locationInput.isVisible()) {
            await locationInput.fill("Hyderabad");
            await delay(1500, 2000);
        }

        const searchBtn = page.locator('.nI-gNb-sb__icon-wrapper');
        await searchBtn.click();

        await page.waitForLoadState('domcontentloaded');
        await delay(4000, 6000);

        const targetApplyCount = 10;
        console.log(`🎯 Goal: Successfully apply to ${targetApplyCount} jobs`);

        let hasNextPage = true;

        while (appliedCount < targetApplyCount && hasNextPage) {
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

                let jobUrl;
                try {
                    const jobLink = jobCard.locator('a.title');
                    jobUrl = await jobLink.getAttribute('href');

                    if (!jobUrl) {
                        console.log("⏩ Could not find job URL, skipping.");
                        continue;
                    }

                    console.log(`🔗 Opening job link: ${jobUrl}`);

                    const newPage = await context.newPage();
                    await newPage.goto(jobUrl, { waitUntil: 'domcontentloaded' });
                    await delay(2000, 4000);

                    const companySiteButton = newPage.locator('#company-site-button').first();
                    if (await companySiteButton.count() > 0 && await companySiteButton.isVisible()) {
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
                        await delay(3000, 4000);

                        const isSuccess = await newPage.locator('text=/^Applied to/i').count() > 0 ||
                                          await newPage.locator('text="Already Applied"').count() > 0;

                        const isQuestionnaire = await newPage.locator('.chatbot_DrawerContentWrapper').count() > 0;

                        if (isSuccess) {
                            console.log("✅ Successfully applied for a job!");
                            appliedCount++;
                            console.log("As of now", appliedCount," jobs were applied successfully");
                        } else if (isQuestionnaire) {
                            const questionnaireSuccess = await handleQuestionnaire(newPage, profileContent, jobUrl);
                            if (questionnaireSuccess) {
                                console.log("✅ Application submitted via questionnaire.");
                                appliedCount++;
                                console.log("As of now", appliedCount," jobs were applied successfully");
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
                    if (jobUrl) {
                        console.log(`📝 Saving failed job URL for review: ${jobUrl}`);
                        fs.appendFileSync(path.resolve(__dirname, '../review_queue.txt'), `${jobUrl}\n`);
                    }
                }
            }

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
