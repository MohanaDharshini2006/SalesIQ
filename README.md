# StoreIQ - AI Representation Optimizer

StoreIQ is a professional merchant-facing diagnostic engine built for modern commerce. As AI shopping agents (ChatGPT, Google Search, and others) become the primary way consumers find products, StoreIQ ensures your Shopify store is AI-Ready by auditing, visualizing, and optimizing how LLMs perceive your data.

---

## Core Innovation
AI agents do not browse websites in the traditional sense; they consume structured data. If descriptions are ambiguous or trust signals are missing, AI agents will skip the store. StoreIQ makes this invisible problem visible and provides one-click fixes.

### Key Features
- Deterministic and Neural Audit: A hybrid engine that scores products across 4 pillars: Completeness, Clarity, Visibility, and Trust.
- Dual-Engine AI Fallback: High-reliability optimization using Groq (Llama 3) as primary and Gemini Pro as a fallback.
- Amazon-Style Auto-Fix: One-click generation of high-conversion, structured HTML descriptions optimized for both humans and LLMs.
- AI Chat Concierge: A context-aware chatbot that understands your store audit results and provides strategic growth advice.
- ROI Tracking (History): Persistent logs showing before and after scores to track the improvement of your store readiness.
- Glassmorphic UI: A premium, high-fidelity dashboard built with React and Tailwind CSS v4.

---

## Technical Architecture
StoreIQ is built for scale and reliability, addressing common AI API limitations:
- Batch Processing Engine: Reduces API quota consumption by analyzing multiple products in a single prompt.
- Resilient AI Middleware: Includes automatic retry logic for 429 errors and silent provider switching.
- Shopify Admin Integration: Real-time write-back capabilities via the Shopify Admin API (2024-01).

---

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- A Shopify Store (with read_products and write_products scopes)
- Groq API Key (Available at console.groq.com)
- Gemini API Key (Available at aistudio.google.com)

### 2. Installation
```powershell
git clone https://github.com/MohanaDharshini2006/SalesIQ.git
cd SalesIQ
npm install
```

### 3. Environment Setup
Create a .env file in the root directory:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxx
VITE_GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

### 4. Run Locally
Terminal 1 (Backend):
```bash
node server.js
```
Terminal 2 (Frontend):
```bash
npm run dev
```

---

## The Diagnostic Layer (4 Pillars)
1. Completeness: Does the product have sufficient metadata for an AI agent to index?
2. Content Clarity: Is the description free of ambiguous marketing fluff?
3. Search Visibility: Are SEO-critical attributes present and structured?
4. Trust Signals: Are reviews, policies, and variants clearly defined to allow a confident recommendation?

---

## Credits and Team
Building for the Advanced Track (Track 5) challenge.

- **Lead Developer:** Dharshini
- **AI Architecture:** Antigravity 
- **Platform:** StoreIQ Engine
