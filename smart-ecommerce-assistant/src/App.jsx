import { useEffect, useMemo, useState } from "react";
import {
  Search, Sparkles, Heart, ArrowUpRight, SlidersHorizontal,
  GitCompareArrows, ShoppingBag, Menu, X, MessageCircle, ShieldCheck
} from "lucide-react";

const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(value);

function ProductCard({ product, saved, onSave, onCompare }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img className="product-image" src={product.image} alt={product.name} loading="lazy" />
        <button className={`icon-button save-button ${saved ? "saved" : ""}`}
          onClick={() => onSave(product)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className="category-tag">{product.category}</span>
      </div>
      <div className="product-content">
        <div className="rating">★ <span>{product.rating}</span><span className="muted"> / 5</span></div>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="feature-list">
          {product.features.slice(0, 3).map(feature => <span key={feature}>{feature}</span>)}
        </div>
        <div className="product-bottom">
          <div><small className="muted">Listed price</small><strong>{money(product.price)}</strong></div>
          <a className="external-link" href={product.link} target="_blank" rel="noreferrer" aria-label={`Visit ${product.name} website`}>
            <ArrowUpRight size={18} />
          </a>
        </div>
        <button className="compare-button" onClick={() => onCompare(product)}>
          <GitCompareArrows size={16} /> Add to compare
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState([]);
  const [compare, setCompare] = useState([]);
  const [answer, setAnswer] = useState("");
  const [aiProducts, setAiProducts] = useState([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then(r => { if (!r.ok) throw new Error("Unable to load catalogue"); return r.json(); })
      .then(data => setProducts(data.products || []))
      .catch(() => setError("Could not load products. Check that the server is running."))
      .finally(() => setLoadingProducts(false));
  }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);
  const visibleProducts = useMemo(() => products.filter(p => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesSearch = `${p.name} ${p.category} ${p.description} ${p.features.join(" ")}`
      .toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [products, category, search]);

  function toggleSaved(product) {
    setSaved(current => current.includes(product.id)
      ? current.filter(id => id !== product.id)
      : [...current, product.id]);
  }

  function toggleCompare(product) {
    setCompare(current => current.includes(product.id)
      ? current.filter(id => id !== product.id)
      : current.length < 3 ? [...current, product.id] : current);
  }

  async function askAssistant(event) {
    event?.preventDefault();
    if (!query.trim()) return;
    setAsking(true);
    setError("");
    setAnswer("");
    setAiProducts([]);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation request failed.");
      setAnswer(data.answer || "");
      setAiProducts(data.recommendations || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setAsking(false);
    }
  }

  const comparedProducts = products.filter(p => compare.includes(p.id));

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="NovaCart home">
          <span className="brand-mark"><ShoppingBag size={20} /></span>
          <span>nova<span className="brand-accent">cart</span><small>INTELLIGENT SHOPPING</small></span>
        </a>
        <button className="mobile-menu-toggle icon-button" onClick={() => setMobileMenu(v => !v)} aria-label="Toggle navigation">
          {mobileMenu ? <X /> : <Menu />}
        </button>
        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          <a className="active" href="#home" onClick={() => setMobileMenu(false)}>Discover</a>
          <a href="#products" onClick={() => setMobileMenu(false)}>Explore products</a>
          <a href="#compare" onClick={() => setMobileMenu(false)}>Compare <span className="nav-count">{compare.length}</span></a>
        </nav>
        <div className="header-actions">
          <span className="status-pill"><span /> AI assistant ready</span>
          <a className="wishlist-link" href="#products"><Heart size={17} /> <span>Saved</span> {saved.length}</a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> YOUR PERSONAL AI SHOPPER</div>
            <h1>Less scrolling.<br /><span>Smarter shopping.</span></h1>
            <p>Tell us what you need. Get thoughtful product recommendations that fit your priorities and your budget.</p>
            <div className="trust-line"><ShieldCheck size={16} /> Transparent suggestions from the available catalogue</div>
          </div>
          <form className="ai-search-panel" onSubmit={askAssistant}>
            <label htmlFor="ai-query"><Sparkles size={17} /> Ask your shopping assistant</label>
            <textarea id="ai-query" rows="3" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Find a laptop for coding under ₹60,000..." />
            <div className="prompt-chips">
              <button type="button" onClick={() => setQuery("Find a laptop for coding under ₹60,000")}>Laptop under ₹60k</button>
              <button type="button" onClick={() => setQuery("Recommend headphones for studying")}>Study headphones</button>
            </div>
            <button className="ask-button" type="submit" disabled={asking || !query.trim()}>
              {asking ? <span className="spinner" /> : <Sparkles size={17} />}
              {asking ? "Finding matches..." : "Find my best match"}
            </button>
          </form>
        </section>

        {(answer || error) && <section className="assistant-result" aria-live="polite">
          <div className="assistant-heading"><span className="assistant-icon"><MessageCircle size={18} /></span><div><strong>Shopping assistant</strong><small>{asking ? "Thinking..." : "Recommendation results"}</small></div></div>
          {error && <p className="error-text">{error}</p>}
          {answer && <p className="answer-text">{answer}</p>}
          {aiProducts.length > 0 && <div className="mini-results">{aiProducts.map(p => <div className="mini-result" key={p.id}><img src={p.image} alt="" /><div><strong>{p.name}</strong><span>{money(p.price)}</span></div></div>)}</div>}
          {!asking && answer && aiProducts.length === 0 && <p className="muted">No catalogue items matched this request. Try adjusting your budget or requirements.</p>}
        </section>}

        <section className="section-block" id="products">
          <div className="section-heading">
            <div><div className="eyebrow">CURATED FOR YOUR NEXT FIND</div><h2>Explore products<span className="purple-dot">.</span></h2><p className="muted">Browse the catalogue or ask AI to narrow it down.</p></div>
            <div className="catalogue-count"><SlidersHorizontal size={16} /> {visibleProducts.length} items</div>
          </div>
          <div className="catalogue-toolbar">
            <div className="catalogue-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, features..." /></div>
            <div className="category-tabs" aria-label="Filter products by category">
              {categories.map(c => <button key={c} className={category === c ? "category-tab selected" : "category-tab"} onClick={() => setCategory(c)}>{c}</button>)}
            </div>
          </div>
          {loadingProducts ? <div className="loading-state"><span className="spinner" /> Loading product catalogue...</div>
            : visibleProducts.length ? <div className="product-grid">{visibleProducts.map(p => <ProductCard key={p.id} product={p} saved={saved.includes(p.id)} onSave={toggleSaved} onCompare={toggleCompare} />)}</div>
            : <div className="empty-state"><Search size={26} /><h3>No products found</h3><p>Try another search or category.</p><button className="secondary-button" onClick={() => {setSearch("");setCategory("All");}}>Clear filters</button></div>}
        </section>

        <section className="section-block comparison-section" id="compare">
          <div className="section-heading"><div><div className="eyebrow">MAKE THE CALL WITH CONFIDENCE</div><h2>Product comparison<span className="purple-dot">.</span></h2><p className="muted">Choose up to three products to compare.</p></div></div>
          {comparedProducts.length === 0 ? <div className="compare-empty"><GitCompareArrows size={23} /><span>Add products using the “Add to compare” button above.</span></div> :
            <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Specification</th>{comparedProducts.map(p => <th key={p.id}>{p.name}<button onClick={() => toggleCompare(p)} className="remove-compare">Remove</button></th>)}</tr></thead><tbody>
              <tr><td>Price</td>{comparedProducts.map(p => <td key={p.id}>{money(p.price)}</td>)}</tr>
              <tr><td>Rating</td>{comparedProducts.map(p => <td key={p.id}>★ {p.rating} / 5</td>)}</tr>
              <tr><td>Category</td>{comparedProducts.map(p => <td key={p.id}>{p.category}</td>)}</tr>
              <tr><td>Features</td>{comparedProducts.map(p => <td key={p.id}>{p.features.join(", ")}</td>)}</tr>
            </tbody></table></div>}
        </section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><ShoppingBag size={17} /></span><span>nova<span className="brand-accent">cart</span></span></a><span>Shop thoughtfully. Choose confidently.</span><span className="footer-note">Demo catalogue · Verify details with sellers</span></footer>
    </div>
  );
}
