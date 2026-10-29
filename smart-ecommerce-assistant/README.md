# NovaCart — Smart E-Commerce & Product Recommendation Assistant

A starter full-stack project with a React/Vite frontend, Express API, and optional Gemini-powered product recommendations.

## Requirements
- Node.js 20 or newer recommended
- npm
- Optional Gemini API key from Google AI Studio

## Run locally in VS Code

1. Extract this ZIP and open the `smart-ecommerce-assistant` folder in VS Code.
2. Open Terminal → New Terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file by copying `.env.example` to `.env`.
5. Paste your Gemini API key into `.env`:

   ```env
   GEMINI_API_KEY=your_real_key_here
   PORT=5000
   ```

   Never paste your API key into frontend code or commit `.env` to GitHub.

6. Start the frontend and backend:

   ```bash
   npm run dev
   ```

7. Open the local URL printed by Vite, usually `http://localhost:5173`.

Without a key, the app uses basic catalogue matching. With a valid key, the Express backend calls Gemini. The key is never sent to the browser.

## Customise the catalogue

Edit the `products` array in `server/index.js` for a demo. The current catalogue is sample content, not a live retailer feed. Product details and prices should be verified with sellers. For a real project, connect a legitimate product API or your own database.

## Production build

```bash
npm run build
npm start
```

The Express server serves `dist` after a production build.

## Deploy on Render

1. Push this project to a GitHub repository.
2. In Render, create a **Web Service** and connect that repository.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add `GEMINI_API_KEY` in Render's Environment settings. Add `PORT` only if required by your setup; Render provides a port automatically.
6. Deploy and test `/api/health`, product search, and AI recommendations.

Keep `.env` out of GitHub. Review Render and Gemini quotas/pricing before relying on the free tier.

## Current scope and limitations
- Demo product catalogue only; no real inventory, retailer pricing feed, checkout, accounts, or persistent wishlist.
- Wishlist and comparison state are local to the current browser session.
- AI recommendations are restricted to products in the sample catalogue.
- The retailer links point to brand websites, not verified product purchase pages.
