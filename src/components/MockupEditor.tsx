/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { Move, Info, ZoomIn, ZoomOut, Maximize, Hand, MousePointer, Grid } from "lucide-react";
import { ProductPreset } from "../data/templates";
import { LogoTransform, LogoData, MockupScene, PunchlineSettings } from "../types";
import { loadImage } from "../utils/imageUtils";

interface MockupEditorProps {
  product: ProductPreset;
  color: string;
  logo: LogoData | null;
  transform: LogoTransform;
  onTransformChange: (transform: LogoTransform) => void;
  customScene: MockupScene | null;
  isQuickPreview?: boolean;
  isAdjusting?: boolean;
  punchline?: PunchlineSettings;
}

export default function MockupEditor({
  product,
  color,
  logo,
  transform,
  onTransformChange,
  customScene,
  isQuickPreview = false,
  isAdjusting = false,
  punchline,
}: MockupEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive Logo Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [logoStartPos, setLogoStartPos] = useState({ x: 0, y: 0 });
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [isWireframeMode, setIsWireframeMode] = useState(false);

  // Drag modes: "idle", "move", "resize", "rotate"
  const [dragMode, setDragMode] = useState<"idle" | "move" | "resize" | "rotate">("idle");
  const [startAngle, setStartAngle] = useState(0);
  const [logoStartRotation, setLogoStartRotation] = useState(0);
  const [logoStartScale, setLogoStartScale] = useState(1);
  const [startDistance, setStartDistance] = useState(1);

  // Advanced Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [editorMode, setEditorMode] = useState<"edit" | "pan">("edit");
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });

  // Hardcoded viewport width/height for coordinate resolution
  const VIEWPORT_SIZE = 800;

  // Wheel Zoom event handler (zooms in on cursor position)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * VIEWPORT_SIZE;
      const mouseY = ((e.clientY - rect.top) / rect.height) * VIEWPORT_SIZE;

      setZoom((prevZoom) => {
        // Zoom factors: deltaY < 0 is scroll up (Zoom In), else scroll down (Zoom Out)
        const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const nextZoom = Math.max(1, Math.min(5, prevZoom * zoomFactor));
        
        if (nextZoom === prevZoom) return prevZoom;
        if (nextZoom === 1) {
          setPan({ x: 0, y: 0 });
          return 1;
        }

        // Adjust pan offset to zoom dynamically towards mouse pointer location
        setPan((currentPan) => {
          const artboardX = (mouseX - currentPan.x) / prevZoom;
          const artboardY = (mouseY - currentPan.y) / prevZoom;

          const newPanX = mouseX - artboardX * nextZoom;
          const newPanY = mouseY - artboardY * nextZoom;

          // Limit panning bounds
          const maxPanLimit = VIEWPORT_SIZE * (nextZoom - 1);
          return {
            x: Math.max(-maxPanLimit, Math.min(0, newPanX)),
            y: Math.max(-maxPanLimit, Math.min(0, newPanY)),
          };
        });

        return nextZoom;
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Keyboard Shortcuts (Space for wireframe overlay, Arrow keys for logo nudge)
  useEffect(() => {
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

      if (e.key === " ") {
        e.preventDefault();
        setIsWireframeMode((prev) => !prev);
        
        // Dispatch Custom Event for a HUD notification toast
        const event = new CustomEvent("merch-mockup-notification", {
          detail: { 
            text: `Wireframe Mode: ${!isWireframeMode ? "ENABLED" : "DISABLED"}`, 
            type: "info" 
          },
        });
        window.dispatchEvent(event);
      }

      if (logo) {
        let dx = 0;
        let dy = 0;
        const nudgeAmount = e.shiftKey ? 5 : 1; // standard shift modifier for larger increments

        if (e.key === "ArrowUp") {
          dy = -nudgeAmount;
        } else if (e.key === "ArrowDown") {
          dy = nudgeAmount;
        } else if (e.key === "ArrowLeft") {
          dx = -nudgeAmount;
        } else if (e.key === "ArrowRight") {
          dx = nudgeAmount;
        }

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          onTransformChange({
            ...transform,
            x: parseFloat(Math.max(-120, Math.min(120, transform.x + dx)).toFixed(2)),
            y: parseFloat(Math.max(-120, Math.min(120, transform.y + dy)).toFixed(2)),
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [logo, transform, onTransformChange, isWireframeMode]);

  // Main Canvas Render loop
  useEffect(() => {
    let active = true;

    async function drawCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

      // Save base context state
      ctx.save();
      
      // Apply Zoom and Pan Context Transformation
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      try {
        let sceneImg: HTMLImageElement | null = null;
        if (customScene && customScene.imageUrl && !(isQuickPreview || isAdjusting)) {
          try {
            sceneImg = await loadImage(customScene.imageUrl);
          } catch (e) {
            console.error("Failed to load custom scene image, falling back to base product mockup:", e);
          }
        }

        if (sceneImg) {
          if (isWireframeMode) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.drawImage(sceneImg, 0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
            ctx.restore();

            ctx.save();
            ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
            ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
            ctx.restore();
          } else {
            // 1. Draw AI generated lifestyle scene
            ctx.drawImage(sceneImg, 0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
          }
        } else {
          // 2. Draw Vector dynamic color template SVG
          let svgString = product.getSvg(color);
          if (isWireframeMode) {
            svgString = svgString.replace(new RegExp(`fill="${color}"`, 'g'), 'fill="rgba(15, 23, 42, 0.55)" stroke="rgba(56, 189, 248, 0.95)" stroke-width="2.5"');
            svgString = svgString.replace(/fill="rgba\(0, 0, 0, 0\.08\)"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1"');
            svgString = svgString.replace(/fill="rgba\(0, 0, 0, 0\.12\)"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1"');
            svgString = svgString.replace(/fill="rgba\(0, 0, 0, 0\.15\)"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"');
            svgString = svgString.replace(/fill="rgba\(0, 0, 0, 0\.25\)"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.5)" stroke-width="1.5"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.15\)"/g, 'stroke="rgba(56, 189, 248, 0.75)" stroke-width="2"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.25\)"/g, 'stroke="rgba(56, 189, 248, 0.85)" stroke-width="2"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.2\)"/g, 'stroke="rgba(56, 189, 248, 0.7)" stroke-width="2"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.1\)"/g, 'stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.04\)"/g, 'stroke="rgba(56, 189, 248, 0.25)" stroke-width="1"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.06\)"/g, 'stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"');
            svgString = svgString.replace(/stroke="rgba\(0,0,0,0\.12\)"/g, 'stroke="rgba(56, 189, 248, 0.4)" stroke-width="1.5"');
            svgString = svgString.replace(/stroke="rgba\(255,255,255,0\.2\)"/g, 'stroke="rgba(56, 189, 248, 0.5)" stroke-dasharray="3,3"');
            svgString = svgString.replace(/stroke="rgba\(255,255,255,0\.08\)"/g, 'stroke="rgba(56, 189, 248, 0.3)" stroke-dasharray="3,3"');
            svgString = svgString.replace(/fill="#111"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.5)"');
            svgString = svgString.replace(/fill="#3B2314"/g, 'fill="none" stroke="rgba(56, 189, 248, 0.3)"');
          }
          const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
          const productImg = await loadImage(svgUrl);
          ctx.drawImage(productImg, 0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
        }

        // Draw guidelines (printable boundary)
        const printArea = customScene
          ? { x: 20, y: 20, width: 60, height: 60 } // Default for custom scene
          : product.printArea;

        const pX = (printArea.x / 100) * VIEWPORT_SIZE;
        const pY = (printArea.y / 100) * VIEWPORT_SIZE;
        const pW = (printArea.width / 100) * VIEWPORT_SIZE;
        const pH = (printArea.height / 100) * VIEWPORT_SIZE;

        if (logo && active) {
          if (showGuidelines) {
            // Printable Area Bounding Box with rounded corners
            ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; // blue accent
            ctx.lineWidth = 2 / zoom; // Maintain consistent guideline visual stroke width
            ctx.setLineDash([6 / zoom, 4 / zoom]);
            ctx.strokeRect(pX, pY, pW, pH);
            ctx.setLineDash([]);
            
            // Text Label
            ctx.fillStyle = "rgba(59, 130, 246, 0.75)";
            ctx.font = `bold ${Math.max(8, 12 / zoom)}px sans-serif`;
            ctx.fillText("PRINT AREA", pX + 8 / zoom, pY + 18 / zoom);
          }

          if (logo.processedSrc) {
            try {
              // 3. Draw Logo Image with transforms
              const logoImg = await loadImage(logo.processedSrc);
              
              // Fit logo proportionally inside the print area base size
              const logoAspect = logo.width / logo.height || 1;
              let logoW = pW * 0.7;
              let logoH = logoW / logoAspect;
              if (logoH > pH * 0.7) {
                logoH = pH * 0.7;
                logoW = logoH * logoAspect;
              }

              // Apply scale
              const finalW = logoW * transform.scale;
              const finalH = logoH * transform.scale;

              // Compute absolute center of logo
              const centerX = pX + pW / 2;
              const centerY = pY + pH / 2;
              
              // Offset position by transform values (defined as percentages of print box dimensions)
              const targetX = centerX + (transform.x / 100) * pW;
              const targetY = centerY + (transform.y / 100) * pH;

              ctx.save();
              // Apply opacity and blending
              ctx.globalAlpha = transform.opacity;
              ctx.globalCompositeOperation = (isQuickPreview || isAdjusting) ? "source-over" : transform.blendMode;

              // Apply Smart Crop if active
              if (transform.smartCrop) {
                ctx.beginPath();
                ctx.rect(pX, pY, pW, pH);
                ctx.clip();
              }

              // Apply Translate & Rotate
              ctx.translate(targetX, targetY);
              if (transform.rotation !== 0) {
                ctx.rotate((transform.rotation * Math.PI) / 180);
              }

              // Draw the centered logo
              ctx.drawImage(logoImg, -finalW / 2, -finalH / 2, finalW, finalH);

              // Draw a selection border around logo when dragging or active
              ctx.restore();
              
              if (showGuidelines) {
                ctx.save();
                ctx.translate(targetX, targetY);
                if (transform.rotation !== 0) {
                  ctx.rotate((transform.rotation * Math.PI) / 180);
                }
                ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
                ctx.lineWidth = 1.5 / zoom; // Maintain consistent guideline visual stroke width
                ctx.strokeRect(-finalW / 2 - 4 / zoom, -finalH / 2 - 4 / zoom, finalW + 8 / zoom, finalH + 8 / zoom);
                
                // Drag handles scaled inversely to zoom so they remain clickable/interactive
                const size = 6 / zoom;
                const offset = size / 2;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(-finalW / 2 - 4 / zoom - offset, -finalH / 2 - 4 / zoom - offset, size, size);
                ctx.strokeRect(-finalW / 2 - 4 / zoom - offset, -finalH / 2 - 4 / zoom - offset, size, size);
                ctx.fillRect(finalW / 2 + 4 / zoom - offset, -finalH / 2 - 4 / zoom - offset, size, size);
                ctx.strokeRect(finalW / 2 + 4 / zoom - offset, -finalH / 2 - 4 / zoom - offset, size, size);
                ctx.fillRect(-finalW / 2 - 4 / zoom - offset, finalH / 2 + 4 / zoom - offset, size, size);
                ctx.strokeRect(-finalW / 2 - 4 / zoom - offset, finalH / 2 + 4 / zoom - offset, size, size);
                ctx.fillRect(finalW / 2 + 4 / zoom - offset, finalH / 2 + 4 / zoom - offset, size, size);
                ctx.strokeRect(finalW / 2 + 4 / zoom - offset, finalH / 2 + 4 / zoom - offset, size, size);

                // Rotate stick & handle
                ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
                ctx.lineWidth = 1.5 / zoom;
                ctx.beginPath();
                ctx.moveTo(0, -finalH / 2 - 4 / zoom);
                ctx.lineTo(0, -finalH / 2 - 24 / zoom);
                ctx.stroke();

                ctx.fillStyle = "#3b82f6";
                ctx.beginPath();
                ctx.arc(0, -finalH / 2 - 24 / zoom, 5 / zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#FFFFFF";
                ctx.stroke();

                ctx.restore();
              }
            } catch (logoLoadErr) {
              console.error("Failed to draw logo artwork layer:", logoLoadErr);
            }
          }
        }

        // 3.5 Draw Custom Slogan / Punchline Message overlay
        if (punchline && punchline.text && active) {
          ctx.save();
          
          // Apply opacity
          ctx.globalAlpha = punchline.opacity;
          
          // Apply smart crop clip if active
          if (transform.smartCrop) {
            ctx.beginPath();
            ctx.rect(pX, pY, pW, pH);
            ctx.clip();
          }
          
          // Compute target position relative to the print box
          const pCenterX = pX + pW / 2;
          const pCenterY = pY + pH / 2;
          const targetX = pCenterX + (punchline.offsetX / 100) * pW;
          const targetY = pCenterY + (punchline.offsetY / 100) * pH;
          
          ctx.translate(targetX, targetY);
          if (punchline.rotation !== 0) {
            ctx.rotate((punchline.rotation * Math.PI) / 180);
          }
          
          // Select font family
          let fontStr = "";
          const finalSize = (punchline.fontSize * (pW / 300)); // relative to print box width
          const boldPrefix = punchline.fontFamily === "grotesk" || punchline.fontFamily === "sans" ? "bold " : "";
          const italicPrefix = punchline.fontFamily === "handwritten" ? "italic " : "";
          
          switch (punchline.fontFamily) {
            case "serif":
              fontStr = `${boldPrefix}${italicPrefix}${finalSize}px "Playfair Display", Georgia, serif`;
              break;
            case "mono":
              fontStr = `${boldPrefix}${finalSize}px "JetBrains Mono", monospace`;
              break;
            case "grotesk":
              fontStr = `900 ${finalSize}px "Space Grotesk", sans-serif`;
              break;
            case "handwritten":
              fontStr = `500 ${finalSize}px cursive, sans-serif`;
              break;
            default:
              fontStr = `${boldPrefix}${finalSize}px "Inter", sans-serif`;
          }
          
          ctx.font = fontStr;
          ctx.fillStyle = punchline.color;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          const textToDraw = punchline.uppercase ? punchline.text.toUpperCase() : punchline.text;
          
          if (punchline.arcStrength !== 0) {
            // Curved text layout on an arc
            const chars = textToDraw.split("");
            const numChars = chars.length;
            
            // Base radius is inversely proportional to arcStrength
            const strength = punchline.arcStrength / 100; // range from -1 to 1
            const absStrength = Math.abs(strength);
            const radius = (pW * 0.95) / (absStrength + 0.05);
            
            // Letter spacing in radians
            const charSpacingAngle = (finalSize * (0.8 + punchline.tracking / 15)) / radius;
            const totalAngle = charSpacingAngle * (numChars - 1);
            
            // Positive strength arches down, negative arches up
            const directionSign = strength < 0 ? -1 : 1;
            const startAngle = -totalAngle / 2;
            
            for (let i = 0; i < numChars; i++) {
              const charAngle = startAngle + i * charSpacingAngle;
              
              ctx.save();
              // Offset origin to the circle center, rotate, then translate back
              const radialOffsetY = -directionSign * radius;
              ctx.translate(0, radialOffsetY);
              ctx.rotate(charAngle * directionSign);
              ctx.translate(0, -radialOffsetY);
              
              ctx.fillText(chars[i], 0, 0);
              ctx.restore();
            }
          } else {
            // Flat text layout
            if (punchline.tracking > 0) {
              const chars = textToDraw.split("");
              const numChars = chars.length;
              
              // Measure characters to center the text precisely
              const charWidths = chars.map(c => ctx.measureText(c).width);
              const trackingPx = punchline.tracking * (pW / 300) * 1.5;
              const totalWidth = charWidths.reduce((a, b) => a + b, 0) + trackingPx * (numChars - 1);
              
              let currentX = -totalWidth / 2;
              for (let i = 0; i < numChars; i++) {
                const charW = charWidths[i];
                ctx.fillText(chars[i], currentX + charW / 2, 0);
                currentX += charW + trackingPx;
              }
            } else {
              ctx.fillText(textToDraw, 0, 0);
            }
          }
          
          ctx.restore();
        }
      } catch (err) {
        console.error("Error drawing mockup scene:", err);
      }

      // Draw technical wireframe / CAD grid on top if wireframe mode is active
      if (isWireframeMode) {
        ctx.save();
        
        // Draw grid
        ctx.strokeStyle = "rgba(56, 189, 248, 0.12)"; // neon sky-400
        ctx.lineWidth = 1 / zoom;
        const gridSize = 40;
        
        // Vertical lines
        for (let x = 0; x <= VIEWPORT_SIZE; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, VIEWPORT_SIZE);
          ctx.stroke();
        }
        // Horizontal lines
        for (let y = 0; y <= VIEWPORT_SIZE; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(VIEWPORT_SIZE, y);
          ctx.stroke();
        }
        
        // Draw some concentric radar/CAD lines for tech styling
        ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
        ctx.beginPath();
        ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 80, 0, Math.PI * 2);
        ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 160, 0, Math.PI * 2);
        ctx.arc(VIEWPORT_SIZE / 2, VIEWPORT_SIZE / 2, 240, 0, Math.PI * 2);
        ctx.stroke();

        // Draw HUD overlay in the corner of the canvas
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 13px monospace";
        ctx.fillText("WIREFRAME VIEW (CAD)", 20, 35);
        
        // Add a pulsing cyan dot
        ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
        ctx.beginPath();
        ctx.arc(195, 31, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(195, 31, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw Quick Preview HUD badge if active
      if (isQuickPreview || isAdjusting) {
        ctx.save();
        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1.5;
        
        const badgeX = VIEWPORT_SIZE - 170;
        const badgeY = 20;
        const badgeW = 150;
        const badgeH = 26;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();
        
        // Pulse amber indicator
        const pulse = Math.abs(Math.sin(Date.now() / 200)) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
        ctx.beginPath();
        ctx.arc(badgeX + 15, badgeY + 13, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 10px monospace";
        ctx.fillText(isAdjusting ? "FAST ADJUSTMENT" : "QUICK PREVIEW", badgeX + 26, badgeY + 16);
        ctx.restore();
      }

      // Restore base context state
      ctx.restore();
    }

    drawCanvas();

    return () => {
      active = false;
    };
  }, [product, color, logo, transform, customScene, showGuidelines, zoom, pan, isWireframeMode, isQuickPreview, isAdjusting, punchline]);

  // Helper to resolve client coordinates on raw canvas viewport dimensions
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale back to 800x800 raw coordinate resolution
    const x = ((clientX - rect.left) / rect.width) * VIEWPORT_SIZE;
    const y = ((clientY - rect.top) / rect.height) * VIEWPORT_SIZE;

    return { x, y };
  };

  // Helper to map raw viewport coords back into transformed artboard space
  const getArtboardCoordinates = (canvasCoords: { x: number; y: number }) => {
    return {
      x: (canvasCoords.x - pan.x) / zoom,
      y: (canvasCoords.y - pan.y) / zoom,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const rawCoords = getCanvasCoordinates(e);
    if (!rawCoords) return;

    let clickedLogo = false;

    if (logo) {
      // Map clicked point into zoom/panned artboard coordinates
      const coords = getArtboardCoordinates(rawCoords);
      const printArea = customScene ? { x: 20, y: 20, width: 60, height: 60 } : product.printArea;
      const pX = (printArea.x / 100) * VIEWPORT_SIZE;
      const pY = (printArea.y / 100) * VIEWPORT_SIZE;
      const pW = (printArea.width / 100) * VIEWPORT_SIZE;
      const pH = (printArea.height / 100) * VIEWPORT_SIZE;

      const centerX = pX + pW / 2;
      const centerY = pY + pH / 2;
      
      const targetX = centerX + (transform.x / 100) * pW;
      const targetY = centerY + (transform.y / 100) * pH;

      const logoAspect = logo.width / logo.height || 1;
      let logoW = pW * 0.7 * transform.scale;
      let logoH = logoW / logoAspect;

      const finalW = logoW;
      const finalH = logoH;

      // Translate clicked coordinates relative to logo's center
      const relX = coords.x - targetX;
      const relY = coords.y - targetY;
      
      // Unrotate the click coordinate to logo's local unrotated system
      const rad = (-transform.rotation * Math.PI) / 180;
      const localX = relX * Math.cos(rad) - relY * Math.sin(rad);
      const localY = relX * Math.sin(rad) + relY * Math.cos(rad);

      if (showGuidelines) {
        const handleRadius = 16 / zoom; // generous touch target radius

        // 1. Check Rotate Handle
        const rotateHandleCenter = { x: 0, y: -finalH / 2 - 24 / zoom };
        const distToRotate = Math.hypot(localX - rotateHandleCenter.x, localY - rotateHandleCenter.y);
        if (distToRotate < handleRadius) {
          setIsDragging(true);
          setDragMode("rotate");
          setDragStart(coords);
          const startAngleRad = Math.atan2(relY, relX);
          setStartAngle(startAngleRad);
          setLogoStartRotation(transform.rotation);
          return;
        }

        // 2. Check Corner Resize Handles
        const corners = [
          { name: "tl", x: -finalW / 2 - 4 / zoom, y: -finalH / 2 - 4 / zoom },
          { name: "tr", x: finalW / 2 + 4 / zoom, y: -finalH / 2 - 4 / zoom },
          { name: "bl", x: -finalW / 2 - 4 / zoom, y: finalH / 2 + 4 / zoom },
          { name: "br", x: finalW / 2 + 4 / zoom, y: finalH / 2 + 4 / zoom }
        ];

        for (const corner of corners) {
          const dist = Math.hypot(localX - corner.x, localY - corner.y);
          if (dist < handleRadius) {
            setIsDragging(true);
            setDragMode("resize");
            setDragStart(coords);
            setLogoStartScale(transform.scale);
            const startDist = Math.hypot(relX, relY);
            setStartDistance(startDist);
            return;
          }
        }
      }

      // 3. Check Logo Body Move click
      clickedLogo = 
        localX >= -finalW / 2 - 10 &&
        localX <= finalW / 2 + 10 &&
        localY >= -finalH / 2 - 10 &&
        localY <= finalH / 2 + 10;
    }

    // Determine whether to handle panning or logo dragging
    if (editorMode === "pan" || (zoom > 1 && !clickedLogo)) {
      setIsPanning(true);
      setPanStart(rawCoords);
      setPanStartOffset({ x: pan.x, y: pan.y });
    } else if (clickedLogo && logo) {
      const coords = getArtboardCoordinates(rawCoords);
      setIsDragging(true);
      setDragMode("move");
      setDragStart(coords);
      setLogoStartPos({ x: transform.x, y: transform.y });
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rawCoords = getCanvasCoordinates(e);
    if (!rawCoords) return;

    if (isPanning) {
      const dx = rawCoords.x - panStart.x;
      const dy = rawCoords.y - panStart.y;

      const maxPanLimit = VIEWPORT_SIZE * (zoom - 1);
      const boundedX = Math.max(-maxPanLimit, Math.min(0, panStartOffset.x + dx));
      const boundedY = Math.max(-maxPanLimit, Math.min(0, panStartOffset.y + dy));

      setPan({ x: boundedX, y: boundedY });
      return;
    }

    if (!isDragging || !logo) return;
    const coords = getArtboardCoordinates(rawCoords);

    const printArea = customScene ? { x: 20, y: 20, width: 60, height: 60 } : product.printArea;
    const pW = (printArea.width / 100) * VIEWPORT_SIZE;
    const pH = (printArea.height / 100) * VIEWPORT_SIZE;

    if (dragMode === "move") {
      // Delta movement inside artboard space
      const dx = coords.x - dragStart.x;
      const dy = coords.y - dragStart.y;

      const pctDx = (dx / pW) * 100;
      const pctDy = (dy / pH) * 100;

      const newX = Math.max(-120, Math.min(120, logoStartPos.x + pctDx));
      const newY = Math.max(-120, Math.min(120, logoStartPos.y + pctDy));

      onTransformChange({
        ...transform,
        x: parseFloat(newX.toFixed(2)),
        y: parseFloat(newY.toFixed(2)),
      });
    } else if (dragMode === "rotate") {
      const pX = (printArea.x / 100) * VIEWPORT_SIZE;
      const pY = (printArea.y / 100) * VIEWPORT_SIZE;
      const centerX = pX + pW / 2;
      const centerY = pY + pH / 2;
      
      const targetX = centerX + (transform.x / 100) * pW;
      const targetY = centerY + (transform.y / 100) * pH;

      const currentAngleRad = Math.atan2(coords.y - targetY, coords.x - targetX);
      const angleDiffRad = currentAngleRad - startAngle;
      let angleDiffDeg = (angleDiffRad * 180) / Math.PI;

      let newRot = logoStartRotation + angleDiffDeg;
      
      const nativeEvent = (e as any).nativeEvent || e;
      if (nativeEvent.shiftKey) {
        newRot = Math.round(newRot / 15) * 15;
      } else {
        newRot = Math.round(newRot);
      }

      onTransformChange({
        ...transform,
        rotation: newRot,
      });
    } else if (dragMode === "resize") {
      const pX = (printArea.x / 100) * VIEWPORT_SIZE;
      const pY = (printArea.y / 100) * VIEWPORT_SIZE;
      const centerX = pX + pW / 2;
      const centerY = pY + pH / 2;
      
      const targetX = centerX + (transform.x / 100) * pW;
      const targetY = centerY + (transform.y / 100) * pH;

      const relX = coords.x - targetX;
      const relY = coords.y - targetY;
      const currentDistance = Math.hypot(relX, relY);

      let newScale = logoStartScale * (currentDistance / startDistance);
      newScale = Math.max(0.1, Math.min(4.0, newScale));
      newScale = parseFloat(newScale.toFixed(2));

      onTransformChange({
        ...transform,
        scale: newScale,
      });
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsPanning(false);
    setDragMode("idle");
  };

  // Dedicated Button Actions
  const handleZoomIn = () => {
    setZoom((prev) => {
      const next = Math.min(5, prev + 0.5);
      if (next === prev) return prev;
      
      // Zoom keeping current viewport center as anchor
      const center = VIEWPORT_SIZE / 2;
      setPan((currentPan) => {
        const artboardCenterX = (center - currentPan.x) / prev;
        const artboardCenterY = (center - currentPan.y) / prev;
        
        const newPanX = center - artboardCenterX * next;
        const newPanY = center - artboardCenterY * next;
        
        const maxPanLimit = VIEWPORT_SIZE * (next - 1);
        return {
          x: Math.max(-maxPanLimit, Math.min(0, newPanX)),
          y: Math.max(-maxPanLimit, Math.min(0, newPanY)),
        };
      });
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, prev - 0.5);
      if (next === prev) return prev;
      if (next === 1) {
        setPan({ x: 0, y: 0 });
        return 1;
      }

      // Zoom keeping current viewport center as anchor
      const center = VIEWPORT_SIZE / 2;
      setPan((currentPan) => {
        const artboardCenterX = (center - currentPan.x) / prev;
        const artboardCenterY = (center - currentPan.y) / prev;
        
        const newPanX = center - artboardCenterX * next;
        const newPanY = center - artboardCenterY * next;
        
        const maxPanLimit = VIEWPORT_SIZE * (next - 1);
        return {
          x: Math.max(-maxPanLimit, Math.min(0, newPanX)),
          y: Math.max(-maxPanLimit, Math.min(0, newPanY)),
        };
      });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-[#121217] rounded-2xl border border-white/5 overflow-hidden relative shadow-2xl">
      {/* Editor Header Toolbar */}
      <div className="bg-zinc-950/40 border-b border-white/5 px-5 py-3 flex items-center justify-between z-10">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {customScene ? "Lifestyle Scene Editor" : "Flat Mockup Canvas"}
          </h2>
          <p className="text-[10px] text-zinc-500 font-medium">
            {customScene ? "Custom AI Generated Scene" : `3D-feel Vector template • Base ${color}`}
          </p>
        </div>
        
        {logo && (
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                setIsWireframeMode(!isWireframeMode);
                const event = new CustomEvent("merch-mockup-notification", {
                  detail: { 
                    text: `Wireframe Mode: ${!isWireframeMode ? "ENABLED" : "DISABLED"}`, 
                    type: "info" 
                  },
                });
                window.dispatchEvent(event);
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border cursor-pointer focus:outline-none select-none ${
                isWireframeMode
                  ? "bg-sky-600/20 text-sky-400 border-sky-500/30"
                  : "bg-zinc-900 text-zinc-400 border-white/5 hover:text-zinc-200"
              }`}
              title="Toggle Wireframe Overlay Mode [Spacebar]"
              id="toggle-wireframe-btn"
            >
              <Grid className="h-3 w-3" />
              <span>Wireframe (Space)</span>
            </button>

            <label className="flex items-center space-x-1.5 text-xs text-zinc-400 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGuidelines}
                onChange={(e) => setShowGuidelines(e.target.checked)}
                className="rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span>Overlay Guidelines</span>
            </label>

            <label className="flex items-center space-x-1.5 text-xs text-zinc-400 font-medium cursor-pointer select-none" id="layer-mask-toggle-label">
              <input
                type="checkbox"
                checked={transform.smartCrop || false}
                onChange={(e) => {
                  onTransformChange({
                    ...transform,
                    smartCrop: e.target.checked
                  });
                  const event = new CustomEvent("merch-mockup-notification", {
                    detail: { 
                      text: `Layer Mask: ${e.target.checked ? "RESTRICTED TO PRINT AREA" : "UNRESTRICTED"}`, 
                      type: "info" 
                    },
                  });
                  window.dispatchEvent(event);
                }}
                className="rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5"
                id="layer-mask-checkbox"
              />
              <span>Apply Layer Mask</span>
            </label>
          </div>
        )}
      </div>

      {/* Main Stage viewport */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 bg-transparent relative min-h-[350px] md:min-h-[450px]"
        id="canvas-stage-wrapper"
      >
        <div className="relative aspect-square w-full max-w-[440px] md:max-w-[480px] rounded-2xl bg-zinc-900 shadow-2xl border border-white/5 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className={`w-full h-full block ${
              editorMode === "pan"
                ? "cursor-move"
                : isDragging
                ? "cursor-grabbing"
                : logo
                ? "cursor-grab"
                : "cursor-default"
            }`}
          />

          {/* Interactive Zoom and Pan Control Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            {/* Left side Mode Selector (Active if a logo is present) */}
            {logo && (
              <div className="flex items-center bg-zinc-950/95 border border-white/10 rounded-lg p-0.5 shadow-xl pointer-events-auto">
                <button
                  onClick={() => setEditorMode("edit")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    editorMode === "edit"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                  title="Logo Placement Mode (🎯)"
                >
                  <MousePointer className="h-3 w-3" />
                  <span>Move Logo</span>
                </button>
                <button
                  onClick={() => setEditorMode("pan")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                    editorMode === "pan"
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                  title="Viewport Panning Mode (🔍)"
                >
                  <Hand className="h-3 w-3" />
                  <span>Pan View</span>
                </button>
              </div>
            )}

            <div />

            {/* Right side Zoom Controllers */}
            <div className="flex items-center space-x-1.5 bg-zinc-950/95 border border-white/10 rounded-lg p-1 shadow-xl pointer-events-auto">
              {/* Zoom % Indicator */}
              <span className="text-[10px] font-mono font-bold text-zinc-300 px-2 select-none">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              {(zoom > 1 || pan.x !== 0 || pan.y !== 0) && (
                <button
                  onClick={handleResetZoom}
                  className="p-1 rounded hover:bg-zinc-900 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/10"
                  title="Reset Zoom & Pan"
                >
                  <Maximize className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Helper visual hints when empty */}
          {!logo && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center pointer-events-none animate-fadeIn">
              <div className="bg-zinc-950 p-3.5 rounded-full shadow-xl border border-white/5 text-blue-400 mb-3 animate-pulse">
                <Move className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-white text-sm">Interactive Artboard</h4>
              <p className="text-xs text-zinc-400 max-w-[240px] mt-1 leading-relaxed">
                Add a logo from the sidebar to start positioning, resizing, and rotating directly on the product!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Footer / Info Tips */}
      <div className="bg-zinc-950/40 border-t border-white/5 px-5 py-2.5 flex items-center space-x-2 text-[11px] text-zinc-500">
        <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <span>
          {logo
            ? zoom > 1
              ? "Tip: Drag the background or switch to 'Pan View' to explore details. Scroll wheel supported."
              : "Tip: Use the zoom buttons or your mouse wheel to inspect logo details up-close."
            : "Tip: You can change garment colors or generate fully custom lifestyle backgrounds via AI."}
        </span>
      </div>
    </div>
  );
}
