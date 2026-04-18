import dotenv from 'dotenv';
dotenv.config();

async function listVisibleModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log('--- AVAILABLE MODELS ---');
      data.models.forEach(m => console.log(`- ${m.name}`));
      console.log('-------------------------');
    } else {
      console.log('No models found or error:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Diagnostic failed:', err.message);
  }
}

listVisibleModels();
