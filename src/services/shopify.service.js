import axios from 'axios';

const getConfig = () => ({
  domain: process.env.SHOPIFY_STORE_DOMAIN,
  token: process.env.SHOPIFY_ACCESS_TOKEN
});

const normalizeProducts = (products) =>
  products.map(p => ({
    id: String(p.id),
    title: p.title || 'Untitled',
    description: p.body_html || '',
    price: p.variants?.[0]?.price ? `$${p.variants[0].price}` : 'N/A',
    variants: p.variants?.length > 0 ? p.variants.map(v => v.title).filter(t => t !== 'Default Title').join(', ') : '',
    image: p.image?.src || p.images?.[0]?.src || null,
    vendor: p.vendor || '',
    tags: p.tags || ''
  }));

export const fetchProducts = async () => {
  const { domain, token } = getConfig();
  if (!domain || !token) throw new Error('Missing Shopify credentials in .env');
  const r = await axios.get(`https://${domain}/admin/api/2024-01/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
  });
  return normalizeProducts(r.data.products);
};

export const checkWritePermission = async () => {
  const { domain, token } = getConfig();
  try {
    const r = await axios.get(`https://${domain}/admin/oauth/access_scopes.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const scopes = r.data.access_scopes?.map(s => s.handle) || [];
    return scopes.includes('write_products');
  } catch {
    return false; // Can't check, assume no
  }
};

export const updateProduct = async (productId, title, descriptionHtml, seoKeywords = []) => {
  const { domain, token } = getConfig();
  if (!domain || !token) throw new Error('Missing Shopify credentials in .env');

  // Check write scope first
  const canWrite = await checkWritePermission();
  if (!canWrite) {
    const err = new Error('WRITE_PERMISSION_MISSING');
    err.isPermissionError = true;
    throw err;
  }

  const payload = { product: { id: productId } };
  if (title) payload.product.title = title;
  if (descriptionHtml) payload.product.body_html = descriptionHtml;
  if (seoKeywords?.length > 0) payload.product.tags = seoKeywords.join(', ');

  const r = await axios.put(`https://${domain}/admin/api/2024-01/products/${productId}.json`, payload, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
  });
  return r.data.product;
};
