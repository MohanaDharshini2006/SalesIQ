import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const listModels = async () => {
    const gemKey = process.env.VITE_GEMINI_API_KEY;
    if (!gemKey) return;
    try {
        const genAI = new GoogleGenerativeAI(gemKey);
        // The SDK doesn't have a direct listModels, we usually just test known ones.
        // But we can try to see if a different model works.
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent('hi');
                console.log(`✅ Model ${m} is working`);
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
};

listModels();
