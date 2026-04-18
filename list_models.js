import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function list() {
  try {
    const models = await genAI.listModels(); // This might not be a function in recent SDKs
    console.log(JSON.stringify(models, null, 2));
  } catch (e) {
    // Try listing differently
    console.error(e.message);
  }
}

list();
