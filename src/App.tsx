/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Sliders, Palette, Layers, Download, RefreshCw, CheckCircle, HelpCircle, Save, Undo2, Redo2, Grid, Keyboard, Store, LogOut, User } from "lucide-react";
import { PRODUCTS, ProductPreset } from "./data/templates";
import { LogoTransform, LogoData, BackgroundRemovalSettings, MockupScene, SavedConfig, HistoryState, PunchlineSettings } from "./types";
import { removeImageBackground, generateMockupExport } from "./utils/imageUtils";
import LogoGenerator from "./components/LogoGenerator";
import ProductSelector from "./components/ProductSelector";
import ControlPanel from "./components/ControlPanel";
import MockupEditor from "./components/MockupEditor";
import ExportModal from "./components/ExportModal";
import SavedConfigs from "./components/SavedConfigs";
import BulkGenerator from "./components/BulkGenerator";
import LoginPage from "./components/LoginPage";
import AIPromptGenerator from "./components/AIPromptGenerator";

export default function App() {
  // Session User Authentication States
  const [user, setUser] = useState<{ email: string; brandName: string; shopifyDomain: string } | null>(() => {
    try {
      const saved = localStorage.getItem("merch-mockup-session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed loading session:", e);
      return null;
    }
  });
  const [isGuestBypassed, setIsGuestBypassed] = useState(false);

  // View Mode: 'studio' (mockup editor) or 'prompter' (AI Seller Hub)
  const [viewMode, setViewMode] = useState<"studio" | "prompter">("studio");

  // Visual Theme support: 'dark' or 'light' mode
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("merch-mockup-theme");
      return (saved as "dark" | "light") || "dark";
    } catch {
      return "dark";
    }
  });

  // Sync theme changes to localStorage
  useEffect(() => {
    localStorage.setItem("merch-mockup-theme", theme);
  }, [theme]);

  // Global Workspace States
  const [selectedProduct, setSelectedProduct] = useState<ProductPreset>(PRODUCTS[0]);
  const [productColor, setProductColor] = useState<string>(PRODUCTS[0].defaultColor);
  const [activeLogo, setActiveLogo] = useState<LogoData | null>(null);
  const [processedLogoSrc, setProcessedLogoSrc] = useState<string>("");
  const [customScene, setCustomScene] = useState<MockupScene | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isQuickPreview, setIsQuickPreview] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isQuickDownloading, setIsQuickDownloading] = useState(false);

  // Brand Slogan / Customer Message state
  const [punchline, setPunchline] = useState<PunchlineSettings>({
    text: "",
    fontFamily: "sans",
    fontSize: 24,
    color: "#ffffff",
    offsetX: 0,
    offsetY: 40,
    tracking: 4,
    opacity: 1,
    rotation: 0,
    arcStrength: 0,
    uppercase: true,
  });

  // Active Tab in the left workspace panel
  const [activeTab, setActiveTab] = useState<"logo" | "product" | "controls" | "presets">("logo");

  // Logo Transformations state
  const [transform, setTransform] = useState<LogoTransform>({
    x: 0,
    y: 0,
    scale: 1.0,
    rotation: 0,
    opacity: 1.0,
    blendMode: "source-over",
    smartCrop: false,
  });

  // Background removal properties
  const [bgRemoval, setBgRemoval] = useState<BackgroundRemovalSettings>({
    enabled: false,
    colorToKey: "white",
    customColorHex: "#FFFFFF",
    tolerance: 15,
  });

  // Global State History (Undo/Redo)
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);
  const isUndoingOrRedoing = React.useRef(false);
  const lastCommittedState = React.useRef<HistoryState | null>(null);

  // HUD Toast feedback state
  const [hudMessage, setHudMessage] = useState<{
    text: string;
    type: "undo" | "redo" | "save" | "info";
  } | null>(null);

  const showHud = (text: string, type: "undo" | "redo" | "save" | "info") => {
    setHudMessage({ text, type });
  };

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string; type: "undo" | "redo" | "save" | "info" }>;
      if (customEvent.detail && customEvent.detail.text) {
        showHud(customEvent.detail.text, customEvent.detail.type || "info");
      }
    };
    window.addEventListener("merch-mockup-notification", handleNotification);
    return () => {
      window.removeEventListener("merch-mockup-notification", handleNotification);
    };
  }, []);

  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => {
        setHudMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  const getCurrentStateSnapshot = (): HistoryState => ({
    productId: selectedProduct.id,
    productColor,
    activeLogo,
    customScene,
    transform,
    bgRemoval,
    punchline,
  });

  // Capture initial state
  useEffect(() => {
    if (!lastCommittedState.current) {
      lastCommittedState.current = getCurrentStateSnapshot();
    }
  }, []);

  // Track state changes to record history steps
  useEffect(() => {
    if (isUndoingOrRedoing.current) {
      return;
    }

    const currentSnapshot = getCurrentStateSnapshot();

    if (!lastCommittedState.current) {
      lastCommittedState.current = currentSnapshot;
      return;
    }

    const hasChanged =
      lastCommittedState.current.productId !== currentSnapshot.productId ||
      lastCommittedState.current.productColor !== currentSnapshot.productColor ||
      lastCommittedState.current.activeLogo?.src !== currentSnapshot.activeLogo?.src ||
      lastCommittedState.current.customScene?.imageUrl !== currentSnapshot.customScene?.imageUrl ||
      JSON.stringify(lastCommittedState.current.transform) !== JSON.stringify(currentSnapshot.transform) ||
      JSON.stringify(lastCommittedState.current.bgRemoval) !== JSON.stringify(currentSnapshot.bgRemoval) ||
      JSON.stringify(lastCommittedState.current.punchline) !== JSON.stringify(currentSnapshot.punchline);

    if (!hasChanged) {
      return;
    }

    // Capture the current snapshot in a timeout to debounce slider/drag operations
    const timer = setTimeout(() => {
      setUndoStack((prev) => {
        const updated = [...prev, lastCommittedState.current!];
        // Keep last 30 steps
        if (updated.length > 30) {
          updated.shift();
        }
        return updated;
      });
      setRedoStack([]);
      lastCommittedState.current = currentSnapshot;
    }, 500);

    return () => clearTimeout(timer);
  }, [
    selectedProduct.id,
    productColor,
    activeLogo,
    customScene,
    transform,
    bgRemoval,
    punchline,
  ]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const prev = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const currentSnapshot = getCurrentStateSnapshot();

    isUndoingOrRedoing.current = true;

    // Apply state
    const matchedProduct = PRODUCTS.find((p) => p.id === prev.productId);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
    }
    setProductColor(prev.productColor);
    setActiveLogo(prev.activeLogo);
    setCustomScene(prev.customScene);
    setTransform(prev.transform);
    setBgRemoval(prev.bgRemoval);
    if (prev.punchline) {
      setPunchline(prev.punchline);
    } else {
      setPunchline({
        text: "",
        fontFamily: "sans",
        fontSize: 24,
        color: "#ffffff",
        offsetX: 0,
        offsetY: 40,
        tracking: 4,
        opacity: 1,
        rotation: 0,
        arcStrength: 0,
        uppercase: true,
      });
    }

    setRedoStack((prevRedo) => [currentSnapshot, ...prevRedo]);
    setUndoStack(newUndoStack);
    lastCommittedState.current = prev;

    showHud("Undid Action", "undo");

    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const newRedoStack = redoStack.slice(1);
    const currentSnapshot = getCurrentStateSnapshot();

    isUndoingOrRedoing.current = true;

    // Apply state
    const matchedProduct = PRODUCTS.find((p) => p.id === next.productId);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
    }
    setProductColor(next.productColor);
    setActiveLogo(next.activeLogo);
    setCustomScene(next.customScene);
    setTransform(next.transform);
    setBgRemoval(next.bgRemoval);
    if (next.punchline) {
      setPunchline(next.punchline);
    } else {
      setPunchline({
        text: "",
        fontFamily: "sans",
        fontSize: 24,
        color: "#ffffff",
        offsetX: 0,
        offsetY: 40,
        tracking: 4,
        opacity: 1,
        rotation: 0,
        arcStrength: 0,
        uppercase: true,
      });
    }

    setUndoStack((prevUndo) => [...prevUndo, currentSnapshot]);
    setRedoStack(newRedoStack);
    lastCommittedState.current = next;

    showHud("Redid Action", "redo");

    setTimeout(() => {
      isUndoingOrRedoing.current = false;
    }, 50);
  };

  // Watch product changes to reset the default color
  const handleProductChange = (product: ProductPreset) => {
    setSelectedProduct(product);
    setProductColor(product.defaultColor);
  };

  // Reset all settings to defaults
  const handleReset = () => {
    setProductColor(selectedProduct.defaultColor);
    setTransform({
      x: 0,
      y: 0,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      blendMode: "source-over",
      smartCrop: false,
    });
    setBgRemoval({
      enabled: false,
      colorToKey: "white",
      customColorHex: "#FFFFFF",
      tolerance: 15,
    });
    setPunchline({
      text: "",
      fontFamily: "sans",
      fontSize: 24,
      color: "#ffffff",
      offsetX: 0,
      offsetY: 40,
      tracking: 4,
      opacity: 1,
      rotation: 0,
      arcStrength: 0,
      uppercase: true,
    });
    setCustomScene(null);
  };

  const handleQuickDownloadPng = async () => {
    if (!activeLogo) return;
    setIsQuickDownloading(true);
    try {
      // Get background source
      let bgSrc = "";
      if (customScene) {
        bgSrc = customScene.imageUrl;
      } else {
        const svgString = selectedProduct.getSvg(productColor);
        bgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
      }

      const printArea = customScene
        ? { x: 20, y: 20, width: 60, height: 60 }
        : selectedProduct.printArea;

      // Generate the lossless composite PNG at selected high resolution (default 2K HD)
      const mockupDataUrl = await generateMockupExport(
        bgSrc,
        activeLogo.processedSrc,
        printArea,
        transform.x,
        transform.y,
        transform.scale,
        transform.rotation,
        transform.opacity,
        transform.blendMode,
        2000 // 2K high-definition preview
      );

      // Create download trigger
      const link = document.createElement("a");
      link.href = mockupDataUrl;
      const cleanProductName = selectedProduct.name.toLowerCase().replace(/\s+/g, "_");
      link.download = `mockup_${cleanProductName}_preview.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Custom notification toast
      window.dispatchEvent(
        new CustomEvent("merch-mockup-notification", {
          detail: {
            text: "High-Res Mockup PNG downloaded successfully!",
            type: "save"
          }
        })
      );
    } catch (e) {
      console.error("Quick download PNG failed:", e);
    } finally {
      setIsQuickDownloading(false);
    }
  };

  // Safe Reactive Background Removal hook using primitive dependencies
  const activeLogoSrc = activeLogo?.src;
  const isBgRemovalEnabled = bgRemoval.enabled;
  const bgRemovalColorKey = bgRemoval.colorToKey;
  const bgRemovalCustomColorHex = bgRemoval.customColorHex;
  const bgRemovalTolerance = bgRemoval.tolerance;

  useEffect(() => {
    if (!activeLogoSrc) {
      setProcessedLogoSrc("");
      return;
    }

    let active = true;

    async function processLogo() {
      if (isBgRemovalEnabled) {
        const processed = await removeImageBackground(
          activeLogoSrc,
          bgRemovalColorKey,
          bgRemovalCustomColorHex,
          bgRemovalTolerance
        );
        if (active) {
          setProcessedLogoSrc(processed);
        }
      } else {
        if (active) {
          setProcessedLogoSrc(activeLogoSrc);
        }
      }
    }

    processLogo();

    return () => {
      active = false;
    };
  }, [
    activeLogoSrc,
    isBgRemovalEnabled,
    bgRemovalColorKey,
    bgRemovalCustomColorHex,
    bgRemovalTolerance,
  ]);

  // Sync activeLogoProcessed
  const logoForEditor = activeLogo
    ? { ...activeLogo, processedSrc: processedLogoSrc }
    : null;

  const handleLoadConfig = (config: SavedConfig) => {
    const matchedProduct = PRODUCTS.find((p) => p.id === config.productId);
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
    }
    setProductColor(config.productColor);
    setActiveLogo(config.activeLogo);
    setCustomScene(config.customScene);
    setTransform(config.transform);
    setBgRemoval(config.bgRemoval);
    if (config.punchline) {
      setPunchline(config.punchline);
    } else {
      setPunchline({
        text: "",
        fontFamily: "sans",
        fontSize: 24,
        color: "#ffffff",
        offsetX: 0,
        offsetY: 40,
        tracking: 4,
        opacity: 1,
        rotation: 0,
        arcStrength: 0,
        uppercase: true,
      });
    }
  };

  // Global Keyboard Shortcut System Listener (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleSaveConfigShortcut = () => {
      try {
        const productName = selectedProduct ? selectedProduct.name : "Mockup";
        const logoName = activeLogo
          ? activeLogo.name.replace(" Template", "").replace(" AI Logo", "")
          : "Blank";
        const date = new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const autoName = `${productName} (${logoName}) - ${date}`;

        const newConfig: SavedConfig = {
          id: `config_${Date.now()}`,
          name: autoName,
          createdAt: new Date().toISOString(),
          productId: selectedProduct.id,
          productColor,
          activeLogo,
          customScene,
          transform,
          bgRemoval,
          punchline,
        };

        const LOCAL_STORAGE_KEY = "merch_mockup_saved_configs";
        let existing: SavedConfig[] = [];
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          existing = JSON.parse(stored);
        }

        const updated = [newConfig, ...existing];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

        // Dispatch Custom Event so SavedConfigs triggers refresh
        window.dispatchEvent(new Event("merch-mockup-config-changed"));

        showHud(`Saved setup: "${autoName}"`, "save");
      } catch (err) {
        console.error("Failed to auto-save configuration via shortcut:", err);
        showHud("Failed to save configuration set", "info");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in inputs, textareas or editables
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const hasModifier = isMac ? e.metaKey : e.ctrlKey;

      if (hasModifier) {
        // Ctrl+Z / Cmd+Z (supports Ctrl+Shift+Z for Redo)
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          if (e.shiftKey) {
            if (redoStack.length > 0) {
              handleRedo();
            } else {
              showHud("Nothing to Redo", "info");
            }
          } else {
            if (undoStack.length > 0) {
              handleUndo();
            } else {
              showHud("Nothing to Undo", "info");
            }
          }
        }
        // Ctrl+Y / Cmd+Y for Redo
        else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          if (redoStack.length > 0) {
            handleRedo();
          } else {
            showHud("Nothing to Redo", "info");
          }
        }
        // Ctrl+S / Cmd+S for Preset Config Save
        else if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          handleSaveConfigShortcut();
        }
        // Ctrl+K / Cmd+K for Quick Preview toggle
        else if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          setIsQuickPreview((prev) => {
            const nextVal = !prev;
            showHud(
              `Quick Preview: ${nextVal ? "ENABLED (Fast Render)" : "DISABLED (High Quality)"}`,
              "info"
            );
            return nextVal;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    undoStack,
    redoStack,
    selectedProduct,
    productColor,
    activeLogo,
    customScene,
    transform,
    bgRemoval,
    isQuickPreview,
    punchline,
  ]);

  if (!user && !isGuestBypassed) {
    return (
      <LoginPage
        onLoginSuccess={(session) => {
          setUser(session);
          showHud(`Authenticated as ${session.brandName}!`, "info");
        }}
        onContinueAsGuest={() => {
          setIsGuestBypassed(true);
          showHud("Continuing in Guest Mode", "info");
        }}
      />
    );
  }

  if (!user && !isGuestBypassed) {
    return (
      <LoginPage
        onLoginSuccess={(session) => setUser(session)}
        onContinueAsGuest={() => setIsGuestBypassed(true)}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === "dark" ? "bg-[#09090b] text-white selection:bg-blue-600 selection:text-white" : "bg-zinc-50 text-zinc-900 selection:bg-blue-600 selection:text-white"}`} id="app-root">
      {/* Upper Navigation / App Branding Header */}
      <header className={`h-16 border-b flex items-center justify-between px-8 z-20 shrink-0 transition-all ${theme === "dark" ? "bg-zinc-950/50 border-white/5" : "bg-white border-zinc-200"}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            M
          </div>
          <div className="hidden sm:block">
            <h1 className="font-sans font-bold tracking-tight text-sm md:text-base flex items-center gap-2">
              MOCKUP.AI
              {user && (
                <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                  {user.brandName}
                </span>
              )}
              {!user && isGuestBypassed && (
                <span className={`text-[9px] border font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${theme === "dark" ? "bg-zinc-800 border-white/5 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"}`}>
                  Guest Mode
                </span>
              )}
            </h1>
            <p className="text-[9px] text-zinc-500 font-medium tracking-wide font-mono uppercase mt-0.5">
              AI-Powered Print-On-Demand Terminal
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Mode Switcher: Studio vs AI Prompter Hub */}
        <div className={`flex rounded-full p-1 border transition-all ${theme === "dark" ? "bg-zinc-900/60 border-white/5" : "bg-zinc-200/60 border-zinc-300"}`} id="view-mode-selector">
          <button
            onClick={() => setViewMode("studio")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none ${
              viewMode === "studio"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span className="hidden md:inline">Mockup Studio</span>
            <span className="inline md:hidden">Studio</span>
          </button>
          <button
            onClick={() => setViewMode("prompter")}
            className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer focus:outline-none ${
              viewMode === "prompter"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            id="ai-prompt-hub-trigger"
          >
            <Sparkles className="h-3 w-3 text-blue-200 animate-pulse" />
            <span className="hidden md:inline">AI Prompter & Seller Hub</span>
            <span className="inline md:hidden">AI Prompter</span>
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden lg:flex items-center space-x-2 mr-2 border-r border-white/5 pr-4">
              <span className="text-[10px] text-zinc-400 font-mono font-medium truncate max-w-[120px]" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("merch-mockup-session");
                  setUser(null);
                  setIsGuestBypassed(false);
                  setViewMode("studio");
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold uppercase tracking-wider underline cursor-pointer focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          )}
          {!user && isGuestBypassed && (
            <button
              onClick={() => setIsGuestBypassed(false)}
              className="hidden lg:block text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider underline cursor-pointer focus:outline-none mr-2 border-r border-white/5 pr-4"
            >
              Sign In
            </button>
          )}

          {/* Undo and Redo Stack controls */}
          <div className="flex items-center bg-zinc-900/50 border border-white/5 rounded-full p-0.5" id="history-controls">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded-full transition-all focus:outline-none ${
                undoStack.length > 0
                  ? "text-zinc-200 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed"
              }`}
              title={`Undo (Ctrl+Z) - ${undoStack.length} actions back`}
              id="undo-btn"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded-full transition-all focus:outline-none ${
                redoStack.length > 0
                  ? "text-zinc-200 hover:text-white hover:bg-zinc-800 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed"
              }`}
              title={`Redo (Ctrl+Y) - ${redoStack.length} actions forward`}
              id="redo-btn"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-1.5 border border-white/5 bg-zinc-900/50 hover:bg-zinc-800/80 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors text-zinc-400 hover:text-white focus:outline-none"
            id="reset-workspace-btn"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Workspace</span>
          </button>

          <button
            disabled={!activeLogo}
            onClick={() => setIsBulkOpen(true)}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all focus:outline-none ${
              activeLogo
                ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-500/20"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
            }`}
            id="bulk-preview-trigger-btn"
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Bulk Previews</span>
          </button>
          
          <button
            disabled={!activeLogo || isQuickDownloading}
            onClick={handleQuickDownloadPng}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all focus:outline-none ${
              activeLogo && !isQuickDownloading
                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-500/20"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
            }`}
            id="quick-download-png-btn"
          >
            {isQuickDownloading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download PNG</span>
              </>
            )}
          </button>
          
          <button
            disabled={!activeLogo}
            onClick={() => setIsExportOpen(true)}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all focus:outline-none ${
              activeLogo
                ? "bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-lg shadow-white/5"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
            }`}
            id="export-trigger-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Files</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame with AnimatePresence Page Transition */}
      <AnimatePresence mode="wait">
        {viewMode === "prompter" ? (
          <motion.div
            key="prompter"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 overflow-y-auto min-h-0 flex flex-col"
          >
            <AIPromptGenerator
              user={user}
              onLogoSelected={(logo) => {
                setActiveLogo(logo);
                // Set the default product category matching the generated idea
                const matchedProduct = PRODUCTS.find(
                  (p) =>
                    p.id.toLowerCase() === logo.productType?.toLowerCase() ||
                    p.name.toLowerCase().includes(logo.productType?.toLowerCase() || "")
                );
                if (matchedProduct) {
                  setSelectedProduct(matchedProduct);
                  setProductColor(matchedProduct.defaultColor);
                }
              }}
              onSwitchToStudio={() => setViewMode("studio")}
              theme={theme}
              onThemeToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            />
          </motion.div>
        ) : (
          <motion.main
            key="studio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0"
          >
        {/* Left Side Control Panel (Surgical settings) */}
        <div className="w-full lg:w-[420px] bg-zinc-950/30 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0 min-h-0 z-10" id="sidebar-controls">
          {/* Section Step Tabs */}
          <div className="grid grid-cols-4 border-b border-white/5 bg-zinc-950/50 shrink-0">
            <button
              onClick={() => setActiveTab("logo")}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "logo"
                  ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>1. Logo</span>
            </button>
            <button
              onClick={() => setActiveTab("product")}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "product"
                  ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>2. Product</span>
            </button>
            <button
              onClick={() => setActiveTab("controls")}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "controls"
                  ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>3. Place</span>
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
                activeTab === "presets"
                  ? "border-blue-500 text-blue-400 bg-white/[0.02]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>4. Presets</span>
            </button>
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-transparent scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
            <div className="bg-[#121217] text-white rounded-2xl p-5 border border-white/5 shadow-2xl">
              {activeTab === "logo" && (
                <LogoGenerator
                  onLogoSelected={setActiveLogo}
                  activeLogo={activeLogo}
                  bgRemoval={bgRemoval}
                  onBgRemovalChange={setBgRemoval}
                />
              )}
              {activeTab === "product" && (
                <ProductSelector
                  selectedProduct={selectedProduct}
                  onProductChange={handleProductChange}
                  productColor={productColor}
                  onColorChange={setProductColor}
                  customScene={customScene}
                  onCustomSceneChange={setCustomScene}
                  activeLogo={activeLogo}
                />
              )}
              {activeTab === "controls" && (
                <ControlPanel
                  transform={transform}
                  onTransformChange={setTransform}
                  bgRemoval={bgRemoval}
                  onBgRemovalChange={setBgRemoval}
                  logoSelected={!!activeLogo}
                  product={selectedProduct}
                  customScene={customScene}
                  isQuickPreview={isQuickPreview}
                  setIsQuickPreview={setIsQuickPreview}
                  isAdjusting={isAdjusting}
                  setIsAdjusting={setIsAdjusting}
                  punchline={punchline}
                  onPunchlineChange={setPunchline}
                />
              )}
              {activeTab === "presets" && (
                <SavedConfigs
                  currentProductId={selectedProduct.id}
                  currentProductColor={productColor}
                  currentLogo={activeLogo}
                  currentCustomScene={customScene}
                  currentTransform={transform}
                  currentBgRemoval={bgRemoval}
                  onLoadConfig={handleLoadConfig}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side Mockup Arena */}
        <div className="flex-1 flex flex-col p-6 md:p-8 bg-black/40 overflow-y-auto relative min-w-0" id="mockup-stage-arena">
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full space-y-6">
            
            {/* Upper Interactive Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
                  Live Previews <span className="text-zinc-600 font-normal text-sm">(Active View)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Adjust active layers and preview on photorealistic canvas mockups.
                </p>
              </div>

              {/* Status Checklist Banner */}
              <div className="bg-[#121217] border border-white/5 rounded-xl p-3 flex items-center space-x-4 self-start md:self-auto text-xs">
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${activeLogo ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-zinc-700"}`} />
                  <span className="text-zinc-400">Logo:</span>
                  <span className={`font-semibold ${activeLogo ? "text-emerald-400" : "text-zinc-500"}`}>
                    {activeLogo ? "Selected" : "Empty"}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${customScene ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                  <span className="text-zinc-400">Backdrop:</span>
                  <span className="font-semibold text-zinc-300">
                    {customScene ? "AI Custom Scene" : "Flat Template"}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Visualizer Component */}
            <div className="flex-1 min-h-0">
              <MockupEditor
                product={selectedProduct}
                color={productColor}
                logo={logoForEditor}
                transform={transform}
                onTransformChange={setTransform}
                customScene={customScene}
                isQuickPreview={isQuickPreview}
                isAdjusting={isAdjusting}
                punchline={punchline}
              />
            </div>

            {/* Action buttons sitting below Editor */}
            {activeLogo && (
              <div className="bg-gradient-to-br from-blue-900/10 to-zinc-900/40 border border-blue-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-200">Are you ready to manufacture?</h4>
                  <p className="text-xs text-zinc-400">
                    Download full-scale print files and beautiful composite mockup views instantly.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/30 transition-all focus:outline-none"
                  id="manufacturing-export-btn"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Print & Mockup Assets</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.main>
    )}
  </AnimatePresence>

      {/* Footer from Mockup.AI */}
      <footer className="h-10 px-8 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-medium bg-zinc-950/80 shrink-0">
        <span>Engine v4.2.0-Alpha</span>
        <div className="flex gap-4">
          <span>GPU Acceleration Active</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Synchronized
          </span>
        </div>
      </footer>

      {/* Export Modal Pipeline */}
      {activeLogo && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          product={selectedProduct}
          color={productColor}
          logo={activeLogo}
          transform={transform}
          customScene={customScene}
        />
      )}

      {/* Bulk Generator Pipeline */}
      <BulkGenerator
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        logo={logoForEditor}
        transform={transform}
      />

      {/* Sleek HUD notification overlay for shortcut feedbacks */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-zinc-950/95 border border-white/10 rounded-full px-4 py-2 shadow-2xl text-xs font-semibold tracking-wide pointer-events-none"
            id="hud-toast"
          >
            {hudMessage.type === "undo" && (
              <Undo2 className="h-4 w-4 text-amber-400 animate-pulse" />
            )}
            {hudMessage.type === "redo" && (
              <Redo2 className="h-4 w-4 text-emerald-400 animate-pulse" />
            )}
            {hudMessage.type === "save" && (
              <Save className="h-4 w-4 text-blue-400 animate-pulse" />
            )}
            {hudMessage.type === "info" && (
              <HelpCircle className="h-4 w-4 text-zinc-400" />
            )}
            <span className="text-zinc-200">{hudMessage.text}</span>
            <span className="text-[10px] bg-white/5 text-zinc-500 rounded px-1.5 py-0.5 font-mono ml-2">
              {hudMessage.type === "undo" && "Ctrl+Z"}
              {hudMessage.type === "redo" && "Ctrl+Y"}
              {hudMessage.type === "save" && "Ctrl+S"}
              {hudMessage.type === "info" && "Shortcut"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
