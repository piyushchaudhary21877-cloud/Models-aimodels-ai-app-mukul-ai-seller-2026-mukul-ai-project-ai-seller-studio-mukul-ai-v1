/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Grid, Download, Sparkles, Check, Info, Palette } from "lucide-react";
import { ProductPreset, PRODUCTS } from "../data/templates";
import { LogoData, LogoTransform } from "../types";
import { generateMockupExport } from "../utils/imageUtils";

interface BulkGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  logo: LogoData | null;
  transform: LogoTransform;
}

export default function BulkGenerator({
  isOpen,
  onClose,
  logo,
  transform,
}: BulkGeneratorProps) {
  // Select all products by default
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    PRODUCTS.map((p) => p.id)
  );

  // Global color override mode
  const [colorMode, setColorMode] = useState<"presets" | "global">("presets");
  const [globalColor, setGlobalColor] = useState("#FFFFFF");

  // Track export state
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // All colors pool compiled from templates
  const availableColors = Array.from(
    new Set(PRODUCTS.flatMap((p) => p.colors))
  ).slice(0, 10); // Take top 10 unique colors

  if (!isOpen) return null;

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedProductIds(PRODUCTS.map((p) => p.id));
  };

  const selectNone = () => {
    setSelectedProductIds([]);
  };

  const getProductColor = (product: ProductPreset) => {
    return colorMode === "global" ? globalColor : product.defaultColor;
  };

  const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIndividual = async (product: ProductPreset) => {
    if (!logo) return;
    try {
      const color = getProductColor(product);
      const svgString = product.getSvg(color);
      const bgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

      const dataUrl = await generateMockupExport(
        bgSrc,
        logo.processedSrc || logo.src,
        product.printArea,
        transform.x,
        transform.y,
        transform.scale,
        transform.rotation,
        transform.opacity,
        transform.blendMode as GlobalCompositeOperation,
        2000
      );

      downloadFile(
        dataUrl,
        `mockup_${product.id}_${color.replace("#", "")}.png`
      );
    } catch (err) {
      console.error(`Failed to export ${product.name}:`, err);
    }
  };

  const handleExportAll = async () => {
    if (!logo || selectedProductIds.length === 0) return;
    setIsExportingAll(true);
    setSuccessMessage(null);

    const activeProducts = PRODUCTS.filter((p) =>
      selectedProductIds.includes(p.id)
    );

    try {
      for (let i = 0; i < activeProducts.length; i++) {
        const product = activeProducts[i];
        setExportProgress(
          `Generating preview ${i + 1} of ${activeProducts.length}: ${
            product.name
          }...`
        );

        const color = getProductColor(product);
        const svgString = product.getSvg(color);
        const bgSrc = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

        const dataUrl = await generateMockupExport(
          bgSrc,
          logo.processedSrc || logo.src,
          product.printArea,
          transform.x,
          transform.y,
          transform.scale,
          transform.rotation,
          transform.opacity,
          transform.blendMode as GlobalCompositeOperation,
          2000
        );

        downloadFile(
          dataUrl,
          `bulk_mockup_${product.id}_${color.replace("#", "")}.png`
        );

        // Minimal delay between downloads to prevent browser blocking
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      setSuccessMessage(`Exported ${activeProducts.length} mockup files successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Bulk export failed:", err);
    } finally {
      setIsExportingAll(false);
      setExportProgress("");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
      id="bulk-modal-backdrop"
    >
      <div className="bg-[#121217] rounded-2xl max-w-5xl w-full border border-white/5 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Header */}
        <div className="bg-zinc-950/50 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                Bulk Merchandise Generator <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-medium">Multi-View</span>
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Apply your custom logo across our complete merchandise catalog simultaneously.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 focus:outline-none transition-all"
            id="close-bulk-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-zinc-900/40 border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Select Garments:
            </span>
            <button
              onClick={selectAll}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold focus:outline-none"
            >
              All
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={selectNone}
              className="text-xs text-zinc-500 hover:text-zinc-400 font-semibold focus:outline-none"
            >
              None
            </button>
            <span className="text-xs text-zinc-400 font-medium ml-2">
              ({selectedProductIds.length} selected)
            </span>
          </div>

          {/* Color Modes */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-zinc-950 border border-white/5 rounded-lg p-1">
              <button
                onClick={() => setColorMode("presets")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  colorMode === "presets"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Keep Preset Colors
              </button>
              <button
                onClick={() => setColorMode("global")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  colorMode === "global"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Apply Global Color
              </button>
            </div>

            {colorMode === "global" && (
              <div className="flex items-center space-x-2 animate-fadeIn">
                <Palette className="h-3.5 w-3.5 text-zinc-400" />
                <div className="flex space-x-1">
                  {availableColors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setGlobalColor(col)}
                      className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 focus:outline-none ${
                        globalColor === col
                          ? "border-white ring-1 ring-blue-500"
                          : "border-white/20"
                      }`}
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                  <input
                    type="color"
                    value={globalColor}
                    onChange={(e) => setGlobalColor(e.target.value)}
                    className="w-5 h-5 rounded-full border border-white/20 bg-transparent cursor-pointer overflow-hidden p-0"
                    title="Custom Color"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary View Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
          {logo ? (
            selectedProductIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center text-zinc-500">
                <Grid className="h-12 w-12 text-zinc-700 mb-3" />
                <h4 className="text-base font-semibold text-zinc-400">No products selected</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                  Please check at least one product above to render your design simultaneously.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="bulk-summary-grid">
                {PRODUCTS.filter((p) => selectedProductIds.includes(p.id)).map((product) => {
                  const activeColor = getProductColor(product);
                  const pX = product.printArea.x;
                  const pY = product.printArea.y;
                  const pW = product.printArea.width;
                  const pH = product.printArea.height;

                  return (
                    <div
                      key={product.id}
                      className="group border border-white/5 bg-zinc-950/40 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/40 hover:border-zinc-700/50 transition-all shadow-md relative"
                    >
                      {/* Product Checkbox (Top Left Absolute) */}
                      <div className="absolute top-3.5 left-3.5 z-10">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                      </div>

                      {/* Summary Vector View */}
                      <div className="aspect-square bg-zinc-900 rounded-xl relative overflow-hidden flex items-center justify-center p-3 mb-4">
                        {/* Dynamic Render of Product SVG */}
                        <div
                          className="w-full h-full flex items-center justify-center opacity-90"
                          dangerouslySetInnerHTML={{ __html: product.getSvg(activeColor) }}
                        />

                        {/* Absolutely positioned print container layer matching canvas */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: `${pX}%`,
                            top: `${pY}%`,
                            width: `${pW}%`,
                            height: `${pH}%`,
                          }}
                        >
                          {/* Outer translation offset frame */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              transform: `translate(${transform.x}%, ${transform.y}%)`,
                            }}
                          >
                            {/* Inner core size centered viewport */}
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={logo.processedSrc || logo.src}
                                style={{
                                  maxWidth: "70%",
                                  maxHeight: "70%",
                                  transform: `scale(${transform.scale}) rotate(${transform.rotation}deg)`,
                                  opacity: transform.opacity,
                                  mixBlendMode: transform.blendMode as any,
                                }}
                                alt={`${product.name} Logo Placement`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Name and Metadata Info */}
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-white text-xs truncate max-w-[130px]">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">
                              {product.category}
                            </p>
                          </div>
                          <span
                            className="w-4 h-4 rounded-full border border-white/10 inline-block shadow-sm"
                            style={{ backgroundColor: activeColor }}
                            title={`Active color: ${activeColor}`}
                          />
                        </div>

                        {/* Quick action individual export */}
                        <button
                          onClick={() => handleExportIndividual(product)}
                          className="w-full mt-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition-all border border-white/5"
                          title="Download individual mockup PNG"
                        >
                          <Download className="h-3 w-3" />
                          <span>Quick PNG</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center text-zinc-500">
              <Sparkles className="h-12 w-12 text-zinc-700 mb-3" />
              <h4 className="text-base font-semibold text-zinc-400">Artwork not configured</h4>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                Please create or upload a logo design on the main screen to enable the bulk generator pipeline.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-950/80 border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-2.5 text-[11px] text-zinc-400">
            <Info className="h-4 w-4 text-zinc-500 shrink-0" />
            <p>
              Previews utilize vector artwork templates and apply precise scaling mathematically aligned with the active artboard.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {successMessage && (
              <span className="text-emerald-400 text-xs font-semibold animate-fadeIn mr-2">
                {successMessage}
              </span>
            )}
            {isExportingAll && (
              <span className="text-blue-400 text-xs font-mono animate-pulse mr-2 truncate max-w-[200px] sm:max-w-xs">
                {exportProgress}
              </span>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-white/5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors focus:outline-none"
            >
              Close
            </button>

            <button
              disabled={!logo || selectedProductIds.length === 0 || isExportingAll}
              onClick={handleExportAll}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all focus:outline-none ${
                logo && selectedProductIds.length > 0 && !isExportingAll
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                  : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5"
              }`}
              id="bulk-download-all-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExportingAll ? "Exporting..." : "Download All Selected"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
