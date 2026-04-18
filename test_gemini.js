import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    console.log("Testing gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    const response = await result.response;
    console.log("Success:", response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
    
    try {
      console.log("Testing gemini-1.5-flash-latest...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent("Hello");
      const response = await result.response;
      console.log("Success with -latest:", response.text());
    } catch (e2) {
      console.error("Failed with gemini-1.5-flash-latest:", e2.message);
    }
  }
}

test();
