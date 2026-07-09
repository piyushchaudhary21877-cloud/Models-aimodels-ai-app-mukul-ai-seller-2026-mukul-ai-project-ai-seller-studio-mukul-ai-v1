/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductPreset } from "./data/templates";

export interface LogoTransform {
  x: number;       // relative X coordinate (0-100% of the active print area)
  y: number;       // relative Y coordinate (0-100% of the active print area)
  scale: number;   // size multiplier (0.1 to 3)
  rotation: number;// in degrees (0 to 360)
  opacity: number; // 0 to 1
  blendMode: GlobalCompositeOperation; // Canvas blending modes
  smartCrop?: boolean; // automatically clip logo to the print box area
}

export interface BackgroundRemovalSettings {
  enabled: boolean;
  colorToKey: "white" | "black" | "custom";
  customColorHex: string;
  tolerance: number; // 0 to 100
}

export interface LogoData {
  src: string;          // Original image source (base64 or object URL)
  processedSrc: string; // Background-removed or modified image source
  name: string;         // Descriptive name or filename
  width: number;
  height: number;
}

export interface MockupScene {
  id: string;
  name: string;
  imageUrl: string;
  isAiGenerated: boolean;
  productType: string;
}

export type LogoStyle = "modern" | "vector" | "vintage" | "futuristic";

export interface GenerateLogoParams {
  prompt: string;
  style: LogoStyle;
  useHighQuality: boolean;
}

export interface GenerateSceneParams {
  prompt: string;
  productType: string;
}

export interface SavedConfig {
  id: string;
  name: string;
  createdAt: string;
  productId: string;
  productColor: string;
  activeLogo: LogoData | null;
  customScene: MockupScene | null;
  transform: LogoTransform;
  bgRemoval: BackgroundRemovalSettings;
  punchline?: PunchlineSettings;
  category?: string;
  tags?: string[];
  order?: number;
}

export interface HistoryState {
  productId: string;
  productColor: string;
  activeLogo: LogoData | null;
  customScene: MockupScene | null;
  transform: LogoTransform;
  bgRemoval: BackgroundRemovalSettings;
  punchline?: PunchlineSettings;
}

export interface PunchlineSettings {
  text: string;
  fontFamily: "sans" | "serif" | "mono" | "grotesk" | "handwritten";
  fontSize: number;
  color: string;
  offsetX: number;
  offsetY: number;
  tracking: number;
  opacity: number;
  rotation: number;
  arcStrength: number; // Curvature: -100 (arched up) to 100 (arched down)
  uppercase: boolean;
}

export interface GeneratedPromptIdea {
  id: string;
  title: string;
  description: string;
  colors: string[];
  font: string;
  seoKeywords: string[];
  prompt: string;
  productType: string;
}

export interface PromptHistoryItem {
  id: string;
  keyword: string;
  style: string;
  productType: string;
  timestamp: string;
  ideas: GeneratedPromptIdea[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: "t-shirt" | "hoodie" | "mug" | "sticker" | "poster" | "phone case";
  style: string;
  description: string;
  prompt: string;
  isTrending?: boolean;
}


