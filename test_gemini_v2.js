import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function test(version, modelName) {
  try {
    console.log(`Testing ${modelName} with ${version}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: version });
    const result = await model.generateContent("Hello");
    const response = await result.response;
    console.log(`Success with ${version}:`, response.text().substring(0, 50));
    return true;
  } catch (e) {
    console.error(`Failed with ${version}:`, e.message);
    return false;
  }
}

async function runTests() {
  await test("v1", "gemini-3-flash-preview");
  await test("v1beta", "gemini-3-flash-preview");
  await test("v1", "gemini-1.5-flash");
  await test("v1beta", "gemini-1.5-flash");
}

runTests();
