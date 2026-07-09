/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Sparkles, AlertCircle, FileImage, Check, Crop, Sliders, ShieldCheck, RefreshCw, Trash2 } from "lucide-react";
import { LogoData, LogoStyle, BackgroundRemovalSettings } from "../types";

// Professional procedural vector SVG sample logos
const SAMPLE_LOGOS = [
  {
    id: "zen-mountain",
    name: "Zen Peak",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#0F172A" stroke-width="4" />
        <path d="M 50,15 L 82,75 L 18,75 Z" fill="#0F172A" />
        <path d="M 50,15 L 35,45 Q 50,30 50,15" fill="#FFFFFF" opacity="0.3" />
        <path d="M 50,15 L 50,75" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="2,2" />
        <circle cx="50" cy="50" r="3" fill="#EF4444" />
      </svg>
    `
  },
  {
    id: "organic-leaf",
    name: "Eco Leaf",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50,15 C 20,40 30,85 50,85 C 70,85 80,40 50,15 Z" fill="#10B981" />
        <path d="M 50,85 L 50,15" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
        <path d="M 50,65 Q 65,55 70,45" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
        <path d="M 50,45 Q 35,35 30,25" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
      </svg>
    `
  },
  {
    id: "cyber-coffee",
    name: "Cyber Brew",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect x="25" y="35" width="40" height="40" rx="12" ry="12" fill="none" stroke="#2563EB" stroke-width="4" />
        <path d="M 65,45 C 75,45 80,50 80,55 C 80,60 75,65 65,65" fill="none" stroke="#2563EB" stroke-width="4" />
        <path d="M 35,15 Q 38,25 35,30 M 45,15 Q 48,25 45,30 M 55,15 Q 58,25 55,30" fill="none" stroke="#EC4899" stroke-width="3" stroke-linecap="round" />
        <circle cx="45" cy="55" r="8" fill="#EC4899" />
      </svg>
    `
  },
  {
    id: "retro-rocket",
    name: "Alpha Corp",
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M 50,10 C 35,30 35,65 30,75 L 45,65 L 50,85 L 55,65 L 70,75 C 65,65 65,30 50,10 Z" fill="#EF4444" />
        <circle cx="50" cy="35" r="5" fill="#FFFFFF" />
        <path d="M 45,85 Q 50,95 55,85" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" />
      </svg>
    `
  }
];

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

const cropImage = (
  imageSrc: string,
  cropPercentX: number,
  cropPercentY: number,
  cropPercentWidth: number,
  cropPercentHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const sourceX = (cropPercentX / 100) * img.naturalWidth;
      const sourceY = (cropPercentY / 100) * img.naturalHeight;
      const sourceWidth = (cropPercentWidth / 100) * img.naturalWidth;
      const sourceHeight = (cropPercentHeight / 100) * img.naturalHeight;
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );
      
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => reject(err);
  });
};

interface LogoGeneratorProps {
  onLogoSelected: (logo: LogoData) => void;
  activeLogo: LogoData | null;
  bgRemoval?: BackgroundRemovalSettings;
  onBgRemovalChange?: (settings: BackgroundRemovalSettings) => void;
}

