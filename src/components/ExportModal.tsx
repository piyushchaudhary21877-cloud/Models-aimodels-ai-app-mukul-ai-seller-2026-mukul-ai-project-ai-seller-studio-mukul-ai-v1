/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Download, ShieldCheck, FileImage, Settings, HelpCircle, Trash2, Sparkles, Archive, CheckSquare, Square, Files, FileSpreadsheet, Store, AlertCircle } from "lucide-react";
import { ProductPreset } from "../data/templates";
import { LogoTransform, LogoData, MockupScene } from "../types";
import { generateMockupExport, generatePrintReadyExport } from "../utils/imageUtils";

interface ExportPreset {
  id: string;
  name: string;
  dpi: number;
  widthInches: number;
  fileFormat: "png-transparent" | "png-solid-white" | "png-product-color" | "jpeg-solid-white" | "jpeg-product-color";
  isCustom?: boolean;
}

const DEFAULT_PRESETS: ExportPreset[] = [
  {
    id: "dtg-tshirt",
    name: 'Standard DTG Shirt (10" @ 300 DPI, PNG)',
    dpi: 300,
    widthInches: 10,
    fileFormat: "png-transparent",
  },
  {
    id: "hoodie-large",
    name: 'Large Hoodie Print (12" @ 300 DPI, PNG)',
    dpi: 300,
    widthInches: 12,
    fileFormat: "png-transparent",
  },
  {
    id: "pocket-logo",
    name: 'Pocket Print (6" @ 300 DPI, PNG)',
    dpi: 300,
    widthInches: 6,
    fileFormat: "png-transparent",
  },
  {
    id: "ultra-fine-sublimation",
    name: 'Ultra-Fine Sublimation (10" @ 600 DPI, PNG)',
    dpi: 600,
    widthInches: 10,
    fileFormat: "png-transparent",
  },
  {
    id: "ecommerce-white-jpg",
    name: 'E-Commerce Mock White (10" @ 300 DPI, JPG)',
    dpi: 300,
    widthInches: 10,
    fileFormat: "jpeg-solid-white",
  },
  {
    id: "fabric-matching-png",
    name: 'Fabric-Matched PNG (10" @ 300 DPI, PNG)',
    dpi: 300,
    widthInches: 10,
    fileFormat: "png-product-color",
  },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductPreset;
  color: string;
  logo: LogoData;
  transform: LogoTransform;
  customScene: MockupScene | null;
}

