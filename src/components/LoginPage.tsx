/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Beautiful Modular Login Page for Mockup.AI generator.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Mail, Lock, User, Store, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: { email: string; brandName: string; shopifyDomain: string }) => void;
  onContinueAsGuest: () => void;
}

export default function LoginPage({ onLoginSuccess, onContinueAsGuest }: LoginPageProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Mock processing delay for extreme high-end UI feel
    setTimeout(() => {
      setLoading(false);
      
      const resolvedBrand = brandName.trim() || email.split("@")[0].toUpperCase() + " LABS";
      let resolvedShopify = shopifyDomain.trim();
      if (resolvedShopify && !resolvedShopify.endsWith(".myshopify.com")) {
        resolvedShopify = `${resolvedShopify.replace(/https?:\/\//, "")}.myshopify.com`;
      } else if (!resolvedShopify) {
        resolvedShopify = `${resolvedBrand.toLowerCase().replace(/[^a-z0-9]/g, "")}.myshopify.com`;
      }

      const userSession = {
        email: email.trim(),
        brandName: resolvedBrand,
        shopifyDomain: resolvedShopify,
      };

      // Save in localStorage for persistence
      localStorage.setItem("merch-mockup-session", JSON.stringify(userSession));
      onLoginSuccess(userSession);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex items-center justify-center p-4 md:p-8 select-none" id="login-screen">
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.04),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] min-h-[580px] relative z-10">
        
        {/* Left branding grid info section */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 md:p-10 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
          {/* Subtle grid accent background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                M
              </div>
              <div>
                <h1 className="font-bold tracking-tight text-white text-base">MOCKUP.AI</h1>
                <p className="text-[9px] text-blue-400 font-bold tracking-widest font-mono uppercase">CREATIVE SUITE</p>
              </div>
            </div>

            {/* Slogan */}
            <div className="space-y-3 pt-6">
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                Industrial-Grade <br />
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">AI Mockup Engine</span>
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                Generate custom high-resolution merchandise previews, isolate branding details with smart background removal, and push custom variant maps directly to your active Shopify storefront.
              </p>
            </div>
          </div>

          {/* Key values list */}
          <div className="space-y-4 pt-10 border-t border-white/5 relative z-10">
            {[
              { title: "HD & 4K Composites", desc: "Lossless vector print positioning merges" },
              { title: "Magic Chroma Background Keying", desc: "One-click background remover on logos" },
              { title: "Direct Shopify Store Export", desc: "Build formatted CSV variant grids instantly" },
            ].map((feat, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="p-1 bg-blue-500/10 rounded text-blue-400 shrink-0 mt-0.5 border border-blue-500/10">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">{feat.title}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-zinc-600 font-mono mt-8 relative z-10">
            v3.2.0 • Build verified on React 18
          </div>
        </div>

        {/* Right Form column section */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-zinc-950">
          <div className="max-w-md mx-auto w-full space-y-6">
            
            {/* Mode Switcher */}
            <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none ${
                  mode === "signin"
                    ? "bg-blue-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none ${
                  mode === "signup"
                    ? "bg-blue-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Headline info */}
            <div>
              <h3 className="text-lg font-bold text-white">
                {mode === "signin" ? "Welcome back" : "Get started for free"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {mode === "signin" 
                  ? "Sign in to restore your custom vector layouts and Shopify domains."
                  : "Launch your mockups dashboard and manage brand catalogs instantly."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                  Merchant Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brandname.com"
                    className="w-full text-xs bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Access Code / Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Conditional Signup Fields */}
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Brand Name */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Brand / Creator Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. SOLSTICE LABS"
                          className="w-full text-xs bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Shopify Store URL */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Shopify Store Subdomain (Optional)
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          value={shopifyDomain}
                          onChange={(e) => setShopifyDomain(e.target.value)}
                          placeholder="e.g. solstice-wear"
                          className="w-full text-xs bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-500 italic mt-1 font-mono">
                        Will be saved as solstice-wear.myshopify.com for direct product sync.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="flex items-start space-x-2 bg-red-950/30 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs leading-relaxed animate-shake">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all cursor-pointer shadow-lg shadow-blue-900/30 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{mode === "signin" ? "Authenticate" : "Generate Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Separator / Guest Mode */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] text-zinc-500 font-medium">Want to test the generator first?</span>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider cursor-pointer focus:outline-none hover:underline"
              >
                Continue as Guest →
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
