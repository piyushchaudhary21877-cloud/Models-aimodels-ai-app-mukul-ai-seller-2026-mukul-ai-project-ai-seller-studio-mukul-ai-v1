/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Grid, Sparkles, AlertCircle, Palette } from "lucide-react";
import { ProductPreset, PRODUCTS } from "../data/templates";
import { MockupScene, LogoData } from "../types";

const extractDominantColor = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("#3b82f6");
          return;
        }

        const size = 30;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts: { [key: string]: number } = {};
        
        let totalR = 0, totalG = 0, totalB = 0, validPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a > 50) {
            const rGroup = Math.round(r / 12) * 12;
            const gGroup = Math.round(g / 12) * 12;
            const bGroup = Math.round(b / 12) * 12;
            
            const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
            const isTooDark = r < 20 && g < 20 && b < 20;
            const isTooLight = r > 235 && g > 235 && b > 235;

            let weight = 1;
            if (!isGray && !isTooDark && !isTooLight) {
              weight = 3;
            }

            const key = `${rGroup},${gGroup},${bGroup}`;
            colorCounts[key] = (colorCounts[key] || 0) + weight;

            totalR += r;
            totalG += g;
            totalB += b;
            validPixels++;
          }
        }

        if (validPixels === 0) {
          resolve("#3b82f6");
          return;
        }

        let maxCount = 0;
        let dominantKey = "";
        for (const key in colorCounts) {
          if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            dominantKey = key;
          }
        }

        if (dominantKey) {
          const [r, g, b] = dominantKey.split(",").map(Number);
          const hex = "#" + [r, g, b].map(x => {
            const h = Math.max(0, Math.min(255, x)).toString(16);
            return h.length === 1 ? "0" + h : h;
          }).join("");
          resolve(hex);
        } else {
          const rAvg = Math.round(totalR / validPixels);
          const gAvg = Math.round(totalG / validPixels);
          const bAvg = Math.round(totalB / validPixels);
          const hex = "#" + [rAvg, gAvg, bAvg].map(x => {
            const h = Math.max(0, Math.min(255, x)).toString(16);
            return h.length === 1 ? "0" + h : h;
          }).join("");
          resolve(hex);
        }
      } catch (err) {
        console.error("Error extracting color:", err);
        resolve("#3b82f6");
      }
    };
    img.onerror = () => {
      resolve("#3b82f6");
    };
  });
};

interface ProductSelectorProps {
  selectedProduct: ProductPreset;
  onProductChange: (product: ProductPreset) => void;
  productColor: string;
  onColorChange: (color: string) => void;
  customScene: MockupScene | null;
  onCustomSceneChange: (scene: MockupScene | null) => void;
  activeLogo?: LogoData | null;
}

