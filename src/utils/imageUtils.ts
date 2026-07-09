/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper to load an image source and return an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Image source URL is empty or null"));
      return;
    }
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    // Avoid CORS issues for base64 and standard URLs
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error("Failed to load image:", src.substring(0, 50) + "...");
      reject(err);
    };
    img.src = src;
  });
}

/**
 * Remove solid color backgrounds from an image on the client-side
 */
export async function removeImageBackground(
  imageSrc: string,
  keyColor: "white" | "black" | "custom",
  customColorHex: string,
  tolerance: number
): Promise<string> {
  try {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context for processing");
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Determine target color in RGB
    let targetR = 255;
    let targetG = 255;
    let targetB = 255;
    
    if (keyColor === "black") {
      targetR = 0;
      targetG = 0;
      targetB = 0;
    } else if (keyColor === "custom") {
      const cleanHex = customColorHex.replace("#", "");
      targetR = parseInt(cleanHex.substring(0, 2), 16) || 0;
      targetG = parseInt(cleanHex.substring(2, 4), 16) || 0;
      targetB = parseInt(cleanHex.substring(4, 6), 16) || 0;
    }
    
    // Convert tolerance (0-100) to max Euclidean color distance (0-442)
    // 441.67 is the diagonal of the 3D RGB cube: sqrt(255^2 * 3)
    const maxDistance = (tolerance / 100) * 441.67;
    const fadeBand = 30; // Soft transition band
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );
      
      if (distance < maxDistance) {
        // Completely transparent
        data[i + 3] = 0;
      } else if (distance < maxDistance + fadeBand) {
        // Soft edge feathering
        const ratio = (distance - maxDistance) / fadeBand;
        data[i + 3] = Math.min(a, Math.round(ratio * 255));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Background removal processing failed:", error);
    return imageSrc; // Fallback to original image
  }
}

/**
 * Merge product image (template) and logo image onto a single high-resolution canvas and export
 */
export async function generateMockupExport(
  productSvgSrc: string,
  logoSrc: string,
  printArea: { x: number; y: number; width: number; height: number },
  logoX: number, // percentage relative to printArea (-100 to 100)
  logoY: number, // percentage relative to printArea (-100 to 100)
  logoScale: number,
  logoRotation: number,
  logoOpacity: number,
  logoBlendMode: GlobalCompositeOperation,
  canvasSize: number = 2000 // High resolution target
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create high-res rendering context");
  
  // Fill high-res canvas with crisp transparency or white background
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  
  // Load background product (SVG)
  const productImg = await loadImage(productSvgSrc);
  ctx.drawImage(productImg, 0, 0, canvasSize, canvasSize);
  
  if (logoSrc) {
    try {
      const logoImg = await loadImage(logoSrc);
      
      // Calculate active print box inside the canvas size
      const pX = (printArea.x / 100) * canvasSize;
      const pY = (printArea.y / 100) * canvasSize;
      const pW = (printArea.width / 100) * canvasSize;
      const pH = (printArea.height / 100) * canvasSize;
      
      // Compute logo dimensions fitting within print area natively
      const aspect = logoImg.naturalWidth / logoImg.naturalHeight || 1;
      let logoW = pW * 0.7; // default scale
      let logoH = logoW / aspect;
      if (logoH > pH * 0.7) {
        logoH = pH * 0.7;
        logoW = logoH * aspect;
      }
      
      // Apply scale multiplier
      logoW *= logoScale;
      logoH *= logoScale;
      
      // Base center coordinates of print area
      const centerX = pX + pW / 2;
      const centerY = pY + pH / 2;
      
      // Offset position based on logoX and logoY percentages (relative to print area width/height)
      const offsetX = (logoX / 100) * pW;
      const offsetY = (logoY / 100) * pH;
      
      const targetX = centerX + offsetX;
      const targetY = centerY + offsetY;
      
      // Save canvas state to apply transform
      ctx.save();
      ctx.globalAlpha = logoOpacity;
      ctx.globalCompositeOperation = logoBlendMode;
      
      // Move to target center and rotate
      ctx.translate(targetX, targetY);
      if (logoRotation !== 0) {
        ctx.rotate((logoRotation * Math.PI) / 180);
      }
      
      // Draw image centered on translation point
      ctx.drawImage(logoImg, -logoW / 2, -logoH / 2, logoW, logoH);
      ctx.restore();
    } catch (e) {
      console.error("Failed to render logo layer in export:", e);
    }
  }
  
  return canvas.toDataURL("image/png");
}

/**
 * Generate print-ready isolated high-resolution logo template
 */
export async function generatePrintReadyExport(
  logoSrc: string,
  widthInches: number = 10,
  dpi: number = 300,
  mimeType: "image/png" | "image/jpeg" = "image/png",
  bgColor?: string
): Promise<string> {
  const logoImg = await loadImage(logoSrc);
  const canvas = document.createElement("canvas");
  
  // Calculate pixel size for high quality print
  const targetPixels = widthInches * dpi;
  const aspect = logoImg.naturalWidth / logoImg.naturalHeight || 1;
  
  canvas.width = targetPixels;
  canvas.height = targetPixels / aspect;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create print rendering context");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bgColor && bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
  
  return canvas.toDataURL(mimeType, mimeType === "image/jpeg" ? 0.95 : undefined);
}
