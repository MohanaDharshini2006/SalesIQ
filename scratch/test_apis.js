import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const testGroq = async () => {
  console.log('Testing Groq...');
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.log('❌ Missing GROQ_API_KEY');
    return;
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Groq OK');
    } else {
      console.log('❌ Groq Failed:', data.error?.message || res.status);
    }
  } catch (e) {
    console.log('❌ Groq Error:', e.message);
  }
};

const testGemini = async () => {
  console.log('Testing Gemini...');
  const gemKey = process.env.VITE_GEMINI_API_KEY;
  if (!gemKey) {
    console.log('❌ Missing VITE_GEMINI_API_KEY');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(gemKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('test');
    const text = await result.response.text();
    console.log('✅ Gemini OK');
  } catch (e) {
    console.log('❌ Gemini Failed:', e.message);
  }
};

const run = async () => {
  await testGroq();
  console.log('----------------');
  await testGemini();
};

run();
