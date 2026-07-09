import React, { useState, useEffect, useMemo } from "react";
import { 
  Sparkles, Copy, Check, Bookmark, History, TrendingUp, Search, 
  Plus, Trash2, User, Download, FileText, Lightbulb, 
  ShieldCheck, RefreshCw, Sun, Moon, ExternalLink, X, Info
} from "lucide-react";
import { GeneratedPromptIdea, PromptHistoryItem, PromptTemplate } from "../types";
import { READY_MADE_TEMPLATES } from "../data/promptTemplates";

interface AIPromptGeneratorProps {
  user: { email: string; brandName: string; shopifyDomain: string } | null;
  onLogoSelected: (logo: any) => void;
  onSwitchToStudio: () => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

const CREATIVE_SPARKS = [
  { keyword: "Astronaut Fishing", style: "vintage", category: "T-shirt", emoji: "🧑‍🚀" },
  { keyword: "Boba Tea Dinosaur", style: "cartoon", category: "Mug", emoji: "🦕" },
  { keyword: "Cyberpunk Ramen Cat", style: "anime", category: "Sticker", emoji: "🐱" },
  { keyword: "Sarcastic Coding Sloth", style: "funny", category: "Poster", emoji: "🦥" },
  { keyword: "Geometric Golden Stag", style: "luxury", category: "Hoodie", emoji: "🦌" },
  { keyword: "Retro Hiking Bear", style: "vintage", category: "T-shirt", emoji: "🐻" },
  { keyword: "Psychedelic Mushroom", style: "anime", category: "Sticker", emoji: "🍄" },
  { keyword: "Coffee & Chaos", style: "typography", category: "Mug", emoji: "☕" },
  { keyword: "Abstract Oasis", style: "minimal", category: "Phone Case", emoji: "🌴" },
  { keyword: "Chibi Ramen Shiba", style: "cartoon", category: "Sticker", emoji: "🐕" },
  { keyword: "Ethereal Celestial Moon", style: "luxury", category: "Poster", emoji: "🌙" },
  { keyword: "Coffee Lover Skeleton", style: "vintage", category: "T-shirt", emoji: "💀" },
];

export default function AIPromptGenerator({
  user,
  onLogoSelected,
  onSwitchToStudio,
  theme,
  onThemeToggle
}: AIPromptGeneratorProps) {
  // --- Core States ---
  const [keyword, setKeyword] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("minimal");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // --- Niche Creative Sparks State ---
  const [activeSparks, setActiveSparks] = useState<{ keyword: string; style: string; category: string; emoji: string }[]>(() => {
    return [...CREATIVE_SPARKS].sort(() => 0.5 - Math.random()).slice(0, 4);
  });

  const rollNewSparks = () => {
    const shuffled = [...CREATIVE_SPARKS].sort(() => 0.5 - Math.random()).slice(0, 4);
    setActiveSparks(shuffled);
    triggerToast("Refreshed creative niche sparks!");
  };

  // --- Generation Results State ---
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedPromptIdea[]>([]);
  const [activeGenerationMode, setActiveGenerationMode] = useState<"ai" | "offline" | null>(null);

  // --- Local Persistence: History & Favorites ---
  const [history, setHistory] = useState<PromptHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("merch-prompt-history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<GeneratedPromptIdea[]>(() => {
    try {
      const saved = localStorage.getItem("merch-prompt-favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // --- Ready-Made Templates State ---
  const [templates, setTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("merch-custom-templates");
      return saved ? JSON.parse(saved) : READY_MADE_TEMPLATES;
    } catch {
      return READY_MADE_TEMPLATES;
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("All");

  // --- Admin Panel State ---
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    category: "t-shirt" as const,
    style: "minimal",
    description: "",
    prompt: ""
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // --- Simulated Registered Users Log (Admin Section) ---
  const [adminUsers, setAdminUsers] = useState<{ email: string; brandName: string; shopifyDomain: string; role: string; date: string }[]>([
    { email: "piyushchaudhary21877@gmail.com", brandName: "Aura Apparel", shopifyDomain: "aura-apparel.myshopify.com", role: "Merchant (Owner)", date: "2026-07-08" },
    { email: "sarah.smith@podmaster.com", brandName: "Zenith Thread", shopifyDomain: "zenith-threads.myshopify.com", role: "Merchant (Pro)", date: "2026-07-05" },
    { email: "tokyo.hype@vintage.io", brandName: "Tokyo Hype", shopifyDomain: "tokyo-vintage-street.myshopify.com", role: "Merchant (Enterprise)", date: "2026-07-01" },
    { email: "funny.print@stickerhq.com", brandName: "StickerHQ", shopifyDomain: "sticker-hq-funny.myshopify.com", role: "Merchant (Free)", date: "2026-06-25" }
  ]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("merch-prompt-history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("merch-prompt-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("merch-custom-templates", JSON.stringify(templates));
  }, [templates]);

  // Add active user to admin logs on mount if they aren't already there
  useEffect(() => {
    if (user) {
      const exists = adminUsers.some(u => u.email === user.email);
      if (!exists) {
        setAdminUsers(prev => [
          {
            email: user.email,
            brandName: user.brandName,
            shopifyDomain: user.shopifyDomain,
            role: "Active Merchant",
            date: new Date().toISOString().split("T")[0]
          },
          ...prev
        ]);
      }
    }
  }, [user]);

  // Notification Helper
  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- AI Generator Submit Handler ---
  const handleGeneratePrompts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError("Please enter a keyword topic to prompt the AI generator.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStatus("Formulating creative prompt strategies...");

    setTimeout(() => {
      setLoadingStatus("Connecting to Google Gemini API (gemini-3.5-flash)...");
    }, 800);

    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          style: selectedStyle,
          productType: selectedProduct
        })
      });

      if (!res.ok) {
        throw new Error("Server returned an unsuccessful response during design prompt generation.");
      }

      const data = await res.json();
      if (data.success && data.ideas) {
        setGeneratedIdeas(data.ideas);
        setActiveGenerationMode(data.mode);
        setShowOnlyFavorites(false);

        // Record into history
        const newHistoryItem: PromptHistoryItem = {
          id: `hist-${Date.now()}`,
          keyword: keyword.trim(),
          style: selectedStyle,
          productType: selectedProduct,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ideas: data.ideas
        };
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]); // limit to 20 history items
        
        triggerToast(data.mode === "ai" 
          ? "Successfully generated 10 AI Merch Ideas!" 
          : "Offline generator populated 10 high-quality styles."
        );
      } else {
        throw new Error(data.error || "Failed generating prompt concepts.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- Favorite Toggle ---
  const toggleFavorite = (idea: GeneratedPromptIdea) => {
    const isFav = favorites.some(f => f.id === idea.id);
    if (isFav) {
      setFavorites(prev => prev.filter(f => f.id !== idea.id));
      triggerToast("Removed from saved prompt favorites.");
    } else {
      setFavorites(prev => [...prev, idea]);
      triggerToast("Added to saved prompt favorites!");
    }
  };

  // --- Copy Clipboard ---
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast("Prompt copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Download TXT ---
  const downloadPromptTxt = (idea: GeneratedPromptIdea) => {
    const content = `==================================================
AI MERCH SELLER HUB - PROFESSIONAL DESIGN PROMPT CARD
==================================================
PRODUCT CATEGORY : ${idea.productType.toUpperCase()}
DESIGN CONCEPT   : ${idea.title}
STYLE THEME      : ${idea.font} / Retail Premium

DESCRIPTION:
${idea.description}

RECOMMENDED FABRIC/COLOR SCHEME:
${idea.colors.join(" | ")}

RECOMMENDED BRAND TYPOGRAPHY:
${idea.font}

SEO SEARCH KEYWORDS & TAGS:
${idea.seoKeywords.join(", ")}

==================================================
AI TEXT-TO-IMAGE ENGINE OPTIMIZED PROMPT:
==================================================
${idea.prompt}

==================================================
Generated via AI Merch Seller Hub & Mockup.ai Terminal
==================================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Prompt_Concept_${idea.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("TX-formatted Prompt Card downloaded!");
  };

  // --- Print/PDF Generation ---
  const printPromptPdf = (idea: GeneratedPromptIdea) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      triggerToast("Popup blocked! Enable popups to print/save prompt as PDF.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${idea.title} - AI Merch Seller Hub</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold; margin-top: 5px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; margin-bottom: 25px; }
            .label { font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; color: #3b82f6; margin-bottom: 6px; }
            .value { font-size: 15px; margin-bottom: 20px; font-weight: 500; }
            .prompt-box { background: #0f172a; color: #f8fafc; padding: 25px; border-radius: 8px; font-size: 14px; border-left: 5px solid #3b82f6; font-family: monospace; white-space: pre-wrap; word-break: break-word; }
            .colors { display: flex; gap: 10px; margin-top: 5px; }
            .color-dot { width: 35px; height: 35px; border-radius: 50%; border: 1px solid #cbd5e1; }
            .tag { display: inline-block; background: #e2e8f0; color: #334155; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-bottom: 6px; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${idea.title}</h1>
            <div class="subtitle">AI Merch Seller Prompt Card | ${idea.productType.toUpperCase()}</div>
          </div>
          
          <div class="card">
            <div class="label">Product Concept Description</div>
            <div class="value">${idea.description}</div>
            
            <div class="label">Target Typography</div>
            <div class="value" style="font-family: monospace; font-weight: bold;">${idea.font}</div>
            
            <div class="label">Color Recommendations</div>
            <div class="colors">
              ${idea.colors.map(col => `<div class="color-dot" style="background-color: ${col};" title="${col}"></div>`).join("")}
            </div>
            <div class="value" style="margin-top: 8px; font-size: 12px; color: #64748b;">${idea.colors.join(" &bull; ")}</div>

            <div class="label" style="margin-top: 20px;">SEO Search Tags</div>
            <div style="margin-top: 5px;">
              ${idea.seoKeywords.map(kw => `<span class="tag">#${kw}</span>`).join("")}
            </div>
          </div>

          <div class="label">Optimized Image Generator Prompt</div>
          <div class="prompt-box">${idea.prompt}</div>

          <div class="footer">
            Generated via Mockup.ai Print-On-Demand Terminal. Save or print this sheet to PDF.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- Auto-apply to studio as logo ---
  const applyAsStudioLogo = async (idea: GeneratedPromptIdea) => {
    triggerToast("Applying artwork prompt to AI Logo Generator...");
    
    // Switch to Logo Tab, then load the prompt!
    onLogoSelected({
      src: "", // Will trigger a loading generator in logo panel
      processedSrc: "",
      name: idea.title,
      width: 512,
      height: 512,
      isAiDraft: true,
      draftPrompt: idea.prompt,
      draftStyle: selectedStyle === "luxury" ? "modern" : selectedStyle
    });

    onSwitchToStudio();

    // Dispatch a window event to trigger logo generation in the LogoGenerator component!
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("merch-apply-logo-draft", {
          detail: {
            prompt: idea.prompt,
            style: selectedStyle === "luxury" ? "modern" : selectedStyle,
            title: idea.title
          }
        })
      );
    }, 400);
  };

  // --- Ready-Made Template Click ---
  const applyTemplate = (tpl: PromptTemplate) => {
    setKeyword(tpl.title);
    setSelectedStyle(tpl.style);
    setSelectedProduct(tpl.category);
    triggerToast(`Template "${tpl.title}" selected! Click Generate to create ideas.`);
  };

  // --- Templates Search and Filter system ---
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch = tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tpl.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedTemplateCategory === "All" || 
                              tpl.category.toLowerCase() === selectedTemplateCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedTemplateCategory]);

  // --- Admin actions ---
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.prompt) {
      triggerToast("Please enter a title and prompt content for the new template.");
      return;
    }

    const customTpl: PromptTemplate = {
      id: `tpl-custom-${Date.now()}`,
      title: newTemplate.title,
      category: newTemplate.category,
      style: newTemplate.style,
      description: newTemplate.description || "Custom added merchant prompt template.",
      prompt: newTemplate.prompt,
      isTrending: false
    };

    setTemplates(prev => [customTpl, ...prev]);
    setNewTemplate({
      title: "",
      category: "t-shirt",
      style: "minimal",
      description: "",
      prompt: ""
    });
    triggerToast("Custom prompt template deployed to catalog!");
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    triggerToast("Template deleted from custom database.");
  };

  // --- Trending prompts slider / showcase ---
  const trendingTemplates = useMemo(() => {
    return templates.filter(t => t.isTrending);
  }, [templates]);

  // --- Filter active ideas view (History/Favorites vs Generated) ---
  const activeIdeasToDisplay = useMemo(() => {
    if (showOnlyFavorites) {
      return favorites;
    }
    return generatedIdeas;
  }, [showOnlyFavorites, favorites, generatedIdeas]);

  return (
    <div className={`w-full min-h-screen ${theme === "dark" ? "bg-[#09090b] text-white" : "bg-zinc-50 text-zinc-900"} transition-all duration-300 font-sans pb-16`}>
      {/* Toast Notification HUD */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl flex items-center space-x-2 border border-blue-400/20 text-xs uppercase tracking-wider animate-[slideIn_0.2s_ease-out]">
          <Sparkles className="h-4 w-4 text-blue-200 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Hero Welcome & Statistics Dashboard */}
      <section className={`relative px-6 py-8 md:py-12 border-b ${theme === "dark" ? "bg-zinc-950/40 border-white/5" : "bg-white border-zinc-200"} transition-all`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-blue-500/10 text-blue-500 font-bold tracking-widest uppercase py-1 px-3 rounded-full border border-blue-500/10">
                A.I. Merch Command
              </span>
              {user && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold tracking-widest uppercase py-1 px-3 rounded-full border border-emerald-500/10">
                  Shopify Linked
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black tracking-tight leading-tight uppercase font-sans">
              Seller Hub & <span className="text-blue-500">Prompt Generator</span>
            </h1>
            <p className={`text-xs md:text-sm font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} max-w-2xl leading-relaxed`}>
              Formulate production-ready, highly specific prompts for your custom merchandise products. Instantly generate design ideas with keywords, style matrices, retail-ready descriptions, recommended typography, and optimal SEO hashtags.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:w-[480px]">
            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/60 border-white/5" : "bg-zinc-100 border-zinc-200"} text-left`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">My Store</p>
              <p className="text-sm font-extrabold truncate uppercase mt-1">
                {user ? user.brandName : "Guest Merchant"}
              </p>
              <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">
                {user ? user.shopifyDomain : "No Store Connected"}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/60 border-white/5" : "bg-zinc-100 border-zinc-200"} text-left`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Generations</p>
              <p className="text-lg font-black text-blue-500 mt-1">
                {history.length * 10} <span className="text-[10px] font-medium text-zinc-500 uppercase">Ideas</span>
              </p>
              <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">
                {history.length} keyword requests
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-zinc-900/60 border-white/5" : "bg-zinc-100 border-zinc-200"} text-left col-span-2 sm:col-span-1`}>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Favorites</p>
              <p className="text-lg font-black text-amber-500 mt-1">
                {favorites.length} <span className="text-[10px] font-medium text-zinc-500 uppercase">Prompts</span>
              </p>
              <button 
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className="text-[9px] text-blue-500 hover:underline font-bold mt-0.5 block focus:outline-none text-left"
              >
                {showOnlyFavorites ? "Show Generated" : "Filter Favorites"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Control Panel Left, Results Right */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 units on desktop): Inputs, Templates & Settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Interactive AI Prompter Form */}
          <div className={`border p-6 rounded-3xl shadow-xl space-y-5 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-500/10 rounded-xl text-blue-500">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider">AI Prompter Panel</h2>
              </div>

              {/* Theme Toggle in Form Panel */}
              <button
                onClick={onThemeToggle}
                className={`p-1.5 rounded-lg border ${theme === "dark" ? "bg-zinc-900 border-white/5 text-yellow-400 hover:text-yellow-300" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"} transition-all cursor-pointer`}
                title="Toggle Dark/Light Mode"
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            </div>

            <form onSubmit={handleGeneratePrompts} className="space-y-4">
              {/* Keyword input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Design Topic / Keyword
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. Vintage Astronaut, Cute Boba Cat, Floral Sunflower..."
                    className={`w-full py-2.5 pl-3 pr-10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 border ${theme === "dark" ? "bg-zinc-900/60 border-white/5 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}
                  />
                  {keyword && (
                    <button
                      type="button"
                      onClick={() => setKeyword("")}
                      className={`absolute right-3 top-2.5 text-zinc-500 ${theme === "dark" ? "hover:text-white" : "hover:text-zinc-900"}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Interactive Niche Sparks */}
                <div className="space-y-1.5 mt-2.5 pt-2 border-t border-dashed border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1">
                      <Lightbulb className="h-3 w-3 text-yellow-500 animate-pulse" />
                      <span>Creative Niche Sparks</span>
                    </span>
                    <button
                      type="button"
                      onClick={rollNewSparks}
                      className="text-[9px] text-blue-500 hover:text-blue-400 font-extrabold focus:outline-none flex items-center space-x-0.5 cursor-pointer uppercase tracking-wider"
                    >
                      <RefreshCw className="h-2 w-2 mr-0.5" />
                      <span>Roll Sparks</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeSparks.map((spark, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          setKeyword(spark.keyword);
                          setSelectedStyle(spark.style);
                          setSelectedProduct(spark.category);
                          triggerToast(`Loaded Niche: "${spark.keyword}"!`);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold text-left flex items-center space-x-1.5 border transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-zinc-900/40 border-white/5 text-zinc-300 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-950/10"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        <span className="text-[11px] shrink-0">{spark.emoji}</span>
                        <span className="truncate leading-none">{spark.keyword}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Target Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Target Merchandise Type
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold focus:outline-none border ${theme === "dark" ? "bg-zinc-900 border-white/5 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}
                >
                  <option value="All">All Merchandise (Diverse Pack)</option>
                  <option value="T-shirt">T-shirt</option>
                  <option value="Hoodie">Hoodie</option>
                  <option value="Mug">Ceramic Coffee Mug</option>
                  <option value="Sticker">Die-Cut Decal Sticker</option>
                  <option value="Poster">Fine Art Poster / Canvas</option>
                  <option value="Phone Case">iPhone / Samsung Phone Case</option>
                </select>
              </div>

              {/* Style Grid Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Select Visual Style Aesthetic
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "minimal", label: "Minimalist", emoji: "🌱" },
                    { id: "vintage", label: "Distressed Vintage", emoji: "📻" },
                    { id: "cartoon", label: "Playful Cartoon", emoji: "🎈" },
                    { id: "anime", label: "Anime Graphic", emoji: "🌸" },
                    { id: "funny", label: "Humorous / Funny", emoji: "🤪" },
                    { id: "typography", label: "Bold Typography", emoji: "🔤" },
                    { id: "luxury", label: "Luxury Symmetrical", emoji: "⚜️" }
                  ].map((styleItem) => (
                    <button
                      key={styleItem.id}
                      type="button"
                      onClick={() => setSelectedStyle(styleItem.id)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold text-left flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        selectedStyle === styleItem.id
                          ? "bg-blue-600/15 border-blue-500 text-blue-400"
                          : theme === "dark" 
                          ? "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-zinc-700" 
                          : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      <span>{styleItem.emoji}</span>
                      <span className="truncate">{styleItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/10 cursor-pointer focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-200" />
                    <span>Generating Ideas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-blue-200 animate-pulse" />
                    <span>Generate 10 Merch Concepts</span>
                  </>
                )}
              </button>

              {loading && (
                <div className="text-center">
                  <span className="text-[10px] text-zinc-500 font-mono leading-none animate-pulse">
                    {loadingStatus}
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold p-3 rounded-xl">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Prompt History List */}
          {history.length > 0 && (
            <div className={`border p-6 rounded-3xl shadow-xl space-y-4 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
              <div className="flex items-center space-x-2">
                <History className="h-4.5 w-4.5 text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Search History</h3>
              </div>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                {history.map((hist) => (
                  <button
                    key={hist.id}
                    onClick={() => {
                      setGeneratedIdeas(hist.ideas);
                      setKeyword(hist.keyword);
                      setSelectedStyle(hist.style);
                      setSelectedProduct(hist.productType);
                      setShowOnlyFavorites(false);
                      triggerToast(`Loaded concepts for "${hist.keyword}"`);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all cursor-pointer ${theme === "dark" ? "bg-zinc-900/40 border-white/5 hover:border-zinc-700 text-zinc-300" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700"}`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-extrabold capitalize text-blue-400 mr-1.5">[{hist.style}]</span>
                      <span>{hist.keyword}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono shrink-0">{hist.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Admin Panel Toggle & Panel */}
          <div className={`border p-6 rounded-3xl shadow-xl space-y-4 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Admin Management</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className={`py-1 px-3.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                  isAdminMode
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 animate-pulse"
                    : theme === "dark" ? "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-white/5" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
                }`}
              >
                {isAdminMode ? "Exit Admin" : "Enter Admin"}
              </button>
            </div>

            {isAdminMode ? (
              <div className="space-y-4 pt-2 border-t border-dashed border-white/10">
                <p className="text-[9px] text-zinc-500 leading-normal font-sans">
                  Deploy custom merch prompt templates directly to the database or view active customer logs securely.
                </p>

                {/* Simulated Registered Users Log */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Active Merchant Registry ({adminUsers.length})</span>
                  <div className="max-h-[110px] overflow-y-auto border border-white/5 rounded-lg bg-zinc-900/60 font-mono text-[9px] text-zinc-400 divide-y divide-white/5 scrollbar-thin">
                    {adminUsers.map((u, i) => (
                      <div key={i} className="p-2 flex flex-col">
                        <div className="flex justify-between font-bold text-white">
                          <span>{u.brandName}</span>
                          <span className="text-blue-400">[{u.role}]</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 mt-0.5">
                          <span>{u.email}</span>
                          <span>{u.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form to deploy template */}
                <form onSubmit={handleAddTemplate} className="space-y-2.5 pt-2 border-t border-white/5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Deploy Prompt Template</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Template Title"
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                      className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-zinc-900 border border-white/5 text-white"
                    />
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                      className="w-full py-1.5 px-2 bg-zinc-900 border border-white/5 text-white text-[10px] font-bold"
                    >
                      <option value="t-shirt">T-shirt</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="mug">Mug</option>
                      <option value="sticker">Sticker</option>
                      <option value="poster">Poster</option>
                      <option value="phone case">Phone Case</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Short description..."
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-semibold bg-zinc-900 border border-white/5 text-white"
                  />

                  <textarea
                    placeholder="Write detailed Midjourney or DALL-E prompt here..."
                    rows={2}
                    value={newTemplate.prompt}
                    onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                    className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-mono bg-zinc-900 border border-white/5 text-white resize-none"
                  />

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Add to Catalog Database
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-blue-500/5 border border-blue-500/10 p-2.5 rounded-xl">
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="text-[9px] text-zinc-500 leading-relaxed leading-normal">
                  Toggle Admin mode to inject bespoke ready-made templates into the search catalog and supervise merchant user access logs.
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (8 units on desktop): Generative output grid & ready-made searchable catalog */}
        <div className="lg:col-span-8 space-y-6">

          {/* Trending Designs Gallery Showcase */}
          <div className={`border p-6 rounded-3xl shadow-xl space-y-4 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4.5 w-4.5 text-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider">🔥 Trending Design Showcases</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trendingTemplates.slice(0, 3).map((tpl) => (
                <div 
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-40 cursor-pointer hover:scale-[1.02] active:scale-[0.99] hover:border-blue-500/40 transition-all ${theme === "dark" ? "bg-zinc-900/40 border-white/5" : "bg-zinc-100 border-zinc-200"}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 py-0.5 px-1.5 rounded uppercase tracking-wider">
                        {tpl.category}
                      </span>
                      <span className="text-amber-400 text-xs">★</span>
                    </div>
                    <h4 className={`text-[11px] font-bold line-clamp-1 uppercase ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>{tpl.title}</h4>
                    <p className={`text-[9px] leading-normal line-clamp-3 ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>
                      {tpl.description}
                    </p>
                  </div>
                  <span className="text-[9px] text-blue-500 hover:underline font-bold block mt-2 text-right uppercase">
                    Use Template &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ready-Made Prompt Catalog Search & Filter system */}
          <div className={`border p-6 rounded-3xl shadow-xl space-y-5 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4.5 w-4.5 text-yellow-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Bespoke Prompt Catalog</h2>
              </div>

              {/* Search Bar */}
              <div className="relative md:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search template database..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-1.5 pl-9 pr-3 rounded-xl text-[10px] font-semibold focus:outline-none border ${theme === "dark" ? "bg-zinc-900 border-white/5 text-white" : "bg-zinc-100 border-zinc-200 text-zinc-900"}`}
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
              {["All", "T-shirt", "Hoodie", "Mug", "Sticker", "Poster", "Phone Case"].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedTemplateCategory(category)}
                  className={`py-1 px-3 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedTemplateCategory === category
                      ? "bg-blue-600 text-white"
                      : theme === "dark"
                      ? "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search Grid Results */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className={`p-4 rounded-2xl border text-left relative flex flex-col justify-between ${theme === "dark" ? "bg-zinc-900/20 border-white/5 hover:border-zinc-800" : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100"} transition-all`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[8px] font-black bg-zinc-800 text-zinc-400 py-0.5 px-2 rounded uppercase tracking-wider">
                            {tpl.category}
                          </span>
                          <span className="text-[8px] font-bold text-zinc-500 capitalize">
                            {tpl.style}
                          </span>
                        </div>
                        {isAdminMode && (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 hover:text-red-400 text-zinc-500 focus:outline-none"
                            title="Delete custom template"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      <h4 className={`text-[11px] font-black leading-tight uppercase ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>{tpl.title}</h4>
                      <p className={`text-[9px] leading-normal ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5">
                      <button
                        onClick={() => applyTemplate(tpl)}
                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider cursor-pointer"
                      >
                        Auto-fill Generator
                      </button>
                      <button
                        onClick={() => copyToClipboard(tpl.prompt, tpl.id)}
                        className="py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 text-[8px] font-bold text-zinc-400 hover:text-white transition-all flex items-center space-x-1 border border-white/5 focus:outline-none cursor-pointer"
                      >
                        {copiedId === tpl.id ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                        <span>{copiedId === tpl.id ? "Copied" : "Copy Prompt"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-zinc-500 text-[10px] font-mono">
                  No matching ready-made prompt templates found in current filters.
                </p>
              </div>
            )}
          </div>

          {/* AI Prompter Generated Output List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  {showOnlyFavorites ? "Saved Starred Prompt Favorites" : "Generated AI Design Concepts"} 
                  {activeIdeasToDisplay.length > 0 && ` (${activeIdeasToDisplay.length})`}
                </h2>
              </div>
              
              {activeGenerationMode && !showOnlyFavorites && (
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  activeGenerationMode === "ai"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {activeGenerationMode === "ai" ? "Gemini Live AI" : "Procedural Backup"}
                </span>
              )}
            </div>

            {activeIdeasToDisplay.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {activeIdeasToDisplay.map((idea, idx) => {
                  const isFavorited = favorites.some(f => f.id === idea.id);
                  return (
                    <div
                      key={idea.id || idx}
                      className={`border p-6 rounded-3xl shadow-xl transition-all hover:scale-[1.005] duration-200 relative flex flex-col md:flex-row gap-6 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}
                    >
                      {/* Left: Metadata and descriptions */}
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                              {idea.productType}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 font-mono">
                              Font: {idea.font}
                            </span>
                          </div>

                          {/* Favorites and Actions */}
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => toggleFavorite(idea)}
                              className={`p-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                                isFavorited
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                  : theme === "dark" ? "bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
                              }`}
                              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${isFavorited ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={() => downloadPromptTxt(idea)}
                              className={`p-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${theme === "dark" ? "bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                              title="Download Prompt metadata as TXT"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => printPromptPdf(idea)}
                              className={`p-1.5 rounded-lg border focus:outline-none transition-all cursor-pointer ${theme === "dark" ? "bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"}`}
                              title="Print / Save Prompt card to PDF"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className={`text-sm md:text-base font-black tracking-tight uppercase leading-snug ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                          {idea.title}
                        </h3>

                        <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                          {idea.description}
                        </p>

                        {/* Color swatches */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Recommended Material Fabric Colors</span>
                          <div className="flex items-center space-x-1.5">
                            {idea.colors.map((col, cIdx) => (
                              <div key={cIdx} className="flex items-center space-x-1 border border-white/5 bg-zinc-900/30 rounded-full px-2 py-1">
                                <span className="w-2.5 h-2.5 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: col }} />
                                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">{col}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SEO keywords */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {idea.seoKeywords.map((kw, kwIdx) => (
                            <span key={kwIdx} className={`text-[9px] font-medium py-0.5 px-2 rounded-full border ${theme === "dark" ? "bg-zinc-900/30 border-white/5 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}>
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Optimized Prompt Card with Actions */}
                      <div className={`md:w-[260px] p-4 rounded-2xl border flex flex-col justify-between space-y-4 shrink-0 ${theme === "dark" ? "bg-zinc-900/20 border-white/5" : "bg-zinc-50 border-zinc-200"}`}>
                        <div className="space-y-1.5">
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">AI Image Generator Prompt</span>
                          <p className="text-[10px] font-mono text-zinc-400 leading-normal line-clamp-5 select-all select-all-touch">
                            {idea.prompt}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => copyToClipboard(idea.prompt, idea.id)}
                            className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-white/5 hover:border-zinc-700 text-[10px] font-bold rounded-lg text-white transition-all flex items-center justify-center space-x-1.5 focus:outline-none cursor-pointer"
                          >
                            {copiedId === idea.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedId === idea.id ? "Prompt Copied" : "Copy Art Prompt"}</span>
                          </button>
                          
                          <button
                            onClick={() => applyAsStudioLogo(idea)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1 shadow-md shadow-blue-600/10 focus:outline-none cursor-pointer"
                          >
                            <span>Apply as Active Logo</span>
                            <ExternalLink className="h-2.5 w-2.5 text-blue-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`border p-12 rounded-3xl text-center space-y-4 ${theme === "dark" ? "bg-zinc-950/60 border-white/5" : "bg-white border-zinc-200"}`}>
                <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto text-zinc-500 ${theme === "dark" ? "bg-zinc-900 border-white/5" : "bg-zinc-100 border-zinc-200"}`}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                    {showOnlyFavorites ? "No Favorites Starred Yet" : "No Merch Prompts Generated"}
                  </h4>
                  <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal font-sans">
                    {showOnlyFavorites 
                      ? "Browse generated prompt concepts and click the bookmark star to save your favorite ideas in your personal hub."
                      : "Type in a keyword topic on the left, pick an aesthetic style, and trigger Google Gemini to formulate 10 unique product merch design ideas instantly."}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </section>
    </div>
  );
}
