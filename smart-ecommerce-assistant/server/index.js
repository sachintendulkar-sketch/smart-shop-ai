import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Starter catalogue only. Replace with your own database or authorised product API.
const products = [
  { id: "p1", name: "Acer Aspire 7", category: "Laptops", price: 52990, rating: 4.3, description: "Performance laptop for coding, study and everyday productivity.", features: ["16GB RAM", "512GB SSD", "Dedicated graphics"], image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80", link: "https://www.acer.com/" },
  { id: "p2", name: "ASUS Vivobook 15", category: "Laptops", price: 46990, rating: 4.2, description: "Portable laptop for college, programming and office work.", features: ["16GB RAM", "512GB SSD", "Lightweight design"], image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80", link: "https://www.asus.com/" },
  { id: "p3", name: "Sony WH-CH720N", category: "Audio", price: 8990, rating: 4.4, description: "Wireless headphones with noise cancellation for music and study.", features: ["Noise cancelling", "Wireless", "Long battery life"], image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", link: "https://www.sony.co.in/" },
  { id: "p4", name: "Samsung Galaxy Buds FE", category: "Audio", price: 6999, rating: 4.1, description: "Compact wireless earbuds for calls, commuting and music.", features: ["Wireless", "Compact case", "Touch controls"], image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80", link: "https://www.samsung.com/in/" },
  { id: "p5", name: "Logitech MX Master 3S", category: "Accessories", price: 9995, rating: 4.6, description: "Ergonomic productivity mouse for multi-hour computer work.", features: ["Ergonomic", "Customisable buttons", "Wireless"], image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80", link: "https://www.logitech.com/" },
  { id: "p6", name: "Anker 20K Power Bank", category: "Accessories", price: 3499, rating: 4.3, description: "Portable charging for phones and compatible devices.", features: ["20000mAh class", "USB charging", "Travel friendly"], image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80", link: "https://www.anker.com/" }
];

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/products", (_req, res) => res.json({ products }));

app.post("/api/recommendations", async (req, res) => {
  const query = String(req.body?.query || "").trim();
  if (!query) return res.status(400).json({ error: "Enter what you are looking for." });
  if (query.length > 1200) return res.status(400).json({ error: "Please shorten your request." });

  // Without a key, still provide a useful keyword-and-budget based starter experience.
  if (!process.env.GEMINI_API_KEY) {
    const budgetMatch = query.match(/(?:under|below|less than|within|budget(?: of)?)\s*₹?\s*([\d,]+)/i);
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : Infinity;
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
    const matches = products
      .filter(p => p.price <= budget)
      .map(p => ({ ...p, score: terms.filter(t => `${p.name} ${p.category} ${p.description} ${p.features.join(" ")}`.toLowerCase().includes(t)).length }))
      .sort((a, b) => b.score - a.score || b.rating - a.rating)
      .slice(0, 4);
    return res.json({
      mode: "basic",
      answer: "Here are some catalogue matches. Add your Gemini API key to enable AI-generated shopping advice.",
      recommendations: matches.map(({ score, ...p }) => p)
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a careful shopping assistant. Use ONLY the catalogue below. Do not invent prices, specs, ratings, stock, or discounts. If nothing fits, say so. User request: ${query}\n\nCatalogue JSON:\n${JSON.stringify(products)}\n\nReturn JSON only with this schema: {"answer":"short helpful explanation","productIds":["p1","p2"]}. Choose at most 4 product IDs. Respect the user's budget and stated needs.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text || "{}");
    const ids = Array.isArray(parsed.productIds) ? parsed.productIds : [];
    const recommendations = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
    res.json({
      mode: "ai",
      answer: typeof parsed.answer === "string" ? parsed.answer : "Here are a few options from the catalogue.",
      recommendations
    });
  } catch (error) {
    console.error("Recommendation request failed:", error?.message || error);
    res.status(502).json({ error: "The AI assistant is temporarily unavailable. Please try again." });
  }
});

// In production, serve the built React app from the same Render web service.
const clientDist = path.resolve(__dirname, "../dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"), err => {
    if (err) next();
  });
});

app.listen(PORT, () => console.log(`NovaCart server running on port ${PORT}`));
