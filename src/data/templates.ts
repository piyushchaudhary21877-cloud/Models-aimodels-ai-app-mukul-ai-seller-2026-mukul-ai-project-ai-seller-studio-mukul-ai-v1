/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductPreset {
  id: string;
  name: string;
  category: "apparel" | "accessories" | "home";
  defaultColor: string;
  colors: string[];
  printArea: {
    x: number;      // percentage from left (0 to 100)
    y: number;      // percentage from top (0 to 100)
    width: number;  // width percentage (0 to 100)
    height: number; // height percentage (0 to 100)
  };
  getSvg: (color: string) => string;
}

export const PRODUCTS: ProductPreset[] = [
  {
    id: "tshirt",
    name: "Classic T-Shirt",
    category: "apparel",
    defaultColor: "#E2E8F0", // light gray
    colors: ["#FFFFFF", "#E2E8F0", "#1E293B", "#EF4444", "#3B82F6", "#10B981", "#F59E0B"],
    printArea: { x: 30, y: 25, width: 40, height: 45 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Shadow -->
        <ellipse cx="200" cy="380" rx="140" ry="12" fill="rgba(0, 0, 0, 0.08)" />
        
        <!-- T-Shirt Body -->
        <path d="M 120,60 
                 C 140,58 170,55 200,68 
                 C 230,55 260,58 280,60 
                 L 360,95 
                 C 365,100 365,115 350,135 
                 L 315,150 
                 L 315,360 
                 C 315,365 305,370 295,370 
                 L 105,370 
                 C 95,370 85,365 85,360 
                 L 85,150 
                 L 50,135 
                 C 35,115 35,100 40,95 
                 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.15)" 
              stroke-width="2" />
              
        <!-- Crew Neck Collar -->
        <path d="M 155,58 C 175,72 225,72 245,58 C 248,52 240,50 200,50 C 160,50 152,52 155,58 Z" 
              fill="rgba(0, 0, 0, 0.08)" 
              stroke="rgba(0,0,0,0.15)" />
              
        <!-- Left Sleeve Hem -->
        <path d="M 50,135 L 85,150" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
        <!-- Right Sleeve Hem -->
        <path d="M 350,135 L 315,150" stroke="rgba(0,0,0,0.1)" stroke-width="2" />
        
        <!-- Premium Folds & Shading (Overlay) -->
        <!-- Shoulder shading -->
        <path d="M 120,60 Q 150,90 120,130" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="3" stroke-linecap="round" />
        <path d="M 280,60 Q 250,90 280,130" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="3" stroke-linecap="round" />
        
        <!-- Waist Fold Lines -->
        <path d="M 85,280 C 110,290 150,270 200,285 C 250,300 290,280 315,295" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" stroke-linecap="round" />
        <path d="M 85,283 C 110,293 150,273 200,288 C 250,303 290,283 315,298" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="2" stroke-linecap="round" />
        
        <path d="M 110,340 C 140,350 200,340 250,348 C 280,352 300,345 315,350" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="2" stroke-linecap="round" />
        <path d="M 85,190 C 120,180 180,200 230,185 C 280,170 300,195 315,185" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="3" stroke-linecap="round" />

        <!-- Highlights for Realistic Fabric Depth -->
        <path d="M 200,80 Q 200,250 210,350" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="12" stroke-linecap="round" filter="blur(5px)" />
        <path d="M 140,100 Q 130,220 145,340" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="8" stroke-linecap="round" filter="blur(4px)" />
      </svg>
    `
  },
  {
    id: "hoodie",
    name: "Cozy Hoodie",
    category: "apparel",
    defaultColor: "#1E293B", // dark slate
    colors: ["#FFFFFF", "#E2E8F0", "#1E293B", "#475569", "#78716C", "#991B1B", "#065F46"],
    printArea: { x: 30, y: 35, width: 40, height: 35 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Shadow -->
        <ellipse cx="200" cy="385" rx="145" ry="10" fill="rgba(0, 0, 0, 0.12)" />
        
        <!-- Hoodie Sleeves and Body (Combined) -->
        <path d="M 130,85 
                 C 110,80 80,100 60,130 
                 L 40,240 
                 C 38,250 48,255 58,250 
                 L 85,210 
                 L 85,355 
                 C 85,365 95,370 105,370 
                 L 295,370 
                 C 305,370 315,365 315,355 
                 L 315,210 
                 L 342,250 
                 C 352,255 362,250 360,240 
                 L 340,130 
                 C 320,100 290,80 270,85 
                 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.2)" 
              stroke-width="2" />
              
        <!-- Ribbed Waist Band -->
        <path d="M 85,355 C 85,370 315,370 315,355 Z" fill="rgba(0, 0, 0, 0.15)" />
        
        <!-- Kangaroo Pocket -->
        <path d="M 130,270 
                 L 270,270 
                 L 290,325 
                 C 290,335 285,340 275,340 
                 L 125,340 
                 C 115,340 110,335 110,325 
                 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.25)" 
              stroke-width="1.5" />
        <path d="M 110,325 L 130,270" stroke="rgba(0,0,0,0.2)" stroke-width="2" />
        <path d="M 290,325 L 270,270" stroke="rgba(0,0,0,0.2)" stroke-width="2" />
        
        <!-- Hood Construction -->
        <path d="M 130,85 
                 C 120,40 160,25 200,25 
                 C 240,25 280,40 270,85 
                 C 255,100 225,105 200,105 
                 C 175,105 145,100 130,85 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.2)" 
              stroke-width="1.5" />
              
        <!-- Hood Inner opening shadow -->
        <path d="M 160,80 C 160,55 180,45 200,45 C 220,45 240,55 240,80 C 230,90 215,92 200,92 C 185,92 170,90 160,80 Z" 
              fill="rgba(0, 0, 0, 0.25)" />
              
        <!-- Drawstrings -->
        <path d="M 185,88 Q 180,120 178,160 Q 177,165 181,165 Q 183,163 183,158 Q 181,120 187,88" fill="#E2E8F0" />
        <path d="M 215,88 Q 220,130 222,175 Q 224,180 219,180 Q 217,177 217,172 Q 215,130 213,88" fill="#E2E8F0" />
        
        <!-- Shading overlays for folds and volume -->
        <!-- Armpit folds -->
        <path d="M 85,210 Q 110,215 125,230" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="3" stroke-linecap="round" />
        <path d="M 315,210 Q 290,215 275,230" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="3" stroke-linecap="round" />
        
        <!-- Chest folds -->
        <path d="M 130,120 Q 200,140 270,120" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2" stroke-linecap="round" />
        <path d="M 140,160 Q 200,180 260,160" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" />
        
        <!-- Side folds -->
        <path d="M 95,260 Q 110,290 95,320" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="2.5" />
        <path d="M 305,260 Q 290,290 305,320" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="2.5" />
      </svg>
    `
  },
  {
    id: "mug",
    name: "Ceramic Coffee Mug",
    category: "home",
    defaultColor: "#FFFFFF",
    colors: ["#FFFFFF", "#000000", "#DC2626", "#2563EB", "#16A34A", "#D97706", "#7C3AED"],
    printArea: { x: 25, y: 25, width: 42, height: 50 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Drop Shadow -->
        <ellipse cx="200" cy="330" rx="90" ry="10" fill="rgba(0, 0, 0, 0.12)" />
        
        <!-- Mug Handle (Behind body for solid colors, or overlayed carefully) -->
        <path d="M 280,140 
                 C 330,140 345,260 280,270 
                 C 265,270 265,250 275,250 
                 C 310,240 305,160 275,160 
                 C 265,160 265,140 280,140 Z" 
              fill="${color === '#FFFFFF' ? '#F1F5F9' : color}" 
              stroke="rgba(0,0,0,0.15)" 
              stroke-width="1.5" />
              
        <!-- Inner handle shadow -->
        <path d="M 285,155 C 315,165 315,235 285,245" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="3" />
        
        <!-- Mug Body (Cylinder) -->
        <path d="M 120,120 
                 L 120,300 
                 C 120,325 280,325 280,300 
                 L 280,120 
                 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.2)" 
              stroke-width="2" />
              
        <!-- Rim Opening / Coffee Interior -->
        <ellipse cx="200" cy="120" rx="80" ry="20" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="2" />
        <!-- Inner shadow / liquid -->
        <ellipse cx="200" cy="122" rx="74" ry="16" fill="rgba(0,0,0,0.06)" />
        <!-- Coffee option if white interior -->
        <ellipse cx="200" cy="125" rx="65" ry="12" fill="#3B2314" opacity="0.85" />
        
        <!-- 3D Cylindrical Shading & Highlighting -->
        <!-- Left Side Shadow (depth) -->
        <path d="M 120,120 L 120,300 C 140,315 160,300 160,120 Z" fill="rgba(0,0,0,0.05)" filter="blur(3px)" />
        <!-- Right Side Shadow -->
        <path d="M 280,120 L 280,300 C 260,315 240,300 240,120 Z" fill="rgba(0,0,0,0.04)" filter="blur(3px)" />
        
        <!-- Glossy Highlights -->
        <path d="M 140,135 Q 135,220 140,285" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="6" stroke-linecap="round" filter="blur(1px)" />
        <path d="M 200,135 Q 200,220 200,300" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="12" stroke-linecap="round" filter="blur(4px)" />
      </svg>
    `
  },
  {
    id: "totebag",
    name: "Canvas Tote Bag",
    category: "accessories",
    defaultColor: "#F5F5DC", // beige / canvas natural
    colors: ["#FFFFFF", "#F5F5DC", "#000000", "#1E3A8A", "#064E3B", "#78350F"],
    printArea: { x: 22, y: 32, width: 56, height: 48 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Ground Shadow -->
        <ellipse cx="200" cy="380" rx="110" ry="8" fill="rgba(0, 0, 0, 0.1)" />
        
        <!-- Straps (Behind and Front) -->
        <!-- Left Strap -->
        <path d="M 140,170 C 140,30 170,30 170,170" fill="none" stroke="#D1C4E9" stroke-width="12" stroke-linecap="round" opacity="0.15" />
        <path d="M 140,170 C 140,30 170,30 170,170" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="8" stroke-linecap="round" />
        
        <!-- Right Strap -->
        <path d="M 230,170 C 230,30 260,30 260,170" fill="none" stroke="#D1C4E9" stroke-width="12" stroke-linecap="round" opacity="0.15" />
        <path d="M 230,170 C 230,30 260,30 260,170" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="8" stroke-linecap="round" />
        
        <!-- Tote Bag Body -->
        <path d="M 90,160 
                 L 310,160 
                 C 315,160 320,165 318,175 
                 L 295,360 
                 C 293,370 285,375 275,375 
                 L 125,375 
                 C 115,375 107,370 105,360 
                 L 82,175 
                 C 80,165 85,160 90,160 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.18)" 
              stroke-width="2" />
              
        <!-- Top Hem Stitching -->
        <path d="M 86,180 L 314,180" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" stroke-dasharray="4,3" />
        <path d="M 88,185 L 312,185" stroke="rgba(0,0,0,0.1)" stroke-width="1" />
        
        <!-- Fabric Textures & Realistic Folds -->
        <path d="M 130,180 C 140,240 120,300 135,370" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 270,180 C 260,240 280,300 265,370" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 200,180 C 205,250 195,310 200,375" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-linecap="round" />
        <path d="M 198,180 C 203,250 193,310 198,375" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="2" stroke-linecap="round" />
        
        <path d="M 105,330 C 140,345 200,335 250,342 C 275,346 288,338 295,340" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="2" />
        <path d="M 95,240 Q 150,265 210,250 Q 260,235 305,255" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="3" />
      </svg>
    `
  },
  {
    id: "phonecase",
    name: "Glossy Phone Case",
    category: "accessories",
    defaultColor: "#0F172A", // midnight
    colors: ["#FFFFFF", "#0F172A", "#E2E8F0", "#EC4899", "#8B5CF6", "#F59E0B", "#10B981"],
    printArea: { x: 15, y: 15, width: 70, height: 70 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Case Drop Shadow -->
        <rect x="135" y="55" width="130" height="295" rx="28" ry="28" fill="rgba(0,0,0,0.15)" filter="blur(6px)" />
        
        <!-- Case Body -->
        <rect x="130" y="50" width="130" height="295" rx="26" ry="26" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="2.5" />
        
        <!-- Camera Lens Bump -->
        <rect x="146" y="66" width="36" height="70" rx="10" ry="10" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        
        <!-- Camera Lenses -->
        <circle cx="164" cy="82" r="9" fill="#111" stroke="#333" stroke-width="1" />
        <circle cx="164" cy="82" r="4" fill="#0c1624" />
        <circle cx="164" cy="116" r="9" fill="#111" stroke="#333" stroke-width="1" />
        <circle cx="164" cy="116" r="4" fill="#0c1624" />
        <circle cx="164" cy="99" r="3" fill="#FFE8A3" opacity="0.9" /> <!-- flash -->
        
        <!-- Glossy Reflective Highlights -->
        <path d="M 134,75 L 134,310 C 134,325 145,336 160,336 L 160,54 Q 134,54 134,75" fill="rgba(255,255,255,0.08)" />
        
        <!-- Sharp Diagonal Shine -->
        <path d="M 135,110 L 255,250 L 255,280 L 135,140 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M 135,80 L 255,220 L 255,235 L 135,95 Z" fill="rgba(255,255,255,0.07)" />
        
        <!-- Hard Plastic Outer Rim Highlight -->
        <rect x="132" y="52" width="126" height="291" rx="24" ry="24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
      </svg>
    `
  },
  {
    id: "cap",
    name: "Classic Dad Hat",
    category: "accessories",
    defaultColor: "#78350F", // brown
    colors: ["#FFFFFF", "#000000", "#1E293B", "#78350F", "#1D4ED8", "#B91C1C", "#0F766E"],
    printArea: { x: 32, y: 44, width: 36, height: 20 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Drop Shadow -->
        <ellipse cx="200" cy="315" rx="120" ry="12" fill="rgba(0, 0, 0, 0.15)" />
        
        <!-- Cap Visor / Brim -->
        <path d="M 90,265 
                 C 110,305 290,305 310,265 
                 C 260,250 140,250 90,265 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.25)" 
              stroke-width="1.5" />
              
        <!-- Visor Shading (Lower depth) -->
        <path d="M 90,265 C 110,305 290,305 310,265 C 290,285 110,285 90,265 Z" fill="rgba(0, 0, 0, 0.15)" />
        <!-- Stitching Lines on Visor -->
        <path d="M 115,268 C 135,290 265,290 285,268" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1" stroke-dasharray="3,3" />
        <path d="M 125,273 C 145,293 255,293 275,273" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1" stroke-dasharray="3,3" />
        
        <!-- Cap Dome / Crown -->
        <path d="M 105,255 
                 C 90,140 150,110 200,110 
                 C 250,110 310,140 295,255 
                 C 250,240 150,240 105,255 Z" 
              fill="${color}" 
              stroke="rgba(0,0,0,0.2)" 
              stroke-width="1.5" />
              
        <!-- Crown Stitching / Segments -->
        <path d="M 200,110 Q 180,180 105,255" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="4,3" />
        <path d="M 200,110 Q 200,180 200,245" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="4,3" />
        <path d="M 200,110 Q 220,180 295,255" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1" stroke-dasharray="4,3" />
        
        <!-- Top Button -->
        <ellipse cx="200" cy="110" rx="10" ry="4" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1" />
        
        <!-- Eyelet Air Holes -->
        <circle cx="150" cy="160" r="3" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
        <circle cx="250" cy="160" r="3" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" />
        
        <!-- Crown Realistic Shading and Highlights -->
        <!-- Center Highlight -->
        <path d="M 200,115 Q 170,170 160,240" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="16" stroke-linecap="round" filter="blur(4px)" />
        <path d="M 115,210 Q 140,230 180,242" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="3" filter="blur(1px)" />
        <path d="M 285,210 Q 260,230 220,242" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="3" filter="blur(1px)" />
      </svg>
    `
  },
  {
    id: "poster",
    name: "Minimalist Framed Poster",
    category: "home",
    defaultColor: "#1E293B", // deep frame color
    colors: ["#FFFFFF", "#1E293B", "#0F172A", "#000000", "#D97706", "#78350F"],
    printArea: { x: 30, y: 20, width: 40, height: 60 },
    getSvg: (color: string) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <!-- Wall background shadow -->
        <rect x="100" y="60" width="200" height="280" rx="4" fill="rgba(0, 0, 0, 0.25)" filter="blur(8px)" />
        
        <!-- Outer wooden / metal frame -->
        <rect x="95" y="55" width="210" height="290" rx="6" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
        
        <!-- Inner Matting / Passepartout (white/cream border around the artwork) -->
        <rect x="110" y="70" width="180" height="260" fill="#FAF9F6" stroke="rgba(0,0,0,0.08)" stroke-width="1" />
        
        <!-- Inner print area outline where logo goes -->
        <rect x="120" y="80" width="160" height="240" fill="#FFFFFF" stroke="rgba(0,0,0,0.05)" stroke-width="1" />
        
        <!-- Sophisticated paper texture/shading overlays -->
        <!-- Soft diagonal spotlight gradient -->
        <path d="M 95,55 L 305,265 L 305,345 L 95,135 Z" fill="rgba(255, 255, 255, 0.05)" />
        <path d="M 120,80 L 280,240 L 280,320 L 120,160 Z" fill="rgba(255, 255, 255, 0.03)" />
        
        <!-- Frame corner join lines (adding high fidelity realism) -->
        <line x1="95" y1="55" x2="110" y2="70" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
        <line x1="305" y1="55" x2="290" y2="70" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
        <line x1="95" y1="345" x2="110" y2="330" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
        <line x1="305" y1="345" x2="290" y2="330" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
      </svg>
    `
  }
];
