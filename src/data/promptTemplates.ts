import { PromptTemplate } from "../types";

export const READY_MADE_TEMPLATES: PromptTemplate[] = [
  {
    id: "tpl-1",
    title: "Retro Sun Mountain Adventure",
    category: "t-shirt",
    style: "vintage",
    description: "Classic 1970s distressed retro landscape with geometric sunset arches and mountain peaks. A top seller for outdoor enthusiasts.",
    prompt: "Vintage distressed t-shirt design, geometric retro sun arches behind sharp mountain silhouettes, warm pine trees, retro color palette of burnt orange, mustard yellow, and deep teal, weathered texture overlay, vector illustration, isolated on pure white background.",
    isTrending: true
  },
  {
    id: "tpl-2",
    title: "Cute Chibi Boba Cat Sticker",
    category: "sticker",
    style: "cartoon",
    description: "An adorable calico cat hugging a giant bubble tea cup. High emotional appeal for stickers and mugs.",
    prompt: "Adorable chibi calico cat hugging a massive glass cup of bubble tea with black tapioca pearls, cute anime big eyes, pink blush, bold cartoon outlines, flat colors, white stroke border, vector sticker illustration, high contrast, isolated on transparent-ready white background.",
    isTrending: true
  },
  {
    id: "tpl-3",
    title: "Brutalist Cyberpunk Kanji Streetwear",
    category: "hoodie",
    style: "futuristic",
    description: "High-contrast neon cyberpunk graphic with stacked typography and geometric tech panels. Elite appeal for modern urban streetwear.",
    prompt: "Cyberpunk urban streetwear design, a futuristic skull with cybernetic neon visor, stacked Japanese kanji characters meaning 'FUTURE', neon pink and electric cyan wireframe grids, glitch art aesthetic, high contrast, bold brutalist graphic, isolated on solid pitch black background.",
    isTrending: true
  },
  {
    id: "tpl-4",
    title: "Japanese Ukiyo-e Wave Mug",
    category: "mug",
    style: "anime",
    description: "Elegant traditional Great Wave aesthetic with modern vaporwave sakura cherry blossom accents.",
    prompt: "Japanese ukiyo-e woodblock print style of a massive rolling ocean wave, elegant pink sakura cherry blossom petals floating in the air, glowing sun in the background, traditional hand-drawn texture, beautiful gold line detailing, isolated on cream background.",
    isTrending: false
  },
  {
    id: "tpl-5",
    title: "Classic Helvetica Typography Quote",
    category: "poster",
    style: "typography",
    description: "Clean, bold, and modern typography poster with high contrast. Extremely popular for home office decor.",
    prompt: "Modern brutalist typography design, bold wordmark layout reading 'DO EPIC SHIT', stark black letters stacked symmetrically, custom Swiss style kerning, slight distress, vector text, isolated on bright white background.",
    isTrending: false
  },
  {
    id: "tpl-6",
    title: "Luxury Gold Monogram crest",
    category: "phone case",
    style: "luxury",
    description: "High-end luxury brand aesthetic featuring symmetrical golden laurels, crowns, and ornate flourishes.",
    prompt: "Symmetrical luxury monogram logo crest, ornate golden laurels, royal crown, sophisticated filigree details, metallic gold foil shader, elegant geometric frame, premium boutique design, isolated on solid dark charcoal background.",
    isTrending: true
  },
  {
    id: "tpl-7",
    title: "Funny Coffee Overload Skeleton",
    category: "mug",
    style: "funny",
    description: "Relatable humor featuring a skeleton holding a coffee mug with a witty, highly viral quote.",
    prompt: "Funny cartoon skeleton drinking from a smoking coffee mug, coffee spilling through ribcage, playful hand-drawn retro comic style, comic sound effect lines, bright yellow and orange background pops, isolated on white background.",
    isTrending: true
  },
  {
    id: "tpl-8",
    title: "Organic Sage Botanical Illustration",
    category: "t-shirt",
    style: "minimal",
    description: "Elegant, minimalist line art of wildflower bouquets. Cottagecore aesthetic, top seller on Etsy.",
    prompt: "Minimalist botanical line art drawing, delicate wildflowers, lavender and sage bouquet, elegant single continuous line vector, soft pastel green watercolor circle in the background, sophisticated and eye-safe, isolated on pure white background.",
    isTrending: false
  },
  {
    id: "tpl-9",
    title: "Aesthetic Sunset Palm Trees",
    category: "phone case",
    style: "vintage",
    description: "Vaporwave sunset beach vibes with silhouetted palm trees and beautiful pastel neon gradients.",
    prompt: "Aesthetic retro vaporwave sunset beach, tall silhouette palm trees against a glowing purple, pink, and peach sun grid, retro 1980s synthwave horizon, high fidelity, flat vector art, isolated on white background.",
    isTrending: false
  },
  {
    id: "tpl-10",
    title: "Luxury Cosmic Mandala Emblem",
    category: "poster",
    style: "luxury",
    description: "Intricate sacred geometry celestial mandala with stars and gold constellations.",
    prompt: "Elegant sacred geometry mandala design, cosmic celestial moon phases and constellations, fine gold lines, mystical bohemian aesthetic, intricate astrological map art, isolated on deep navy background.",
    isTrending: false
  }
];