export default function ExportModal({
  isOpen,
  onClose,
  product,
  color,
  logo,
  transform,
  customScene,
}: ExportModalProps) {
  const [isExportingMockup, setIsExportingMockup] = useState(false);
  const [isExportingPrint, setIsExportingPrint] = useState(false);
  const [mockupResolution, setMockupResolution] = useState<number>(2000); // 1000 for 1K, 2000 for 2K (HD), 4000 for 4K
  
  // Custom presets state
  const [customPresets, setCustomPresets] = useState<ExportPreset[]>(() => {
    try {
      const saved = localStorage.getItem("merch-export-presets");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading export presets:", e);
      return [];
    }
  });

  // Print Settings states
  const [printWidthInches, setPrintWidthInches] = useState(10);
  const [printDpi, setPrintDpi] = useState(300);
  const [fileFormat, setFileFormat] = useState<ExportPreset["fileFormat"]>("png-transparent");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("dtg-tshirt");

  // Save preset interaction states
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Bulk ZIP State Variables
  const [activeExportTab, setActiveExportTab] = useState<"single" | "bulk" | "shopify">("single");
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(() => 
    DEFAULT_PRESETS.slice(0, 3).map((p) => p.id)
  );
  const [includeArtworks, setIncludeArtworks] = useState(true);
  const [includeMockups, setIncludeMockups] = useState(true);
  const [includeCsvManifest, setIncludeCsvManifest] = useState(true);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Shopify Export states
  const [shopifyTitle, setShopifyTitle] = useState(() => `${product.name} - Custom Edition`);
  const [shopifyPrice, setShopifyPrice] = useState("29.99");
  const [shopifyComparePrice, setShopifyComparePrice] = useState("39.99");
  const [shopifySku, setShopifySku] = useState(() => `MOCK-${product.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [shopifyTags, setShopifyTags] = useState(() => `MockupAI, custom ${product.category}, premium`);
  const [shopifyVendor, setShopifyVendor] = useState("");
  const [shopifyDomain, setShopifyDomain] = useState("your-store.myshopify.com");
  const [shopifyDescription, setShopifyDescription] = useState(() => 
    `<p><strong>Elevate your style</strong> with our custom printed ${product.name}.</p>\n` +
    `<p>Featuring a premium, ultra-crisp custom logo placement and highly durable printed threads. Created with soft-touch materials designed for everyday comfort and structured longevity.</p>\n` +
    `<ul>\n` +
    `  <li>Premium fit with responsive fabric flexibility</li>\n` +
    `  <li>100% combed ring-spun fiber quality</li>\n` +
    `  <li>Vibrant digital branding print</li>\n` +
    `</ul>`
  );
  const [shopifySizes, setShopifySizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [shopifyIsPublishing, setShopifyIsPublishing] = useState(true);
  const [isExportingShopifyCsv, setIsExportingShopifyCsv] = useState(false);

  // Load user session details for Shopify defaults
  useEffect(() => {
    try {
      const saved = localStorage.getItem("merch-mockup-session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.brandName) {
          setShopifyVendor(parsed.brandName);
        }
        if (parsed.shopifyDomain) {
          setShopifyDomain(parsed.shopifyDomain);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [product]);

  const handleTogglePreset = (id: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPresets = () => {
    const all = [...DEFAULT_PRESETS, ...customPresets].map((p) => p.id);
    setSelectedPresetIds(all);
  };

  const handleDeselectAllPresets = () => {
    setSelectedPresetIds([]);
  };

  const generateCsvContent = (selectedPresets: ExportPreset[]) => {
    const headers = ["Preset Name", "Export Timestamp", "Product ID", "Product Name", "Width (Inches)", "Resolution (DPI)", "File Format"];
    const timestamp = new Date().toISOString();
    const rows = selectedPresets.map((preset) => {
      return [
        `"${preset.name.replace(/"/g, '""')}"`,
        `"${timestamp}"`,
        `"${product.id.replace(/"/g, '""')}"`,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${preset.widthInches}"`,
        `"${preset.dpi}"`,
        `"${preset.fileFormat}"`
      ];
    });
    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  };

  const handleDownloadCsvManifestOnly = () => {
    const allPresets = [...DEFAULT_PRESETS, ...customPresets];
    const selectedPresets = allPresets.filter((p) => selectedPresetIds.includes(p.id));
    if (selectedPresets.length === 0) {
      alert("Please select at least one preset to generate manifest.");
      return;
    }
    const csvContent = generateCsvContent(selectedPresets);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const cleanProductName = product.name.toLowerCase().replace(/\s+/g, "_");
    downloadFile(url, `export_manifest_${cleanProductName}.csv`);
  };

  const handleExportShopifyCsv = async () => {
    setIsExportingShopifyCsv(true);
    try {
      const columns = [
        "Handle", "Title", "Body (HTML)", "Vendor", "Standard Product Type", 
        "Custom Product Type", "Tags", "Published", "Option1 Name", "Option1 Value", 
        "Option2 Name", "Option2 Value", "Variant SKU", "Variant Grams", 
        "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy", 
        "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price", 
        "Variant Requires Shipping", "Variant Taxable", "Variant Barcode", 
        "Image Src", "Image Position", "Image Alt Text", "Gift Card", 
        "SEO Title", "SEO Description", "Google Shopping / Google Product Category", 
        "Google Shopping / Gender", "Google Shopping / Age Group", "Google Shopping / MPN", 
        "Google Shopping / Condition", "Google Shopping / Custom Product", 
        "Google Shopping / Custom Label 0", "Variant Image", "Variant Weight Unit", 
        "Variant Tax Code", "Cost per item", "Price / International", "Compare At Price / International",
        "Status"
      ];

      const handle = shopifyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const productType = product.category.charAt(0).toUpperCase() + product.category.slice(1);
      const rows: string[][] = [];

      // Generate a variant row for each checked size
      shopifySizes.forEach((size, idx) => {
        const isFirst = idx === 0;
        const cleanTitle = shopifyTitle.replace(/"/g, '""');
        const cleanDescription = shopifyDescription.replace(/"/g, '""');
        const cleanVendor = (shopifyVendor || "MockupAI Merchant").replace(/"/g, '""');
        const cleanTags = shopifyTags.replace(/"/g, '""');

        const row = [
          handle,                                                        // Handle
          isFirst ? `"${cleanTitle}"` : "",                             // Title
          isFirst ? `"${cleanDescription}"` : "",                       // Body HTML
          `"${cleanVendor}"`,                                           // Vendor
          `"${productType}"`,                                           // Standard Product Type
          "",                                                           // Custom Product Type
          isFirst ? `"${cleanTags}"` : "",                              // Tags
          shopifyIsPublishing ? "TRUE" : "FALSE",                       // Published
          "Size",                                                       // Option1 Name
          size,                                                         // Option1 Value
          "Color",                                                      // Option2 Name
          color.toUpperCase(),                                          // Option2 Value
          `"${shopifySku}-${size}"`,                                    // Variant SKU
          "150",                                                        // Variant Grams
          "shopify",                                                    // Variant Inventory Tracker
          "100",                                                        // Variant Inventory Qty
          "deny",                                                       // Variant Inventory Policy
          "manual",                                                     // Variant Fulfillment Service
          shopifyPrice,                                                 // Variant Price
          shopifyComparePrice,                                          // Variant Compare At Price
          "TRUE",                                                       // Variant Requires Shipping
          "TRUE",                                                       // Variant Taxable
          "",                                                           // Variant Barcode
          isFirst ? `https://${shopifyDomain}/products/${handle}` : "", // Image Src
          isFirst ? "1" : "",                                           // Image Position
          `"${cleanTitle} Preview"`,                                    // Image Alt Text
          "FALSE",                                                      // Gift Card
          "", "", "", "", "", "", "", "", "", "", "g", "", "", "", "", "active"
        ];
        rows.push(row);
      });

      const csvContent = [
        columns.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      downloadFile(url, `shopify_product_${handle}.csv`);

      // Automatically also download the active high-res mockup preview image to match!
      await handleExportMockup();

    } catch (err) {
      console.error("Shopify export failed:", err);
    } finally {
      setIsExportingShopifyCsv(false);
    }
  };

  const handleBulkExportZip = async () => {
    const allPresets = [...DEFAULT_PRESETS, ...customPresets];
    const selectedPresets = allPresets.filter((p) => selectedPresetIds.includes(p.id));

    if (selectedPresets.length === 0) {
      alert("Please select at least one preset to export.");
      return;
    }
    if (!includeArtworks && !includeMockups && !includeCsvManifest) {
      alert("Please select at least one asset type (Artworks, Mockups, or CSV Manifest) to export.");
      return;
    }

    setIsExportingZip(true);
    
    let filesNeeded = 0;
    if (includeArtworks) filesNeeded += selectedPresets.length;
    if (includeMockups) filesNeeded += selectedPresets.length;
    if (includeCsvManifest) filesNeeded += 1;

    setZipProgress({ current: 0, total: filesNeeded, name: "Initializing ZIP Archive..." });

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let bgSrc = "";
      if (customScene) {
        bgSrc = customScene.imageUrl;
      } else {
        const svgString = product.getSvg(color);
        bgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
      }

      const printArea = customScene
        ? { x: 20, y: 20, width: 60, height: 60 }
        : product.printArea;

      let processedCount = 0;

      // Render CSV Manifest if selected
      if (includeCsvManifest) {
        processedCount++;
        setZipProgress({
          current: processedCount,
          total: filesNeeded,
          name: `Generating CSV Export Manifest...`,
        });
        const csvContent = generateCsvContent(selectedPresets);
        zip.file("export_manifest.csv", csvContent);
      }

      for (const preset of selectedPresets) {
        const cleanPresetName = preset.name
          .replace(/[^a-z0-9_-]/gi, "_")
          .replace(/__+/g, "_")
          .toLowerCase();

        // 1. Render and include Artworks
        if (includeArtworks) {
          processedCount++;
          setZipProgress({
            current: processedCount,
            total: filesNeeded,
            name: `Rendering Print Art [${processedCount}/${filesNeeded}]: ${preset.name}`,
          });

          const mimeType = preset.fileFormat.startsWith("jpeg-") ? "image/jpeg" : "image/png";
          let bgColor = "transparent";
          if (preset.fileFormat === "png-solid-white" || preset.fileFormat === "jpeg-solid-white") {
            bgColor = "#ffffff";
          } else if (preset.fileFormat === "png-product-color" || preset.fileFormat === "jpeg-product-color") {
            bgColor = color;
          }

          const printDataUrl = await generatePrintReadyExport(
            logo.processedSrc,
            preset.widthInches,
            preset.dpi,
            mimeType,
            bgColor
          );

          const printExt = mimeType === "image/jpeg" ? "jpg" : "png";
          const printBase64 = printDataUrl.split(",")[1];
          zip.file(`print_ready_artworks/${cleanPresetName}.${printExt}`, printBase64, { base64: true });
        }

        // 2. Render and include Mockups
        if (includeMockups) {
          processedCount++;
          setZipProgress({
            current: processedCount,
            total: filesNeeded,
            name: `Rendering Mockup [${processedCount}/${filesNeeded}]: ${preset.name}`,
          });

          const mockupDataUrl = await generateMockupExport(
            bgSrc,
            logo.processedSrc,
            printArea,
            transform.x,
            transform.y,
            transform.scale,
            transform.rotation,
            transform.opacity,
            transform.blendMode,
            2000
          );

          const mockupBase64 = mockupDataUrl.split(",")[1];
          zip.file(`mockup_previews/mockup_${cleanPresetName}.png`, mockupBase64, { base64: true });
        }
      }

      setZipProgress({
        current: filesNeeded,
        total: filesNeeded,
        name: "Packing folders & compressing ZIP archive...",
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const cleanProductName = product.name.toLowerCase().replace(/\s+/g, "_");
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulk_mockups_${cleanProductName}_assets.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Bulk export ZIP generation failed:", e);
      alert("Failed to generate ZIP archive. See console for error details.");
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  if (!isOpen) return null;

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkPresetMatch = (
    width: number,
    dpi: number,
    format: ExportPreset["fileFormat"],
    customList: ExportPreset[]
  ): string => {
    const allPresets = [...DEFAULT_PRESETS, ...customList];
    const found = allPresets.find(
      (p) => p.widthInches === width && p.dpi === dpi && p.fileFormat === format
    );
    return found ? found.id : "custom";
  };

  const handleWidthChange = (w: number) => {
    setPrintWidthInches(w);
    const nextPreset = checkPresetMatch(w, printDpi, fileFormat, customPresets);
    setSelectedPresetId(nextPreset);
  };

  const handleDpiChange = (dpi: number) => {
    setPrintDpi(dpi);
    const nextPreset = checkPresetMatch(printWidthInches, dpi, fileFormat, customPresets);
    setSelectedPresetId(nextPreset);
  };

  const handleFormatChange = (format: ExportPreset["fileFormat"]) => {
    setFileFormat(format);
    const nextPreset = checkPresetMatch(printWidthInches, printDpi, format, customPresets);
    setSelectedPresetId(nextPreset);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === "custom") return;

    const allPresets = [...DEFAULT_PRESETS, ...customPresets];
    const found = allPresets.find((p) => p.id === presetId);
    if (found) {
      setPrintWidthInches(found.widthInches);
      setPrintDpi(found.dpi);
      setFileFormat(found.fileFormat);
    }
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: ExportPreset = {
      id: `custom-${Date.now()}`,
      name: `${newPresetName.trim()} (${printWidthInches}" @ ${printDpi} DPI, ${fileFormat.startsWith("jpeg") ? "JPG" : "PNG"})`,
      dpi: printDpi,
      widthInches: printWidthInches,
      fileFormat: fileFormat,
      isCustom: true,
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem("merch-export-presets", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save custom preset to localStorage", err);
    }

    setSelectedPresetId(newPreset.id);
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  const handleDeleteCustomPreset = () => {
    const updated = customPresets.filter((p) => p.id !== selectedPresetId);
    setCustomPresets(updated);
    try {
      localStorage.setItem("merch-export-presets", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to update custom presets after deletion", err);
    }
    setSelectedPresetId("dtg-tshirt");
    // Apply Standard DTG Shirt settings
    const standard = DEFAULT_PRESETS[0];
    setPrintWidthInches(standard.widthInches);
    setPrintDpi(standard.dpi);
    setFileFormat(standard.fileFormat);
  };

  const handleExportMockup = async () => {
    setIsExportingMockup(true);
    try {
      // Get background source
      let bgSrc = "";
      if (customScene) {
        bgSrc = customScene.imageUrl;
      } else {
        const svgString = product.getSvg(color);
        bgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
      }

      const printArea = customScene
        ? { x: 20, y: 20, width: 60, height: 60 }
        : product.printArea;

      // Generate the lossless composite PNG at selected high resolution
      const mockupDataUrl = await generateMockupExport(
        bgSrc,
        logo.processedSrc,
        printArea,
        transform.x,
        transform.y,
        transform.scale,
        transform.rotation,
        transform.opacity,
        transform.blendMode,
        mockupResolution
      );

      const cleanProductName = product.name.toLowerCase().replace(/\s+/g, "_");
      downloadFile(mockupDataUrl, `mockup_${cleanProductName}_preview.png`);
    } catch (e) {
      console.error("Exporting composite mockup failed:", e);
    } finally {
      setIsExportingMockup(false);
    }
  };

  const handleExportPrintReady = async () => {
    setIsExportingPrint(true);
    try {
      const mimeType = fileFormat.startsWith("jpeg-") ? "image/jpeg" : "image/png";
      let bgColor = "transparent";
      
      if (fileFormat === "png-solid-white" || fileFormat === "jpeg-solid-white") {
        bgColor = "#ffffff";
      } else if (fileFormat === "png-product-color" || fileFormat === "jpeg-product-color") {
        bgColor = color;
      }

      // Generates the isolated logo with high DPI, selected format and background
      const printDataUrl = await generatePrintReadyExport(
        logo.processedSrc,
        printWidthInches,
        printDpi,
        mimeType,
        bgColor
      );

      const extension = mimeType === "image/jpeg" ? "jpg" : "png";
      const cleanLogoName = logo.name.toLowerCase().replace(/\s+/g, "_").substring(0, 20);
      downloadFile(printDataUrl, `print_ready_artwork_${cleanLogoName}.${extension}`);
    } catch (e) {
      console.error("Exporting print-ready artwork failed:", e);
    } finally {
      setIsExportingPrint(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" id="export-modal-backdrop">
      <div className="bg-[#121217] rounded-2xl max-w-2xl w-full border border-white/5 shadow-2xl overflow-hidden relative animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-zinc-950/50 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Export Design Files</h3>
            <p className="text-xs text-zinc-400 font-medium">Download high-quality assets ready for sharing or printing.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 focus:outline-none transition-all"
            id="close-export-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-zinc-950/20 px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveExportTab("single")}
            className={`py-3 text-xs font-bold transition-all focus:outline-none border-b-2 cursor-pointer ${
              activeExportTab === "single"
                ? "text-blue-400 border-blue-500 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 border-transparent"
            }`}
          >
            Single Asset Export
          </button>
          <button
            type="button"
            onClick={() => setActiveExportTab("bulk")}
            className={`py-3 text-xs font-bold transition-all focus:outline-none border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeExportTab === "bulk"
                ? "text-blue-400 border-blue-500 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 border-transparent"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Bulk ZIP Export</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveExportTab("shopify")}
            className={`py-3 text-xs font-bold transition-all focus:outline-none border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeExportTab === "shopify"
                ? "text-blue-400 border-blue-500 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 border-transparent"
            }`}
            id="shopify-export-tab-btn"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Shopify Store Export</span>
          </button>
        </div>

        {/* Modal Contents */}
        <div className="p-6 space-y-6">
          {activeExportTab === "single" ? (
            <>
              {/* Card 1: Mockup Composite Preview */}
              <div className="border border-white/5 rounded-xl p-5 hover:border-blue-500/30 bg-zinc-950/30 transition-all flex items-start space-x-4">
                <div className="p-3 bg-blue-500/15 rounded-xl text-blue-400 shrink-0 border border-blue-500/20">
                  <FileImage className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">Download Mockup Preview</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      Generates an ultra-crisp, high-fidelity PNG composite of your merchandise template with the custom logo, blending layers, and physical position merged into a single image. Best for e-commerce storefronts, catalogs, or design review.
                    </p>
                  </div>

                  {/* Resolution Picker */}
                  <div className="space-y-1.5 bg-zinc-900/60 border border-white/5 p-3 rounded-lg">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Target Export Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Standard (1K)", value: 1000, desc: "1000 x 1000 px" },
                        { label: "HD (2K)", value: 2000, desc: "2000 x 2000 px" },
                        { label: "Ultra HD (4K)", value: 4000, desc: "4000 x 4000 px" }
                      ].map((res) => (
                        <button
                          key={res.value}
                          type="button"
                          onClick={() => setMockupResolution(res.value)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer focus:outline-none ${
                            mockupResolution === res.value
                              ? "bg-blue-600/15 border-blue-500/80 text-blue-400"
                              : "bg-zinc-950 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider">{res.label}</p>
                          <p className="text-[8px] font-mono mt-0.5 text-zinc-500">{res.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleExportMockup}
                    disabled={isExportingMockup}
                    className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 focus:outline-none shadow-md shadow-blue-950/30 transition-all ${
                      isExportingMockup ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    id="download-mockup-btn"
                  >
                    {isExportingMockup ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>Rendering {mockupResolution === 4000 ? "4K" : mockupResolution === 2000 ? "2K" : "1K"} Mockup...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Mockup PNG ({mockupResolution === 4000 ? "4K" : mockupResolution === 2000 ? "HD" : "Standard"})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Print-Ready isolated Artwork */}
              <div className="border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 bg-zinc-950/30 transition-all flex items-start space-x-4">
                <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400 shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-white text-sm">Download Print-Ready Artwork</h4>
                      <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {fileFormat.startsWith("png") ? "Lossless PNG" : "High Quality JPG"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Generates the isolated logo design on a lossless transparent background scaled mathematically to professional print dimensions. Suitable for screen printing, direct-to-garment (DTG) printing, or sublimation.
                    </p>
                  </div>

                  {/* Sub-parameters */}
                  <div className="bg-zinc-900/60 border border-white/5 rounded-lg p-3.5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center space-x-1.5 text-xs text-zinc-300 font-bold">
                        <Settings className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Configure Print Canvas Settings</span>
                      </div>
                    </div>

                    {/* Export Presets Selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                        Active Export Preset
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedPresetId}
                          onChange={(e) => handlePresetChange(e.target.value)}
                          className="flex-1 text-xs border border-white/10 rounded-md p-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          id="export-preset-select"
                        >
                          <optgroup label="Standard Presets">
                            {DEFAULT_PRESETS.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </optgroup>
                          {customPresets.length > 0 && (
                            <optgroup label="Custom Presets">
                              {customPresets.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </optgroup>
                          )}
                          <option value="custom">-- Custom Settings --</option>
                        </select>
                        
                        {selectedPresetId !== "custom" && customPresets.some(p => p.id === selectedPresetId) && (
                          <button
                            type="button"
                            onClick={handleDeleteCustomPreset}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/20 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                            title="Delete custom preset"
                            id="delete-preset-btn"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Save Preset Form */}
                      {isSavingPreset ? (
                        <form onSubmit={handleSavePresetSubmit} className="flex gap-1.5 items-center bg-zinc-950/60 border border-white/5 rounded-lg p-2 mt-2 animate-fadeIn" id="save-preset-form">
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Preset name (e.g. DTG Premium T-Shirt)"
                            className="flex-1 text-xs border border-white/10 rounded p-1 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                            maxLength={35}
                            id="new-preset-name-input"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                            id="save-preset-submit-btn"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSavingPreset(false);
                              setNewPresetName("");
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                            id="save-preset-cancel-btn"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => setIsSavingPreset(true)}
                            className="text-[9px] font-bold text-zinc-400 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                            id="save-preset-toggle-btn"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Save settings as new Preset</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center mb-1">
                          Target Width
                          <div className="group relative ml-1">
                            <HelpCircle className="h-3 w-3 text-zinc-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 w-36 p-1.5 bg-zinc-900 border border-white/5 text-zinc-300 text-[9px] rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                              Physical width of the printed logo on the garment in inches.
                            </div>
                          </div>
                        </label>
                        <select
                          value={printWidthInches}
                          onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                          className="w-full text-xs border border-white/10 rounded-md p-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          id="export-width-select"
                        >
                          <option value="6">6 Inches (Pocket)</option>
                          <option value="8">8 Inches (Medium)</option>
                          <option value="10">10 Inches (Standard)</option>
                          <option value="12">12 Inches (Large)</option>
                          <option value="14">14 Inches (Extra-Large)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
                          Resolution
                        </label>
                        <select
                          value={printDpi}
                          onChange={(e) => handleDpiChange(parseInt(e.target.value))}
                          className="w-full text-xs border border-white/10 rounded-md p-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          id="export-dpi-select"
                        >
                          <option value="150">150 DPI (Draft)</option>
                          <option value="300">300 DPI (Studio)</option>
                          <option value="600">600 DPI (Ultra)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
                          Format & Bg
                        </label>
                        <select
                          value={fileFormat}
                          onChange={(e) => handleFormatChange(e.target.value as any)}
                          className="w-full text-xs border border-white/10 rounded-md p-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-ellipsis overflow-hidden"
                          id="export-format-select"
                        >
                          <option value="png-transparent">PNG (Transp.)</option>
                          <option value="png-solid-white">PNG (White Bg)</option>
                          <option value="png-product-color">PNG (Fabric Bg)</option>
                          <option value="jpeg-solid-white">JPEG (White Bg)</option>
                          <option value="jpeg-product-color">JPEG (Fabric Bg)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium pt-1">
                      <span>Resulting dimensions:</span>
                      <span className="font-mono font-bold text-zinc-400">
                        {printWidthInches * printDpi} x {Math.round((printWidthInches * printDpi) / (logo.width / logo.height || 1))} px
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleExportPrintReady}
                    disabled={isExportingPrint}
                    className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 focus:outline-none shadow-md shadow-emerald-950/30 transition-all ${
                      isExportingPrint ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    id="download-print-btn"
                  >
                    {isExportingPrint ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        <span>Rendering Vector Artwork...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Print Artwork PNG</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : activeExportTab === "bulk" ? (
            /* Tab 2: Bulk Export ZIP Archive */
            <div className="space-y-5 animate-fadeIn">
              {/* Card Header Info */}
              <div className="border border-blue-500/10 bg-blue-500/5 p-4 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-blue-500/15 text-blue-400 rounded-lg border border-blue-500/20">
                  <Archive className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-white text-sm">Bulk Export ZIP Archive</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Select multiple print & mockup configuration presets below. All requests will render in high-fidelity, structure themselves in `/print_ready_artworks` and `/mockup_previews` folders, and download instantly as a bundled `.zip` archive.
                  </p>
                </div>
              </div>

              {/* Preset Selection Panel */}
              <div className="bg-zinc-950/50 rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Files className="h-3.5 w-3.5 text-blue-400" />
                    <span>Select Presets to Include ({selectedPresetIds.length} Selected)</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPresets}
                      className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-zinc-600 text-[10px]">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPresets}
                      className="text-[9px] font-bold text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Preset Checkbox Grid */}
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[...DEFAULT_PRESETS, ...customPresets].map((preset) => {
                    const isSelected = selectedPresetIds.includes(preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleTogglePreset(preset.id)}
                        className={`flex items-start text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-950/20 border-blue-500/30 text-zinc-100"
                            : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-300"
                        }`}
                      >
                        <div className="mt-0.5 mr-2.5 shrink-0">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-white">{preset.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                            Width: {preset.widthInches}" • Resolution: {preset.dpi} DPI • Format: {preset.fileFormat}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Options Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIncludeArtworks(!includeArtworks)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    includeArtworks
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-zinc-900/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <div className="shrink-0">
                    {includeArtworks ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Print Artwork</p>
                    <p className="text-[10px] text-zinc-500">Isolated design files</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeMockups(!includeMockups)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    includeMockups
                      ? "bg-blue-950/20 border-blue-500/30 text-blue-300"
                      : "bg-zinc-900/30 border-white/5 text-zinc-500"
                  }`}
                >
                  <div className="shrink-0">
                    {includeMockups ? (
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Mockup Previews</p>
                    <p className="text-[10px] text-zinc-500">Garment composite renders</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeCsvManifest(!includeCsvManifest)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    includeCsvManifest
                      ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                      : "bg-zinc-900/30 border-white/5 text-zinc-500"
                  }`}
                  id="include-csv-manifest-btn"
                >
                  <div className="shrink-0">
                    {includeCsvManifest ? (
                      <CheckSquare className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">CSV Manifest</p>
                    <p className="text-[10px] text-zinc-500">External tracking table</p>
                  </div>
                </button>
              </div>

              {/* Progress Panel */}
              {zipProgress ? (
                <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">Generating ZIP Archive...</span>
                    <span className="font-mono text-zinc-400 font-bold">
                      {zipProgress.current} / {zipProgress.total} Files
                    </span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border border-zinc-500 border-t-transparent" />
                    <span>{zipProgress.name}</span>
                  </div>
                </div>
              ) : (
                /* Static Stats and Export Button */
                <div className="bg-zinc-950/30 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-semibold text-zinc-300">Export Estimation Summary</p>
                    <p className="text-[10px] text-zinc-500">
                      Generating <span className="text-zinc-300 font-bold font-mono">
                        {selectedPresetIds.length * ((includeArtworks ? 1 : 0) + (includeMockups ? 1 : 0)) + (includeCsvManifest ? 1 : 0)}
                      </span> assets in an organized archive structure.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadCsvManifestOnly}
                      disabled={selectedPresetIds.length === 0}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer justify-center"
                      id="download-csv-manifest-btn"
                      title="Download CSV manifest file containing preset details"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                      <span>Download CSV</span>
                    </button>

                    <button
                      onClick={handleBulkExportZip}
                      disabled={isExportingZip || selectedPresetIds.length === 0 || (!includeArtworks && !includeMockups && !includeCsvManifest)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/30 transition-all cursor-pointer justify-center"
                    >
                      <Archive className="h-4 w-4" />
                      <span>Download Bulk ZIP Bundle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeExportTab === "shopify" ? (
            <div className="space-y-5 animate-fadeIn" id="shopify-export-workspace">
              <div className="flex items-start space-x-3 bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-xl text-blue-300">
                <Store className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">E-Commerce Ready: Shopify Product Catalog Sync</p>
                  <p className="leading-relaxed text-zinc-400">
                    Generate and download a standard, importable Shopify CSV mapping out size options, price tags, and custom SEO metadata. Your current high-res composite mockup PNG will be exported alongside it for direct upload to your store media.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Fields */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Product Title
                    </label>
                    <input
                      type="text"
                      value={shopifyTitle}
                      onChange={(e) => setShopifyTitle(e.target.value)}
                      className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Retail Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={shopifyPrice}
                        onChange={(e) => setShopifyPrice(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Compare-at Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={shopifyComparePrice}
                        onChange={(e) => setShopifyComparePrice(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Base SKU
                      </label>
                      <input
                        type="text"
                        value={shopifySku}
                        onChange={(e) => setShopifySku(e.target.value.toUpperCase())}
                        className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                        Brand/Vendor
                      </label>
                      <input
                        type="text"
                        value={shopifyVendor}
                        onChange={(e) => setShopifyVendor(e.target.value)}
                        placeholder="Brand Name"
                        className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sizes Variant Checklist */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Enable Size Variants
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => {
                        const isChecked = shopifySizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setShopifySizes((prev) =>
                                prev.includes(size)
                                  ? prev.filter((s) => s !== size)
                                  : [...prev, size]
                              );
                            }}
                            className={`px-3 py-1.5 text-[10px] font-mono rounded-md border font-bold transition-all cursor-pointer focus:outline-none ${
                              isChecked
                                ? "bg-blue-600/15 border-blue-500/80 text-blue-400 font-bold"
                                : "bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Fields */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Shopify Domain Link
                    </label>
                    <input
                      type="text"
                      value={shopifyDomain}
                      onChange={(e) => setShopifyDomain(e.target.value)}
                      className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Product Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={shopifyTags}
                      onChange={(e) => setShopifyTags(e.target.value)}
                      className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Description (HTML)
                    </label>
                    <textarea
                      rows={5}
                      value={shopifyDescription}
                      onChange={(e) => setShopifyDescription(e.target.value)}
                      className="w-full text-xs bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/40 p-4 border border-white/5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-0.5">
                  <p className="text-xs font-bold text-zinc-300">Publish immediately to active channel</p>
                  <p className="text-[10px] text-zinc-500">
                    Product variants will be created for {shopifySizes.length || 0} sizes in {color.toUpperCase()} coloring.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportShopifyCsv}
                  disabled={isExportingShopifyCsv || shopifySizes.length === 0 || !shopifyTitle.trim()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer shrink-0"
                  id="shopify-csv-export-btn"
                >
                  {isExportingShopifyCsv ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      <span>Generating Variant Catalog...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export Shopify CSV + PNG Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
