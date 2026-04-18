export async function generateProductDescription(product, isRetry = false) {
  const requestBody = {
    title: product.title,
    description: product.description,
    image: product.image
  };

  try {
    console.log(`[FRONTEND][ANALYZE] ${isRetry ? 'RETRY' : 'INITIAL'} | Body:`, requestBody);

    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('[FRONTEND][ANALYZE] Received:', data);

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.text || data.text.trim() === "") {
      throw new Error("EMPTY_RESPONSE");
    }

    return data;
  } catch (error) {
    console.error('[FRONTEND][ANALYZE] Error:', error.message);
    
    if (!isRetry) {
      console.log('[FRONTEND][ANALYZE] Attempting retry...');
      return generateProductDescription(product, true);
    }
    
    throw error;
  }
}
