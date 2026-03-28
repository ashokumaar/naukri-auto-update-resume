const Groq = require("groq-sdk");
const { delay } = require('../utils');

// Get API keys from environment variables
const apiKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '').split(',').filter(key => key.trim());

if (apiKeys.length === 0) {
    console.error("❌ No GROQ_API_KEYS found in environment variables. Please add at least one key.");
}

// Create a pool of Groq clients
const groqClients = apiKeys.map(apiKey => new Groq({ apiKey: apiKey.trim() }));
let currentClientIndex = 0;

/**
 * Selects the next available Groq client from the pool in a cycle.
 * @returns {{client: Groq, index: number}} The next Groq client and its index.
 */
function getNextClient() {
    const client = groqClients[currentClientIndex];
    const index = currentClientIndex;
    currentClientIndex = (currentClientIndex + 1) % groqClients.length; // Cycle to the next client
    return { client, index };
}

async function generateGroqContent(prompt) {
    if (groqClients.length === 0) {
        console.error("❌ Cannot generate content because no Groq API keys are configured.");
        return null;
    }

    const totalClients = groqClients.length;
    // Give each key a chance to be tried, and then retry once if all fail.
    const maxAttempts = totalClients * 2;
    let attempts = 0;
    let lastError = null;

    while (attempts < maxAttempts) {
        const { client: groq, index: clientIndex } = getNextClient();

        try {
            console.log(`🤖 Attempting Groq API call with key #${clientIndex + 1}...`);
            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.6,
            });

            // If successful, return the content immediately
            return response.choices[0]?.message?.content || null;

        } catch (error) {
            lastError = error;
            // If it's a rate limit error, immediately switch to the next key.
            if (error.status === 429) {
                console.warn(`⚠️ Groq API rate limit hit for key #${clientIndex + 1}. Immediately switching to the next key.`);
                // No delay, the loop will just continue to the next client.
            } else {
                // For other errors (like invalid key or server issues), log and switch.
                console.error(`❌ Groq Error with key #${clientIndex + 1}: ${error.message}. Switching keys.`);
                // We can add a small delay here to prevent hammering the service if it's a server-side issue.
                await delay(1000);
            }
        }
        attempts++;
    }

    console.error(`❌ All Groq API attempts failed after ${maxAttempts} retries. All keys may be rate-limited or invalid. Last error:`, lastError ? lastError.message : "Unknown error");
    return null;
}

module.exports = { generateGroqContent };