export default function LogoGenerator({ onLogoSelected, activeLogo, bgRemoval, onBgRemovalChange }: LogoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<LogoStyle>("modern");
  const [useHighQuality, setUseHighQuality] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Magic AI background remover states
  const [aiRemoving, setAiRemoving] = useState(false);
  const [aiRemovingSuccess, setAiRemovingSuccess] = useState(false);

  const autoDetectBackgroundColor = (imgSrc: string): Promise<"white" | "black" | "custom" | string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgSrc;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 10;
          canvas.height = 10;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("white");
            return;
          }
          ctx.drawImage(img, 0, 0, 10, 10);
          const imageData = ctx.getImageData(0, 0, 10, 10);
          const data = imageData.data;
          
          // Inspect the four corners: (0,0), (9,0), (0,9), (9,9)
          const corners = [
            { r: data[0], g: data[1], b: data[2], a: data[3] },
            { r: data[9 * 4], g: data[9 * 4 + 1], b: data[9 * 4 + 2], a: data[9 * 4 + 3] },
            { r: data[90 * 4], g: data[90 * 4 + 1], b: data[90 * 4 + 2], a: data[90 * 4 + 3] },
            { r: data[99 * 4], g: data[99 * 4 + 1], b: data[99 * 4 + 2], a: data[99 * 4 + 3] },
          ];
          
          // Average corner RGB
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          corners.forEach((c) => {
            if (c.a > 50) { // Only inspect non-transparent corners
              sumR += c.r;
              sumG += c.g;
              sumB += c.b;
              count++;
            }
          });
          
          if (count === 0) {
            resolve("white");
            return;
          }
          
          const avgR = sumR / count;
          const avgG = sumG / count;
          const avgB = sumB / count;
          
          // Is it close to white?
          if (avgR > 210 && avgG > 210 && avgB > 210) {
            resolve("white");
          } else if (avgR < 45 && avgG < 45 && avgB < 45) {
            resolve("black");
          } else {
            // Return custom hex color
            const rHex = Math.round(avgR).toString(16).padStart(2, "0");
            const gHex = Math.round(avgG).toString(16).padStart(2, "0");
            const bHex = Math.round(avgB).toString(16).padStart(2, "0");
            resolve(`#${rHex}${gHex}${bHex}`);
          }
        } catch {
          resolve("white");
        }
      };
      img.onerror = () => resolve("white");
    });
  };

  const handleMagicAiBackgroundRemoval = async () => {
    if (!activeLogo || !onBgRemovalChange) return;
    setAiRemoving(true);
    setAiRemovingSuccess(false);
    
    // Auto-detect color from the corners
    const detected = await autoDetectBackgroundColor(activeLogo.src);
    
    setTimeout(() => {
      setAiRemoving(false);
      setAiRemovingSuccess(true);
      
      let colorToKey: "white" | "black" | "custom" = "white";
      let customColorHex = "#FFFFFF";
      
      if (detected === "white") {
        colorToKey = "white";
        customColorHex = "#FFFFFF";
      } else if (detected === "black") {
        colorToKey = "black";
        customColorHex = "#000000";
      } else {
        colorToKey = "custom";
        customColorHex = detected;
      }
      
      onBgRemovalChange({
        enabled: true,
        colorToKey,
        customColorHex,
        tolerance: 20
      });

      // Dispatch visual notification toast
      window.dispatchEvent(
        new CustomEvent("merch-mockup-notification", {
          detail: {
            text: "AI Background Remover: Isolated background successfully!",
            type: "save"
          }
        })
      );
    }, 1200);
  };

  // Cropping State variables
  const [isCropping, setIsCropping] = useState(false);
  const [imageToCropSrc, setImageToCropSrc] = useState<string | null>(null);
  const [imageToCropName, setImageToCropName] = useState<string>("");
  const [crop, setCrop] = useState<CropState>({ x: 15, y: 15, width: 70, height: 70 });
  const [aspectRatio, setAspectRatio] = useState<"free" | "1:1" | "4:3" | "16:9">("free");
  const [imageNaturalRatio, setImageNaturalRatio] = useState<number>(1);
  const [applyingCrop, setApplyingCrop] = useState(false);

  // Dragging state tracking
  const [dragType, setDragType] = useState<"move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se" | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropState } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startCropping = (src: string, name: string) => {
    setImageToCropSrc(src);
    setImageToCropName(name);
    setCrop({ x: 15, y: 15, width: 70, height: 70 });
    setAspectRatio("free");
    setIsCropping(true);
  };

  const enforceRatio = (
    currentCrop: CropState,
    targetRatio: "free" | "1:1" | "4:3" | "16:9",
    naturalRatio: number
  ): CropState => {
    if (targetRatio === "free") return currentCrop;

    let targetAR = 1;
    if (targetRatio === "1:1") targetAR = 1;
    else if (targetRatio === "4:3") targetAR = 4 / 3;
    else if (targetRatio === "16:9") targetAR = 16 / 9;

    const factor = naturalRatio / targetAR;
    
    let newWidth = currentCrop.width;
    let newHeight = newWidth * factor;

    if (currentCrop.y + newHeight > 100) {
      newHeight = 100 - currentCrop.y;
      newWidth = newHeight / factor;
    }
    
    if (currentCrop.x + newWidth > 100) {
      newWidth = 100 - currentCrop.x;
      newHeight = newWidth * factor;
    }

    return {
      ...currentCrop,
      width: newWidth,
      height: newHeight,
    };
  };

  const handleRatioChange = (ratio: "free" | "1:1" | "4:3" | "16:9") => {
    setAspectRatio(ratio);
    if (ratio !== "free") {
      setCrop((prev) => enforceRatio(prev, ratio, imageNaturalRatio));
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setImageNaturalRatio(ratio);
  };

  const handleDragStartCommon = (clientX: number, clientY: number, type: typeof dragType) => {
    if (!containerRef.current) return;
    setDragType(type);
    setDragStart({
      x: clientX,
      y: clientY,
      crop: { ...crop }
    });
  };

  const handleMouseDown = (e: React.MouseEvent, type: typeof dragType) => {
    e.preventDefault();
    handleDragStartCommon(e.clientX, e.clientY, type);
  };

  const handleTouchStart = (e: React.TouchEvent, type: typeof dragType) => {
    if (e.touches[0]) {
      handleDragStartCommon(e.touches[0].clientX, e.touches[0].clientY, type);
    }
  };

  const handleDragMoveCommon = (clientX: number, clientY: number) => {
    if (!dragType || !dragStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPixels = clientX - dragStart.x;
    const deltaYPixels = clientY - dragStart.y;

    const deltaXPercent = (deltaXPixels / rect.width) * 100;
    const deltaYPercent = (deltaYPixels / rect.height) * 100;

    let nextCrop = { ...dragStart.crop };

    if (dragType === "move") {
      nextCrop.x = dragStart.crop.x + deltaXPercent;
      nextCrop.y = dragStart.crop.y + deltaYPercent;

      if (nextCrop.x < 0) nextCrop.x = 0;
      if (nextCrop.y < 0) nextCrop.y = 0;
      if (nextCrop.x + nextCrop.width > 100) nextCrop.x = 100 - nextCrop.width;
      if (nextCrop.y + nextCrop.height > 100) nextCrop.y = 100 - nextCrop.height;
    } else if (dragType === "resize-se") {
      nextCrop.width = Math.max(10, dragStart.crop.width + deltaXPercent);
      nextCrop.height = Math.max(10, dragStart.crop.height + deltaYPercent);

      if (nextCrop.x + nextCrop.width > 100) nextCrop.width = 100 - nextCrop.x;
      if (nextCrop.y + nextCrop.height > 100) nextCrop.height = 100 - nextCrop.y;
    } else if (dragType === "resize-sw") {
      const rightX = dragStart.crop.x + dragStart.crop.width;
      nextCrop.x = Math.max(0, Math.min(rightX - 10, dragStart.crop.x + deltaXPercent));
      nextCrop.width = rightX - nextCrop.x;
      nextCrop.height = Math.max(10, dragStart.crop.height + deltaYPercent);

      if (nextCrop.y + nextCrop.height > 100) nextCrop.height = 100 - nextCrop.y;
    } else if (dragType === "resize-ne") {
      const bottomY = dragStart.crop.y + dragStart.crop.height;
      nextCrop.y = Math.max(0, Math.min(bottomY - 10, dragStart.crop.y + deltaYPercent));
      nextCrop.height = bottomY - nextCrop.y;
      nextCrop.width = Math.max(10, dragStart.crop.width + deltaXPercent);

      if (nextCrop.x + nextCrop.width > 100) nextCrop.width = 100 - nextCrop.x;
    } else if (dragType === "resize-nw") {
      const rightX = dragStart.crop.x + dragStart.crop.width;
      const bottomY = dragStart.crop.y + dragStart.crop.height;
      nextCrop.x = Math.max(0, Math.min(rightX - 10, dragStart.crop.x + deltaXPercent));
      nextCrop.width = rightX - nextCrop.x;
      nextCrop.y = Math.max(0, Math.min(bottomY - 10, dragStart.crop.y + deltaYPercent));
      nextCrop.height = bottomY - nextCrop.y;
    }

    if (aspectRatio !== "free") {
      nextCrop = enforceRatio(nextCrop, aspectRatio, imageNaturalRatio);
    }

    setCrop(nextCrop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMoveCommon(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleDragMoveCommon(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseUp = () => {
    setDragType(null);
    setDragStart(null);
  };

  const handleApplyCrop = async () => {
    if (!imageToCropSrc) return;
    setApplyingCrop(true);
    try {
      const croppedDataUrl = await cropImage(
        imageToCropSrc,
        crop.x,
        crop.y,
        crop.width,
        crop.height
      );
      
      const img = new Image();
      img.src = croppedDataUrl;
      img.onload = () => {
        onLogoSelected({
          src: croppedDataUrl,
          processedSrc: croppedDataUrl,
          name: imageToCropName.includes("Cropped") 
            ? imageToCropName 
            : `Cropped: ${imageToCropName}`,
          width: img.naturalWidth || 500,
          height: img.naturalHeight || 500,
        });
        setIsCropping(false);
        setImageToCropSrc(null);
        setApplyingCrop(false);
      };
    } catch (err) {
      console.error("Failed to crop image:", err);
      setError("An error occurred while cropping the logo.");
      setApplyingCrop(false);
    }
  };

  // Phrases to show while generating to keep user engaged
  const loadingPhrases = [
    "Synthesizing vector pathways...",
    "Isolating brand focal points...",
    "Engaging aesthetic geometry...",
    "Refining edge contrast thresholds...",
    "Preparing professional print ratios..."
  ];

  const triggerLoadingAnimation = () => {
    let index = 0;
    setLoadingText(loadingPhrases[0]);
    const interval = setInterval(() => {
      index = (index + 1) % loadingPhrases.length;
      setLoadingText(loadingPhrases[index]);
    }, 2500);
    return interval;
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    const interval = triggerLoadingAnimation();

    try {
      const response = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, useHighQuality }),
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate logo");
      }

      const img = new Image();
      img.src = data.imageUrl;
      img.onload = () => {
        onLogoSelected({
          src: data.imageUrl,
          processedSrc: data.imageUrl,
          name: `AI Logo: ${prompt.substring(0, 20)}...`,
          width: img.naturalWidth || 512,
          height: img.naturalHeight || 512,
        });
      };
    } catch (err: any) {
      console.error(err);
      setError(
        err.message?.includes("GEMINI_API_KEY")
          ? "The Gemini API Key is missing. To generate custom AI logos, please add a valid GEMINI_API_KEY in the Secrets panel in Settings, or use our premium sample templates below."
          : err.message || "An error occurred during image generation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      startCropping(src, file.name);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const selectSampleLogo = (sample: typeof SAMPLE_LOGOS[0]) => {
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(sample.svg)}`;
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      onLogoSelected({
        src: dataUrl,
        processedSrc: dataUrl,
        name: `${sample.name} Template`,
        width: 400,
        height: 400,
      });
    };
  };

  if (isCropping && imageToCropSrc) {
    return (
      <div className="space-y-5" id="logo-cropping-workspace">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <Crop className="h-4.5 w-4.5 text-blue-400" />
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Crop & Adjust Logo</h3>
          </div>
          <button 
            onClick={() => { setIsCropping(false); setImageToCropSrc(null); }}
            className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1 rounded hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Drag the handles or adjust the bounding box below to isolate your logo artwork.
        </p>

        {/* Cropping Stage */}
        <div className="flex justify-center items-center py-4 bg-zinc-950/80 rounded-xl border border-white/5 relative min-h-[220px]">
          <div 
            ref={containerRef} 
            className="relative inline-block mx-auto max-w-full rounded-lg overflow-hidden select-none shadow-2xl"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img 
              src={imageToCropSrc} 
              alt="Source" 
              className="max-w-full max-h-[260px] block pointer-events-none"
              onLoad={handleImageLoad}
            />
            {/* Highlighted Crop Area with Shadow-based dark mask */}
            <div
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              className="absolute border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(9,9,11,0.72)] cursor-move z-10 touch-none"
              onMouseDown={(e) => handleMouseDown(e, "move")}
              onTouchStart={(e) => handleTouchStart(e, "move")}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Corner Resize Handles */}
              <div 
                className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-600 rounded-full cursor-nwse-resize z-20 shadow-md"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-nw"); }}
                onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, "resize-nw"); }}
              />
              <div 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-600 rounded-full cursor-nesw-resize z-20 shadow-md"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-ne"); }}
                onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, "resize-ne"); }}
              />
              <div 
                className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-600 rounded-full cursor-nesw-resize z-20 shadow-md"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-sw"); }}
                onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, "resize-sw"); }}
              />
              <div 
                className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-600 rounded-full cursor-nwse-resize z-20 shadow-md"
                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, "resize-se"); }}
                onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, "resize-se"); }}
              />
            </div>
          </div>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Aspect Ratio</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["free", "1:1", "4:3", "16:9"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleRatioChange(ratio)}
                className={`py-1.5 rounded-lg text-[10px] font-semibold border transition-all focus:outline-none cursor-pointer uppercase tracking-wider ${
                  aspectRatio === ratio
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                    : "bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {ratio === "free" ? "Free" : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Fine-Tuning Sliders */}
        <div className="space-y-3 bg-zinc-900/30 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            <Sliders className="h-3.5 w-3.5 text-zinc-500" />
            <span>Precision Fine-Tuning</span>
          </div>

          {/* Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-zinc-400">
              <span>Crop Width</span>
              <span className="font-mono">{Math.round(crop.width)}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={crop.width}
              onChange={(e) => {
                const newWidth = parseInt(e.target.value);
                let nextCrop = { ...crop, width: newWidth };
                if (crop.x + newWidth > 100) nextCrop.x = 100 - newWidth;
                if (aspectRatio !== "free") {
                  nextCrop = enforceRatio(nextCrop, aspectRatio, imageNaturalRatio);
                }
                setCrop(nextCrop);
              }}
              className="w-full slider-input cursor-pointer"
            />
          </div>

          {/* Height (only editable in free ratio) */}
          {aspectRatio === "free" && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-medium text-zinc-400">
                <span>Crop Height</span>
                <span className="font-mono">{Math.round(crop.height)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={crop.height}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value);
                  const nextCrop = { ...crop, height: newHeight };
                  if (crop.y + newHeight > 100) nextCrop.y = 100 - newHeight;
                  setCrop(nextCrop);
                }}
                className="w-full slider-input cursor-pointer"
              />
            </div>
          )}

          {/* X Offset */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-zinc-400">
              <span>Horizontal position (X)</span>
              <span className="font-mono">{Math.round(crop.x)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={100 - crop.width}
              value={crop.x}
              onChange={(e) => {
                const newX = parseInt(e.target.value);
                setCrop({ ...crop, x: newX });
              }}
              className="w-full slider-input cursor-pointer"
            />
          </div>

          {/* Y Offset */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-zinc-400">
              <span>Vertical position (Y)</span>
              <span className="font-mono">{Math.round(crop.y)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={100 - crop.height}
              value={crop.y}
              onChange={(e) => {
                const newY = parseInt(e.target.value);
                setCrop({ ...crop, y: newY });
              }}
              className="w-full slider-input cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={() => { setIsCropping(false); setImageToCropSrc(null); }}
            className="flex-1 py-2.5 rounded-lg font-semibold text-xs border border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={applyingCrop}
            className="flex-1 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 text-white bg-blue-600 hover:bg-blue-500 transition-all focus:outline-none shadow-md shadow-blue-900/20 cursor-pointer"
          >
            {applyingCrop ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Save & Apply Crop</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="logo-generator-panel">
      {/* Upload Zone */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3 block">
          Source Logo
        </label>
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={activeLogo && !activeLogo.name.includes("Template") && !activeLogo.name.includes("AI Logo") ? undefined : () => fileInputRef.current?.click()}
          className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ${
            isDragActive
              ? "border-blue-500 bg-blue-500/10"
              : activeLogo && !activeLogo.name.includes("Template") && !activeLogo.name.includes("AI Logo")
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60 cursor-pointer"
          }`}
          id="logo-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          {activeLogo && !activeLogo.name.includes("Template") && !activeLogo.name.includes("AI Logo") ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="p-2.5 bg-emerald-500/25 rounded-full text-emerald-400 border border-emerald-500/30">
                <Check className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">Logo Uploaded</p>
                <p className="text-[10px] text-zinc-400 truncate max-w-[180px] mx-auto mt-0.5">
                  {activeLogo.name}
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCropping(activeLogo.src, activeLogo.name)}
                  className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-200 flex items-center space-x-1 border border-white/5 cursor-pointer transition-all shadow-md"
                  id="crop-uploaded-logo-btn"
                >
                  <Crop className="h-3 w-3 text-blue-400" />
                  <span>Crop Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-200 flex items-center space-x-1 border border-white/5 cursor-pointer transition-all"
                >
                  <Upload className="h-3 w-3 text-zinc-400" />
                  <span>Replace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-zinc-400">
              <div className="w-12 h-12 bg-zinc-800/80 rounded-full flex items-center justify-center mb-3 border border-white/5 group-hover:bg-zinc-700">
                <Upload className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-xs font-semibold text-white">
                Drop your logo here, or browse
              </p>
              <p className="text-[10px] text-zinc-500">
                Supports PNG, SVG, or JPG up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Background Remover Option when active logo exists */}
      {activeLogo && onBgRemovalChange && bgRemoval && (
        <div className="border border-blue-500/10 bg-blue-950/10 rounded-2xl p-5 space-y-4 shadow-xl" id="ai-bg-remover-panel">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-500/10 rounded-lg text-blue-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">AI Background Isolation</h3>
                <p className="text-[9px] text-zinc-500 mt-0.5">Remove solid backgrounds from uploaded logos</p>
              </div>
            </div>
            {bgRemoval.enabled && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Active
              </span>
            )}
          </div>

          {aiRemoving ? (
            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-medium">
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                  <span>Scanning image geometry...</span>
                </span>
                <span className="font-mono text-blue-400">Color-key isolation...</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden relative border border-white/5">
                <div className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full animate-[loading_1.2s_ease-in-out_infinite]" style={{ width: "60%" }} />
              </div>
            </div>
          ) : bgRemoval.enabled ? (
            <div className="flex items-center justify-between gap-3 bg-zinc-950/40 border border-emerald-500/10 p-3 rounded-xl">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-10 h-10 rounded bg-zinc-900 border border-white/5 flex items-center justify-center relative p-1 shrink-0 overflow-hidden">
                  <img src={activeLogo.processedSrc || activeLogo.src} className="max-w-full max-h-full object-contain" alt="Processed thumbnail" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{activeLogo.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5 capitalize">
                    {bgRemoval.colorToKey} background removed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onBgRemovalChange({
                    ...bgRemoval,
                    enabled: false
                  });
                  window.dispatchEvent(
                    new CustomEvent("merch-mockup-notification", {
                      detail: {
                        text: "Background restored.",
                        type: "save"
                      }
                    })
                  );
                }}
                className="py-1.5 px-3 rounded-lg border border-zinc-700 hover:border-zinc-500 text-[10px] font-bold text-zinc-300 hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="h-3 w-3 text-red-400" />
                <span>Restore Background</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleMagicAiBackgroundRemoval}
                className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/10 hover:scale-[1.01] transition-all cursor-pointer"
                id="magic-ai-bg-remover-btn"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                <span>✨ Auto-Remove Background (Magic AI)</span>
              </button>
              <p className="text-[9px] text-zinc-500 text-center leading-normal">
                Detects dominant boundary colors and applies a custom transparency alpha mask instantly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Generator Panel */}
      <div className="border border-white/5 bg-zinc-950/45 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-blue-500/10 rounded-lg text-blue-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">AI Creative Studio</h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">Generate production-grade vector brand graphics</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAiGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your brand artwork (e.g., 'Minimalist mountain peak crest with glowing sun', 'cyber fox head in neon blue')"
              rows={3}
              className="w-full text-xs border border-white/10 rounded-xl p-3.5 bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500 transition-all leading-relaxed"
              disabled={loading}
              id="ai-prompt-input"
            />
            
            {/* Quick Inspiration Prompt Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[9px] text-zinc-500 self-center font-medium mr-1 uppercase tracking-wider">Inspiration:</span>
              {[
                { label: "⛰️ Mountain Crest", text: "Minimalist geometric mountain peak crest with glowing sun" },
                { label: "🦊 Cyber Fox", text: "Sleek geometric head of a cyber fox, vector logo, neon cyan accents" },
                { label: "☕ Retro Brew", text: "Vintage circular coffee badge logo with steaming mug, white vector" },
                { label: "🌸 Zen Lotus", text: "Modern symmetric line-art lotus flower, organic wellness emblem" }
              ].map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  disabled={loading}
                  onClick={() => setPrompt(tag.text)}
                  className="px-2 py-1 rounded-full text-[9px] bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-850 cursor-pointer transition-all select-none focus:outline-none"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector visual card grid */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Aesthetic Style
              </label>
              <span className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 capitalize font-mono">
                {style} Theme
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "modern" as LogoStyle, title: "Modern Minimal", desc: "Clean shapes, thin lines" },
                { value: "vector" as LogoStyle, title: "Flat Vector", desc: "Vibrant solid shapes" },
                { value: "vintage" as LogoStyle, title: "Vintage Badge", desc: "Circular badge, retro label" },
                { value: "futuristic" as LogoStyle, title: "Futuristic Tech", desc: "Neon, sharp angles" }
              ].map((opt) => {
                const isSelected = style === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setStyle(opt.value)}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer select-none focus:outline-none transition-all flex flex-col justify-between h-16 ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/80 ring-2 ring-blue-500/20"
                        : "bg-zinc-900/50 border-white/5 hover:border-zinc-700 hover:bg-zinc-850"
                    }`}
                  >
                    <span className={`text-[10px] font-bold block ${isSelected ? "text-blue-400" : "text-zinc-200"}`}>
                      {opt.title}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-medium block mt-0.5 leading-normal">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extra options and Generate Trigger */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <label className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-zinc-400 font-medium">
              <input
                type="checkbox"
                checked={useHighQuality}
                onChange={(e) => setUseHighQuality(e.target.checked)}
                className="rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
                disabled={loading}
              />
              <span>High Resolution (1K Web Assembly)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all cursor-pointer ${
              loading || !prompt.trim() ? "opacity-50 cursor-not-allowed" : "shadow-md shadow-blue-900/20 hover:scale-[1.01]"
            }`}
            id="generate-logo-btn"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>{loadingText}</span>
              </div>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                <span>Generate Brand Artwork</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-lg text-[11px] leading-relaxed">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Preset / Sample Templates */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          <FileImage className="h-4 w-4 text-zinc-500" />
          <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Free Sample Logos</h4>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_LOGOS.map((sample) => {
            const isActive = activeLogo?.name === `${sample.name} Template`;
            return (
              <button
                key={sample.id}
                onClick={() => selectSampleLogo(sample)}
                className={`flex flex-col items-center p-2 bg-zinc-900/40 border rounded-xl hover:bg-zinc-900/80 transition-all text-center focus:outline-none ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-zinc-900"
                    : "border-white/5"
                }`}
                id={`sample-logo-${sample.id}`}
              >
                <div 
                  className="w-12 h-12 flex items-center justify-center bg-zinc-950 rounded-lg border border-white/5 mb-1.5 p-1"
                  dangerouslySetInnerHTML={{ __html: sample.svg }}
                />
                <span className="text-[9px] font-semibold text-zinc-400 truncate w-full">
                  {sample.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
