 const { GoogleGenAI } = require("@google/genai");

 const ai = new GoogleGenAI({
   apiKey: process.env.GEMINI_API_KEY,
 });

 async function generateContent(prompt) {
   try {
     const result = await ai.models.generateContent({
       model: "gemini-2.0-flash",
       contents: prompt,
     });

     return result.text;
   } catch (error) {
     console.error("Error generating content:", error);
     return null;
   }
 }

 module.exports = { generateContent };