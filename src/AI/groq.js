const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generateGroqContent(prompt) {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || null;
    } catch (error) {
        console.error("Groq Error:", error);
        return null;
    }
}

module.exports = { generateGroqContent };