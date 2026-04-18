import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function verify() {
  try {
    const result = await model.generateContent("Say hello");
    console.log("Response:", result.response.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
}

verify();
