/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sliders, RotateCw, Maximize2, Layers, HelpCircle, AlignCenter, Target, Move, Zap, Type, RefreshCw, Sparkles } from "lucide-react";
import { LogoTransform, BackgroundRemovalSettings, MockupScene, PunchlineSettings } from "../types";
import { ProductPreset } from "../data/templates";

interface ControlPanelProps {
  transform: LogoTransform;
  onTransformChange: (transform: LogoTransform) => void;
  bgRemoval: BackgroundRemovalSettings;
  onBgRemovalChange: (bgRemoval: BackgroundRemovalSettings) => void;
  logoSelected: boolean;
  product?: ProductPreset;
  customScene?: MockupScene | null;
  isQuickPreview: boolean;
  setIsQuickPreview: (val: boolean) => void;
  isAdjusting: boolean;
  setIsAdjusting: (val: boolean) => void;
  punchline: PunchlineSettings;
  onPunchlineChange: (settings: PunchlineSettings) => void;
}

export default function ControlPanel({
  transform,
  onTransformChange,
  bgRemoval,
  onBgRemovalChange,
  logoSelected,
  product,
  customScene,
  isQuickPreview,
  setIsQuickPreview,
  isAdjusting,
  setIsAdjusting,
  punchline,
  onPunchlineChange,
}: ControlPanelProps) {
  
  const handleTransformFieldChange = <K extends keyof LogoTransform>(
    field: K,
    value: LogoTransform[K]
  ) => {
    onTransformChange({
      ...transform,
      [field]: value,
    });
  };

  const handleBgRemovalFieldChange = <K extends keyof BackgroundRemovalSettings>(
    field: K,
    value: BackgroundRemovalSettings[K]
  ) => {
    onBgRemovalChange({
      ...bgRemoval,
      [field]: value,
    });
  };

  const handlePunchlineChange = <K extends keyof PunchlineSettings>(
    field: K,
    value: PunchlineSettings[K]
  ) => {
    onPunchlineChange({
      ...punchline,
      [field]: value,
    });
  };

  const notify = (text: string, type: "undo" | "redo" | "save" | "info") => {
    const event = new CustomEvent("merch-mockup-notification", {
      detail: { text, type },
    });
    window.dispatchEvent(event);
  };

  const handleAlignToGarment = () => {
    const printArea = customScene
      ? { x: 20, y: 20, width: 60, height: 60 }
      : product
      ? product.printArea
      : { x: 30, y: 25, width: 40, height: 45 };

    const printAreaCenterX = printArea.x + printArea.width / 2;
    const printAreaCenterY = printArea.y + printArea.height / 2;

    const targetX = ((50 - printAreaCenterX) * 100) / printArea.width;
    const targetY = ((50 - printAreaCenterY) * 100) / printArea.height;

    onTransformChange({
      ...transform,
      x: Math.round(targetX * 100) / 100,
      y: Math.round(targetY * 100) / 100,
    });
    notify("Aligned Logo to Garment Center", "info");
  };

  const handleAlignToPrintArea = () => {
    onTransformChange({
      ...transform,
      x: 0,
      y: 0,
    });
    notify("Centered Logo in Print Box", "info");
  };

  const blendModes: { value: GlobalCompositeOperation; label: string }[] = [
    { value: "source-over", label: "Normal (Solid overlay)" },
    { value: "multiply", label: "Multiply (Blends with fabric fibers)" },
    { value: "screen", label: "Screen (Best for white prints on dark)" },
    { value: "overlay", label: "Overlay (Contrast blend)" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn" id="controls-panel">
      {/* Quick Preview Toggle Card */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <Zap className={`h-3.5 w-3.5 ${isQuickPreview ? "text-amber-400 fill-amber-400 animate-pulse" : "text-zinc-500"}`} />
            <p className="text-xs font-semibold text-zinc-200">Quick Preview (Fast Render)</p>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Disables expensive composite blend modes and custom image backdrops temporarily for lag-free adjustments.
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 ml-2">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isQuickPreview}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsQuickPreview(checked);
                notify(
                  `Quick Preview: ${checked ? "ENABLED (Fast Render)" : "DISABLED (High Quality)"}`,
                  "info"
                );
              }}
              className="sr-only peer"
              id="quick-preview-toggle"
            />
            <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-850 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
          </label>
          <span className="text-[8px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">[Ctrl+K]</span>
        </div>
      </div>

      {/* Brand Slogan / Punchline Message Toolkit */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center space-x-2">
            <Type className="h-4 w-4 text-amber-500" />
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-300 font-extrabold">Brand Slogan / Slogan</h3>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">
            Typography
          </span>
        </div>

        {/* Text Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Punchline Message</label>
          <div className="relative">
            <input
              type="text"
              value={punchline.text}
              onChange={(e) => handlePunchlineChange("text", e.target.value)}
              placeholder="e.g. BORN TO ADVENTURE"
              className="w-full text-xs border border-white/10 rounded-lg p-2.5 bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-white placeholder-zinc-600 font-medium"
            />
            {punchline.text && (
              <button
                type="button"
                onClick={() => handlePunchlineChange("text", "")}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white text-[10px] uppercase font-bold tracking-wider hover:bg-zinc-850 px-1.5 py-0.5 rounded cursor-pointer border-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {punchline.text && (
          <div className="space-y-4 animate-fadeIn">
            {/* Font Family Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Aesthetic Typeface</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: "sans", label: "Inter (Bold)", style: "font-sans font-bold" },
                  { value: "serif", label: "Playfair (Retro)", style: "font-serif italic" },
                  { value: "mono", label: "JetBrains (Tech)", style: "font-mono" },
                  { value: "grotesk", label: "Grotesk (Impact)", style: "font-sans font-black tracking-tight" },
                  { value: "handwritten", label: "Cursive (Warm)", style: "italic" }
                ].map((font) => {
                  const isSelected = punchline.fontFamily === font.value;
                  return (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handlePunchlineChange("fontFamily", font.value as any)}
                      className={`py-2 px-2.5 rounded-lg text-[9px] uppercase tracking-wider text-left border cursor-pointer select-none focus:outline-none transition-all ${
                        isSelected
                          ? "bg-amber-600/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5"
                          : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850"
                      }`}
                    >
                      <span className={font.style}>{font.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Options: Uppercase & Color preset */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Uppercase Toggle */}
              <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-xl p-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Uppercase</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={punchline.uppercase}
                    onChange={(e) => handlePunchlineChange("uppercase", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-850 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Text Color Selection */}
              <div className="flex flex-col justify-center bg-zinc-900/60 border border-white/5 rounded-xl p-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center mb-1">Color palette</span>
                <div className="flex items-center justify-center space-x-1">
                  {[
                    "#ffffff",
                    "#121212",
                    "#3b82f6",
                    "#f97316",
                    "#ef4444",
                    "#eab308"
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handlePunchlineChange("color", hex)}
                      className={`h-4.5 w-4.5 rounded-full border border-black/50 cursor-pointer transition-transform ${
                        punchline.color.toLowerCase() === hex.toLowerCase() ? "scale-125 ring-1 ring-amber-500" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                  <input
                    type="color"
                    value={punchline.color}
                    onChange={(e) => handlePunchlineChange("color", e.target.value)}
                    className="w-4.5 h-4.5 rounded cursor-pointer p-0 border-0 bg-transparent shrink-0"
                    title="Custom Color Picker"
                  />
                </div>
              </div>
            </div>

            {/* Arch Curvature strength (Circular Text) */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center">
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Arch Curvature
                </span>
                <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
                  {punchline.arcStrength === 0
                    ? "Straight"
                    : punchline.arcStrength < 0
                    ? `Arch Up (${Math.abs(punchline.arcStrength)}%)`
                    : `Arch Down (${punchline.arcStrength}%)`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={punchline.arcStrength}
                onChange={(e) => handlePunchlineChange("arcStrength", parseInt(e.target.value))}
                onMouseDown={() => setIsAdjusting(true)}
                onMouseUp={() => setIsAdjusting(false)}
                onTouchStart={() => setIsAdjusting(true)}
                onTouchEnd={() => setIsAdjusting(false)}
                className="w-full slider-input cursor-pointer"
              />
              <p className="text-[8px] text-zinc-500 leading-normal">
                Curvatures create iconic college jacket or vintage badge styles easily!
              </p>
            </div>

            {/* Typography Sizing & Tracking */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3">
              {/* Font Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Size</span>
                  <span className="font-mono text-[9px] text-zinc-300">{punchline.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="70"
                  step="1"
                  value={punchline.fontSize}
                  onChange={(e) => handlePunchlineChange("fontSize", parseInt(e.target.value))}
                  onMouseDown={() => setIsAdjusting(true)}
                  onMouseUp={() => setIsAdjusting(false)}
                  onTouchStart={() => setIsAdjusting(true)}
                  onTouchEnd={() => setIsAdjusting(false)}
                  className="w-full slider-input cursor-pointer"
                />
              </div>

              {/* Letter Spacing */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Letter Spacing</span>
                  <span className="font-mono text-[9px] text-zinc-300">+{punchline.tracking}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  value={punchline.tracking}
                  onChange={(e) => handlePunchlineChange("tracking", parseInt(e.target.value))}
                  onMouseDown={() => setIsAdjusting(true)}
                  onMouseUp={() => setIsAdjusting(false)}
                  onTouchStart={() => setIsAdjusting(true)}
                  onTouchEnd={() => setIsAdjusting(false)}
                  className="w-full slider-input cursor-pointer"
                />
              </div>
            </div>

            {/* Position Offsets (X / Y) */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3">
              {/* Horizontal Position X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Horizontal (X)</span>
                  <span className="font-mono text-[9px] text-zinc-300">{punchline.offsetX > 0 ? `+${punchline.offsetX}%` : `${punchline.offsetX}%`}</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="2"
                  value={punchline.offsetX}
                  onChange={(e) => handlePunchlineChange("offsetX", parseInt(e.target.value))}
                  onMouseDown={() => setIsAdjusting(true)}
                  onMouseUp={() => setIsAdjusting(false)}
                  onTouchStart={() => setIsAdjusting(true)}
                  onTouchEnd={() => setIsAdjusting(false)}
                  className="w-full slider-input cursor-pointer"
                />
              </div>

              {/* Vertical Position Y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Vertical (Y)</span>
                  <span className="font-mono text-[9px] text-zinc-300">{punchline.offsetY > 0 ? `+${punchline.offsetY}%` : `${punchline.offsetY}%`}</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="2"
                  value={punchline.offsetY}
                  onChange={(e) => handlePunchlineChange("offsetY", parseInt(e.target.value))}
                  onMouseDown={() => setIsAdjusting(true)}
                  onMouseUp={() => setIsAdjusting(false)}
                  onTouchStart={() => setIsAdjusting(true)}
                  onTouchEnd={() => setIsAdjusting(false)}
                  className="w-full slider-input cursor-pointer"
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Text Opacity</span>
                <span className="font-mono text-[9px] text-zinc-300">{Math.round(punchline.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={punchline.opacity}
                onChange={(e) => handlePunchlineChange("opacity", parseFloat(e.target.value))}
                onMouseDown={() => setIsAdjusting(true)}
                onMouseUp={() => setIsAdjusting(false)}
                onTouchStart={() => setIsAdjusting(true)}
                onTouchEnd={() => setIsAdjusting(false)}
                className="w-full slider-input cursor-pointer"
              />
            </div>

            {/* Quick Slogan Reset button */}
            <button
              type="button"
              onClick={() => {
                onPunchlineChange({
                  text: punchline.text,
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
                notify("Reset slogan styles to default values", "info");
              }}
              className="w-full py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all select-none focus:outline-none cursor-pointer text-center"
            >
              Reset Slogan Formatting
            </button>
          </div>
        )}
      </div>

      {/* Logo Section */}
      {logoSelected ? (
        <div className="space-y-6">
          {/* Transformation Sliders */}
          <div className="space-y-5 border-t border-white/5 pt-4">
            <div className="flex items-center space-x-1">
              <Sliders className="h-4 w-4 text-zinc-500" />
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Logo Placement Controls</h3>
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center"><Maximize2 className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Print Size</span>
            <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
              {Math.round(transform.scale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.05"
            value={transform.scale}
            onChange={(e) => handleTransformFieldChange("scale", parseFloat(e.target.value))}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            className="w-full slider-input cursor-pointer"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center"><RotateCw className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Rotate Angle</span>
            <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
              {transform.rotation}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={transform.rotation}
            onChange={(e) => handleTransformFieldChange("rotation", parseInt(e.target.value))}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            className="w-full slider-input cursor-pointer"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Ink Density (Opacity)</span>
            <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
              {Math.round(transform.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={transform.opacity}
            onChange={(e) => handleTransformFieldChange("opacity", parseFloat(e.target.value))}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            className="w-full slider-input cursor-pointer"
          />
        </div>

        {/* Horizontal Offset (X) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center"><Move className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Horizontal Offset (X)</span>
            <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
              {transform.x > 0 ? `+${Math.round(transform.x)}%` : `${Math.round(transform.x)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-120"
            max="120"
            step="1"
            value={transform.x}
            onChange={(e) => handleTransformFieldChange("x", parseInt(e.target.value))}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            className="w-full slider-input cursor-pointer"
          />
        </div>

        {/* Vertical Offset (Y) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center"><Move className="h-3.5 w-3.5 mr-1 text-zinc-500" /> Vertical Offset (Y)</span>
            <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
              {transform.y > 0 ? `+${Math.round(transform.y)}%` : `${Math.round(transform.y)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-120"
            max="120"
            step="1"
            value={transform.y}
            onChange={(e) => handleTransformFieldChange("y", parseInt(e.target.value))}
            onMouseDown={() => setIsAdjusting(true)}
            onMouseUp={() => setIsAdjusting(false)}
            onTouchStart={() => setIsAdjusting(true)}
            onTouchEnd={() => setIsAdjusting(false)}
            className="w-full slider-input cursor-pointer"
          />
        </div>

        {/* Quick Position Anchors */}
        <div className="space-y-2.5 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Position Anchors</span>
            <span className="text-[8px] text-zinc-400 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">Layout Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Pocket Left", x: -45, y: -40, scale: 0.45, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false },
              { label: "Center Chest", x: 0, y: -20, scale: 1.0, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false },
              { label: "Full Oversized", x: 0, y: 0, scale: 1.5, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false },
              { label: "Lower Right", x: 45, y: 55, scale: 0.5, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false },
              { label: "Sleeve Print", x: -85, y: 15, scale: 0.4, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false },
              { label: "Reset Standard", x: 0, y: 0, scale: 0.85, rotation: 0, opacity: transform.opacity, blendMode: transform.blendMode, smartCrop: false }
            ].map((preset) => {
              const isSelected = 
                transform.x === preset.x &&
                transform.y === preset.y &&
                transform.scale === preset.scale;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onTransformChange(preset);
                    notify(`Snapped layout to ${preset.label}`, "info");
                  }}
                  className={`py-2 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center border cursor-pointer select-none focus:outline-none transition-all ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500/80 text-blue-400 shadow-md shadow-blue-500/5"
                      : "bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-zinc-700"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-Align & Snapping */}
        <div className="space-y-2.5 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Auto-Align & Snapping</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAlignToGarment}
              className="py-2.5 px-3 text-[10px] font-bold border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white rounded-lg uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md focus:outline-none cursor-pointer"
              title="Snap logo center to the absolute center of the garment / product image (50%, 50%)"
              id="align-garment-btn"
            >
              <AlignCenter className="h-3.5 w-3.5" />
              <span>Center Garment</span>
            </button>
            <button
              onClick={handleAlignToPrintArea}
              className="py-2.5 px-3 text-[10px] font-bold border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md focus:outline-none cursor-pointer"
              title="Snap logo center to the center of the print area (0, 0)"
              id="align-print-btn"
            >
              <Target className="h-3.5 w-3.5" />
              <span>Center Print Box</span>
            </button>
          </div>
        </div>

        {/* Smart Crop & Clipping */}
        <div className="space-y-2.5 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Smart Crop & Clipping</span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[8px] font-extrabold px-1 rounded uppercase tracking-wider">SMART</span>
            </div>
          </div>
          <div className="bg-zinc-950/40 border border-white/5 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-zinc-200">Clip to Print Area</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Centers and clips the logo boundary strictly within the product's printable area.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none ml-2 shrink-0">
              <input
                type="checkbox"
                checked={transform.smartCrop || false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (isChecked) {
                    onTransformChange({
                      ...transform,
                      smartCrop: true,
                      x: 0,
                      y: 0,
                    });
                    notify("Smart Crop Enabled: Logo Centered & Clipped", "info");
                  } else {
                    onTransformChange({
                      ...transform,
                      smartCrop: false,
                    });
                    notify("Smart Crop Disabled", "info");
                  }
                }}
                className="sr-only peer"
                id="smart-crop-toggle"
              />
              <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-850 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
            </label>
          </div>
        </div>

        {/* Blend Modes */}
        <div className="space-y-2 border-t border-white/5 pt-4">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            <span>Fabric Blending & Shading</span>
          </div>
          <select
            value={transform.blendMode}
            onChange={(e) => handleTransformFieldChange("blendMode", e.target.value as GlobalCompositeOperation)}
            className="w-full text-xs border border-white/10 rounded-lg p-2.5 bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
          >
            {blendModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Background Removal Toolkit */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-xl p-4 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-blue-500/10 rounded border border-blue-500/15 text-blue-400">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide uppercase">AI Magic Background Remover</span>
            <div className="group relative">
              <HelpCircle className="h-3.5 w-3.5 text-zinc-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 p-2.5 bg-zinc-900 border border-white/5 text-zinc-300 text-[10px] rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 leading-relaxed">
                Uses advanced color keying and feathering thresholds to automatically strip off solid background backdrops from your vector designs.
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bgRemoval.enabled}
              onChange={(e) => handleBgRemovalFieldChange("enabled", e.target.checked)}
              className="sr-only peer"
              id="bg-removal-toggle"
            />
            <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-850 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
          </label>
        </div>

        {bgRemoval.enabled && (
          <div className="space-y-4 animate-fadeIn">
            {/* Target Color Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                Target Color to Erase
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["white", "black", "custom"] as const).map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => handleBgRemovalFieldChange("colorToKey", colorOption)}
                    className={`py-1.5 px-2 text-[10px] font-semibold border rounded-lg uppercase tracking-wider transition-all focus:outline-none ${
                      bgRemoval.colorToKey === colorOption
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {colorOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Key Picker */}
            {bgRemoval.colorToKey === "custom" && (
              <div className="flex items-center space-x-3 bg-zinc-900 p-2 border border-white/5 rounded-lg">
                <input
                  type="color"
                  value={bgRemoval.customColorHex}
                  onChange={(e) => handleBgRemovalFieldChange("customColorHex", e.target.value)}
                  className="w-8 h-8 rounded border border-white/10 p-0.5 cursor-pointer bg-transparent"
                />
                <div className="text-xs">
                  <p className="font-semibold text-zinc-300">Custom Key Color</p>
                  <p className="font-mono text-[9px] text-zinc-500">{bgRemoval.customColorHex.toUpperCase()}</p>
                </div>
              </div>
            )}

            {/* Tolerance Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Erase Tolerance</span>
                <span className="font-mono bg-zinc-800 border border-white/5 px-1.5 py-0.5 rounded text-[9px] text-zinc-300">
                  {bgRemoval.tolerance}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={bgRemoval.tolerance}
                onChange={(e) => handleBgRemovalFieldChange("tolerance", parseInt(e.target.value))}
                className="w-full slider-input cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
    ) : (
      <div className="border border-dashed border-white/10 bg-zinc-950/25 rounded-xl p-6 text-center text-zinc-500 space-y-2 mt-4">
        <Sliders className="h-6 w-6 mx-auto mb-1 text-zinc-600" />
        <p className="text-xs font-semibold text-zinc-300 font-bold">No Graphic Logo Selected</p>
        <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
          You can design and render custom brand slogans above independently, or select/upload a graphic logo from the "Logo" tab to unlock placement controls.
        </p>
      </div>
    )}
  </div>
);
}
