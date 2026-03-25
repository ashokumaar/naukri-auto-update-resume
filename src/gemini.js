const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates content using the Gemini Pro model.
 * @param {string} prompt The prompt to send to the model.
 * @returns {Promise<string>} The generated text.
 */
async function generateContent(prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
}

module.exports = { generateContent };