export default function ProductSelector({
  selectedProduct,
  onProductChange,
  productColor,
  onColorChange,
  customScene,
  onCustomSceneChange,
  activeLogo,
}: ProductSelectorProps) {
  const [scenePrompt, setScenePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem("merch-auto-sync-color") === "true";
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // AI Suggested Color Palette States
  interface PaletteColor {
    name: string;
    hex: string;
    rationale: string;
  }
  const [paletteSuggestions, setPaletteSuggestions] = useState<PaletteColor[] | null>(null);
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [paletteError, setPaletteError] = useState<string | null>(null);

  // Clear palette suggestions when active logo changes
  useEffect(() => {
    setPaletteSuggestions(null);
    setPaletteError(null);
  }, [activeLogo?.src]);

  useEffect(() => {
    if (autoSync && activeLogo) {
      extractDominantColor(activeLogo.src).then((hex) => {
        if (hex !== productColor) {
          onColorChange(hex);
          const event = new CustomEvent("merch-mockup-notification", {
            detail: { text: `Automatically synced product color with logo (${hex.toUpperCase()})`, type: "info" },
          });
          window.dispatchEvent(event);
        }
      });
    }
  }, [activeLogo, autoSync]);

  const handleManualSync = async () => {
    if (!activeLogo) return;
    setIsSyncing(true);
    try {
      const hex = await extractDominantColor(activeLogo.src);
      onColorChange(hex);
      const event = new CustomEvent("merch-mockup-notification", {
        detail: { text: `Product color synced to logo dominant color (${hex.toUpperCase()})`, type: "info" },
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error("Manual color sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGeneratePalette = async () => {
    if (!activeLogo) return;
    setIsGeneratingPalette(true);
    setPaletteError(null);

    try {
      const primaryHex = await extractDominantColor(activeLogo.src);
      const response = await fetch("/api/generate-palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: selectedProduct.name,
          logoName: activeLogo.name,
          primaryColorHex: primaryHex,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate color suggestions");
      }

      setPaletteSuggestions(data.palette);
      const event = new CustomEvent("merch-mockup-notification", {
        detail: { text: "AI color palette suggestions successfully generated!", type: "success" },
      });
      window.dispatchEvent(event);
    } catch (err: any) {
      console.error(err);
      setPaletteError(
        err.message?.includes("GEMINI_API_KEY")
          ? "GEMINI_API_KEY is missing. Please configure it in Settings -> Secrets."
          : err.message || "An error occurred during palette generation."
      );
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const handleGenerateScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenePrompt.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scenePrompt,
          productType: selectedProduct.name,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate custom lifestyle scene");
      }

      onCustomSceneChange({
        id: `ai-scene-${Date.now()}`,
        name: `AI Scene: ${scenePrompt.substring(0, 20)}...`,
        imageUrl: data.imageUrl,
        isAiGenerated: true,
        productType: selectedProduct.id,
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err.message?.includes("GEMINI_API_KEY")
          ? "The Gemini API Key is missing. To generate custom AI lifestyle backgrounds, please configure your GEMINI_API_KEY in the Secrets panel in Settings."
          : err.message || "An error occurred during scene generation."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6" id="product-selector-panel">
      {/* Product Template Selector */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          <Grid className="h-4 w-4 text-zinc-500" />
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Select Product</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PRODUCTS.map((product) => {
            const isSelected = selectedProduct.id === product.id && !customScene;
            return (
              <button
                key={product.id}
                onClick={() => {
                  onProductChange(product);
                  onCustomSceneChange(null);
                }}
                className={`flex flex-col items-center p-3 bg-zinc-900/40 border rounded-xl hover:bg-zinc-900/80 transition-all text-center focus:outline-none ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-zinc-900"
                    : "border-white/5"
                }`}
                id={`product-btn-${product.id}`}
              >
                <div 
                  className="w-14 h-14 flex items-center justify-center bg-zinc-950 rounded-lg border border-white/5 mb-2 p-1"
                  dangerouslySetInnerHTML={{ __html: product.getSvg(product.defaultColor) }}
                />
                <span className="text-xs font-semibold text-zinc-300 truncate w-full">
                  {product.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors Presets */}
      {!customScene && (
        <div className="space-y-3 border-t border-white/5 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Palette className="h-4 w-4 text-zinc-500" />
              <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Product Color</h4>
            </div>
            <span className="text-[10px] font-mono font-medium text-zinc-500">
              {productColor.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {selectedProduct.colors.map((color) => {
              const isSelected = productColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  onClick={() => onColorChange(color)}
                  className={`w-8 h-8 rounded-full border shadow-inner transition-all hover:scale-110 focus:outline-none ${
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2 scale-105 border-transparent" : "border-white/10"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  id={`color-preset-${color.replace("#", "")}`}
                />
              );
            })}
            
            {/* Custom Color Input */}
            <div className="relative flex items-center">
              <input
                type="color"
                value={productColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-8 h-8 rounded-full border border-white/10 p-0.5 cursor-pointer bg-zinc-950 overflow-hidden shadow-inner hover:scale-110 transition-all"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Logo Color Sync Option */}
          <div className="bg-zinc-950/50 rounded-xl p-3 border border-white/5 space-y-2.5 mt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Auto-Sync Base Color</span>
                <p className="text-[9px] text-zinc-500 leading-tight">Match product fabric with logo dominant color</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !autoSync;
                  setAutoSync(nextVal);
                  localStorage.setItem("merch-auto-sync-color", String(nextVal));
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                  autoSync ? "bg-blue-600" : "bg-zinc-800"
                }`}
                id="auto-sync-color-toggle"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                    autoSync ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {activeLogo ? (
              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded border border-white/10 shrink-0 overflow-hidden bg-zinc-950 p-0.5 flex items-center justify-center">
                    <img src={activeLogo.src} alt="Logo mini" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
                    {activeLogo.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="py-1 px-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-500/20 transition-all focus:outline-none cursor-pointer flex items-center gap-1 shrink-0"
                  id="manual-color-sync-btn"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                </button>
              </div>
            ) : (
              <p className="text-[9px] text-zinc-600 italic border-t border-white/5 pt-2">
                Upload a custom logo to enable real-time dominant color syncing.
              </p>
            )}
          </div>

          {/* AI Suggested Color Palette Section */}
          {activeLogo && (
            <div className="bg-zinc-950/50 rounded-xl p-3 border border-white/5 space-y-3 mt-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AI Suggested Palette</span>
                </div>
                {paletteSuggestions && (
                  <button
                    type="button"
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette}
                    className="text-[9px] font-bold text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer focus:outline-none"
                  >
                    {isGeneratingPalette ? "Regenerating..." : "Regenerate"}
                  </button>
                )}
              </div>

              {!paletteSuggestions ? (
                <div className="space-y-2">
                  <p className="text-[9px] text-zinc-500 leading-tight">
                    Analyze your logo's colors to discover complementary, harmonious, and brand-aligned fabric hues using AI.
                  </p>
                  <button
                    type="button"
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette}
                    className="w-full py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
                    id="generate-ai-palette-btn"
                  >
                    {isGeneratingPalette ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent" />
                        <span>Analyzing & Designing...</span>
                      </>
                    ) : (
                      <>
                        <Palette className="h-3.5 w-3.5 text-amber-400" />
                        <span>Suggest Color Palette</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Swatches layout */}
                  <div className="flex justify-between items-center gap-1 bg-zinc-950 p-2 rounded-lg border border-white/5">
                    {paletteSuggestions.map((suggestion, index) => {
                      const isSelected = productColor.toLowerCase() === suggestion.hex.toLowerCase();
                      return (
                        <button
                          key={`${suggestion.hex}-${index}`}
                          type="button"
                          onClick={() => {
                            onColorChange(suggestion.hex);
                            const event = new CustomEvent("merch-mockup-notification", {
                              detail: { text: `Set fabric to AI suggested: ${suggestion.name}`, type: "info" },
                            });
                            window.dispatchEvent(event);
                          }}
                          className={`flex-1 h-9 rounded-md border shadow-inner transition-all hover:scale-105 flex items-center justify-center group relative cursor-pointer focus:outline-none ${
                            isSelected ? "ring-1 ring-blue-500 ring-offset-1 border-transparent scale-102" : "border-white/10"
                          }`}
                          style={{ backgroundColor: suggestion.hex }}
                          id={`ai-palette-swatch-${index}`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white mix-blend-difference" />
                          )}
                          
                          {/* Rich hover tooltip inside */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-950 border border-white/10 p-2 rounded-lg shadow-xl w-48 text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            <p className="text-[10px] font-bold text-white font-mono">{suggestion.name}</p>
                            <p className="text-[9px] text-zinc-400 leading-tight mt-1">{suggestion.rationale}</p>
                            <div className="text-[8px] text-blue-400 font-bold uppercase mt-1 font-mono">{suggestion.hex.toUpperCase()}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* List layout with rationale */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 custom-scrollbar">
                    {paletteSuggestions.map((suggestion, index) => {
                      const isSelected = productColor.toLowerCase() === suggestion.hex.toLowerCase();
                      return (
                        <button
                          key={`list-${suggestion.hex}-${index}`}
                          type="button"
                          onClick={() => {
                            onColorChange(suggestion.hex);
                            const event = new CustomEvent("merch-mockup-notification", {
                              detail: { text: `Set fabric to AI suggested: ${suggestion.name}`, type: "info" },
                            });
                            window.dispatchEvent(event);
                          }}
                          className={`w-full text-left p-1.5 rounded-lg border text-[10px] flex items-center gap-2 transition-all cursor-pointer focus:outline-none ${
                            isSelected
                              ? "bg-blue-950/20 border-blue-500/30 text-white"
                              : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-300"
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-md border border-white/10 shrink-0"
                            style={{ backgroundColor: suggestion.hex }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-300 truncate">{suggestion.name}</span>
                              <span className="text-[8px] font-mono text-zinc-500">{suggestion.hex.toUpperCase()}</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-tight truncate">{suggestion.rationale}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {paletteError && (
                <div className="flex items-start space-x-1.5 bg-red-950/40 border border-red-500/20 text-red-400 p-2 rounded-lg text-[9px] leading-tight">
                  <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                  <p>{paletteError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Lifestyle Scene Generator */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-xl p-4 space-y-4 border-t pt-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-xs font-bold text-white tracking-wide uppercase">Custom AI Scene Mockup</h3>
        </div>

        {customScene ? (
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Active AI Scene
              </span>
              <p className="text-xs text-emerald-400 font-medium truncate max-w-[200px]">
                {customScene.name}
              </p>
            </div>
            <button
              onClick={() => onCustomSceneChange(null)}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 hover:underline focus:outline-none"
            >
              Reset to Flat Mockup
            </button>
          </div>
        ) : (
          <form onSubmit={handleGenerateScene} className="space-y-4">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Generate a custom lifestyle background scene for your {selectedProduct.name} (e.g., "A flatlay setup with autumn leaves and coffee", "A model wearing a plain t-shirt sitting in a cafe").
            </p>
            <div className="space-y-1.5">
              <textarea
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder="Describe the lifestyle background scene..."
                rows={2}
                className="w-full text-xs border border-white/10 rounded-xl p-3 bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500 transition-all leading-relaxed"
                disabled={generating}
                id="ai-scene-prompt"
              />

              {/* Quick Background Scene Prompt Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-[9px] text-zinc-500 self-center font-medium mr-1 uppercase tracking-wider">Ideas:</span>
                {[
                  { label: "☕ Cafe Portrait", text: `A stylish young model wearing a plain ${selectedProduct.name} sitting in a cozy, minimalist coffee shop drinking espresso, urban chic style` },
                  { label: "🍂 Autumn Flatlay", text: `Professional studio flatlay background with autumn leaves, wooden texture, pine cones and coffee mug around a plain ${selectedProduct.name}` },
                  { label: "🏢 Studio Desk", text: `Minimalist designer studio desk with houseplants, notebook, drafting pen, and a flat ${selectedProduct.name} mock up` },
                  { label: "🏞️ Rugged Mountain", text: `Flatlay setup of travel gear and a plain ${selectedProduct.name} on a granite rock surface with scenic pine forest bokeh background` }
                ].map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    disabled={generating}
                    onClick={() => setScenePrompt(tag.text)}
                    className="px-2 py-1 rounded-full text-[9px] bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-850 cursor-pointer transition-all select-none focus:outline-none"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !scenePrompt.trim()}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all cursor-pointer ${
                generating || !scenePrompt.trim() ? "opacity-50 cursor-not-allowed" : "shadow-md shadow-blue-900/20 hover:scale-[1.01]"
              }`}
              id="generate-scene-btn"
            >
              {generating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Generating lifestyle mockup...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                  <span>Generate Lifestyle Scene</span>
                </>
              )}
            </button>
          </form>
        )}

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-lg text-[11px] leading-relaxed">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
