/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Save, FolderOpen, Trash2, Calendar, Check, AlertCircle, ShoppingBag, Star, Briefcase, User, Tag, Sparkles, SlidersHorizontal, FolderPlus, Folder, Plus, X, Download, Upload, Search, Maximize2, Square, CheckSquare, ZoomIn, ZoomOut, RotateCcw, Hand, GripVertical, Keyboard, Copy } from "lucide-react";
import { SavedConfig, LogoData, LogoTransform, BackgroundRemovalSettings, MockupScene } from "../types";
import { PRODUCTS, ProductPreset } from "../data/templates";

const DEFAULT_CATEGORIES = ["General", "Favorites", "T-shirts", "Hoodies", "Office"];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Favorites":
      return <Star className="h-3.5 w-3.5 text-amber-400" />;
    case "Work":
      return <Briefcase className="h-3.5 w-3.5 text-indigo-400" />;
    case "Personal":
      return <User className="h-3.5 w-3.5 text-purple-400" />;
    case "T-shirts":
      return <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />;
    case "Hoodies":
      return <Folder className="h-3.5 w-3.5 text-violet-400" />;
    case "Office":
      return <Briefcase className="h-3.5 w-3.5 text-teal-400" />;
    default:
      return <Folder className="h-3.5 w-3.5 text-blue-400" />;
  }
};

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Favorites":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Work":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    case "Personal":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "T-shirts":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Hoodies":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "Office":
      return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-700/50";
  }
};

interface SavedConfigsProps {
  currentProductId: string;
  currentProductColor: string;
  currentLogo: LogoData | null;
  currentCustomScene: MockupScene | null;
  currentTransform: LogoTransform;
  currentBgRemoval: BackgroundRemovalSettings;
  onLoadConfig: (config: SavedConfig) => void;
}

const LOCAL_STORAGE_KEY = "merch_mockup_saved_configs";

export default function SavedConfigs({
  currentProductId,
  currentProductColor,
  currentLogo,
  currentCustomScene,
  currentTransform,
  currentBgRemoval,
  onLoadConfig,
}: SavedConfigsProps) {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("merch_mockup_categories");
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  });
  const [newConfigName, setNewConfigName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [activeFilter, setActiveFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tag-related state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [editingTagsPresetId, setEditingTagsPresetId] = useState<string | null>(null);
  const [selectedLightboxConfig, setSelectedLightboxConfig] = useState<SavedConfig | null>(null);
  const [checkedConfigIds, setCheckedConfigIds] = useState<string[]>([]);

  // Drag and Drop ordering state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDropAfter, setIsDropAfter] = useState(false);

  // Hover Preview States
  const [hoveredPreviewConfig, setHoveredPreviewConfig] = useState<SavedConfig | null>(null);
  const [hoveredPreviewPosition, setHoveredPreviewPosition] = useState<{ x: number; y: number } | null>(null);

  // Batch Renaming States
  const [isBatchRenaming, setIsBatchRenaming] = useState(false);
  const [batchRenamePrefix, setBatchRenamePrefix] = useState("");
  const [batchRenameStartNumber, setBatchRenameStartNumber] = useState(1);
  const [batchRenameFormat, setBatchRenameFormat] = useState("suffix"); // suffix | prefix | simple

  // Lightbox Zoom and Pan interactive state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom state on config toggle/close
  useEffect(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [selectedLightboxConfig]);

  const handleAddTag = (presetId: string, tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    const updated = configs.map((c) => {
      if (c.id === presetId) {
        const existingTags = c.tags || [];
        if (!existingTags.includes(trimmed)) {
          return { ...c, tags: [...existingTags, trimmed] };
        }
      }
      return c;
    });
    saveToLocalStorage(updated);
    setSuccess(`Added tag "${trimmed}"`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleRemoveTag = (presetId: string, tag: string) => {
    const updated = configs.map((c) => {
      if (c.id === presetId) {
        return { ...c, tags: (c.tags || []).filter((t) => t !== tag) };
      }
      return c;
    });
    saveToLocalStorage(updated);
    setSuccess(`Removed tag "${tag}"`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleExportPresets = () => {
    if (configs.length === 0) {
      setError("No saved presets to export.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const dataStr = JSON.stringify(configs, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `merch_mockup_presets_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess("Presets exported successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to export presets.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== "string") {
          throw new Error("Invalid file content format.");
        }
        const imported = JSON.parse(result);
        if (!Array.isArray(imported)) {
          throw new Error("Imported data must be an array of preset configurations.");
        }

        // Basic structure validation: each item should have an id and a name
        const validConfigs = imported.filter((item: any) => {
          return item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string";
        }) as SavedConfig[];

        if (validConfigs.length === 0) {
          throw new Error("No valid configuration presets found in the file.");
        }

        // Merge strategy: update duplicate ids, prepend new ones
        const existingMap = new Map<string, SavedConfig>(configs.map((c) => [c.id, c]));
        let newCount = 0;
        let updatedCount = 0;

        validConfigs.forEach((newConf) => {
          if (existingMap.has(newConf.id)) {
            existingMap.set(newConf.id, newConf);
            updatedCount++;
          } else {
            existingMap.set(newConf.id, newConf);
            newCount++;
          }
        });

        const mergedConfigs = Array.from(existingMap.values()) as SavedConfig[];
        
        // Also automatically import any custom categories/folders
        const importedCategories = Array.from(
          new Set(
            validConfigs
              .map((c) => c.category)
              .filter((cat): cat is string => typeof cat === "string" && !!cat)
          )
        );

        const updatedCategories = Array.from(new Set([...categories, ...importedCategories]));

        saveToLocalStorage(mergedConfigs);
        if (importedCategories.length > 0) {
          saveCategories(updatedCategories);
        }

        // Trigger custom update event to sync other components
        window.dispatchEvent(new CustomEvent("merch-mockup-config-changed"));

        setSuccess(`Successfully imported ${validConfigs.length} presets! (${newCount} new, ${updatedCount} updated)`);
        setTimeout(() => setSuccess(null), 5000);
      } catch (err: any) {
        setError(err?.message || "Failed to parse and import presets JSON file.");
        setTimeout(() => setError(null), 5000);
      } finally {
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setError("Failed to read file.");
      setTimeout(() => setError(null), 3000);
    };

    reader.readAsText(file);
  };

  const saveCategories = (updatedCats: string[]) => {
    try {
      localStorage.setItem("merch_mockup_categories", JSON.stringify(updatedCats));
      setCategories(updatedCats);
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setError("A folder with this name already exists.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    const updated = [...categories, name];
    saveCategories(updated);
    setSelectedCategory(name);
    setNewCategoryName("");
    setIsAddingCategory(false);
    setSuccess(`Created folder "${name}"`);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (["General", "Favorites"].includes(catToDelete)) {
      setError("Cannot delete core folders.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const updatedCats = categories.filter((c) => c !== catToDelete);
    saveCategories(updatedCats);

    // Re-assign any configs in that deleted folder back to General
    const updatedConfigs = configs.map((c) => {
      if (c.category === catToDelete) {
        return { ...c, category: "General" };
      }
      return c;
    });
    saveToLocalStorage(updatedConfigs);

    if (selectedCategory === catToDelete) {
      setSelectedCategory("General");
    }
    if (activeFilter === catToDelete) {
      setActiveFilter("All");
    }

    setSuccess(`Deleted folder "${catToDelete}". Saved designs moved to General.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateCategory = (id: string, newCat: string) => {
    const updated = configs.map((c) => {
      if (c.id === id) {
        return { ...c, category: newCat };
      }
      return c;
    });
    if (saveToLocalStorage(updated)) {
      setSuccess(`Moved design to "${newCat}"`);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  // Load existing configs from localStorage on mount and on custom update event
  useEffect(() => {
    const loadConfigs = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setConfigs(JSON.parse(stored) as SavedConfig[]);
        }
      } catch (err) {
        console.error("Failed to read saved configurations from localStorage", err);
        setError("Unable to retrieve saved presets from your browser storage.");
      }
    };

    const loadCategories = () => {
      try {
        const stored = localStorage.getItem("merch_mockup_categories");
        if (stored) {
          setCategories(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };

    loadConfigs();
    loadCategories();

    window.addEventListener("merch-mockup-config-changed", loadConfigs);
    return () => {
      window.removeEventListener("merch-mockup-config-changed", loadConfigs);
    };
  }, []);

  // Save configurations helper
  const saveToLocalStorage = (updatedConfigs: SavedConfig[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedConfigs));
      setConfigs(updatedConfigs);
      // Notify other components (and App.tsx shortcuts)
      window.dispatchEvent(new Event("merch-mockup-config-changed"));
      return true;
    } catch (err) {
      console.error("Failed to write to localStorage", err);
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        setError("Storage full! High-resolution custom artwork uses significant space. Try deleting some older configurations first.");
      } else {
        setError("An error occurred while saving. Please try again.");
      }
      return false;
    }
  };

  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Reset manual edit when product or logo changes to allow fresh AI generation
  useEffect(() => {
    setIsManualEdit(false);
  }, [currentProductId, currentLogo?.src]);

  // Generate a friendly auto-suggested name using AI (debounced)
  useEffect(() => {
    if (isManualEdit) return;

    const timer = setTimeout(() => {
      const generateName = async () => {
        setIsGeneratingName(true);
        try {
          const product = PRODUCTS.find((p) => p.id === currentProductId);
          const productName = product ? product.name : "Merchandise";
          const logoName = currentLogo ? currentLogo.name.replace(" Template", "").replace(" AI Logo", "") : "";

          const res = await fetch("/api/generate-config-name", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productType: productName,
              logoName: logoName,
              colorHex: currentProductColor,
            }),
          });
          const data = await res.json();
          if (data.success && data.name) {
            setNewConfigName(data.name);
          } else {
            throw new Error(data.error || "Failed to generate name");
          }
        } catch (err) {
          console.error("AI name generation failed, using standard fallback:", err);
          const product = PRODUCTS.find((p) => p.id === currentProductId);
          const productName = product ? product.name : "Mockup";
          const logoName = currentLogo ? currentLogo.name.replace(" Template", "").replace(" AI Logo", "") : "Blank";
          const date = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
          setNewConfigName(`${productName} (${logoName}) - ${date}`);
        } finally {
          setIsGeneratingName(false);
        }
      };

      generateName();
    }, 800); // 800ms debounce to prevent multiple server hits during color slider dragging

    return () => clearTimeout(timer);
  }, [currentProductId, currentLogo, currentProductColor, isManualEdit]);

  const handleAIGenerateName = async () => {
    setIsGeneratingName(true);
    setError(null);
    try {
      const product = PRODUCTS.find((p) => p.id === currentProductId);
      const productName = product ? product.name : "Merchandise";
      const logoName = currentLogo ? currentLogo.name.replace(" Template", "").replace(" AI Logo", "") : "";

      const res = await fetch("/api/generate-config-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: productName,
          logoName: logoName,
          colorHex: currentProductColor,
        }),
      });
      const data = await res.json();
      if (data.success && data.name) {
        setNewConfigName(data.name);
        setIsManualEdit(false); // Reset to false so they can auto-generate on further tweaks if desired
        setSuccess("AI generated a semantic name!");
        setTimeout(() => setSuccess(null), 2500);
      } else {
        throw new Error(data.error || "Failed to generate name");
      }
    } catch (err: any) {
      console.error("Manual AI name generation failed:", err);
      setError("Failed to generate AI name. Please try again.");
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newConfigName.trim()) {
      setError("Please provide a name for this design preset.");
      return;
    }

    const newConfig: SavedConfig = {
      id: `config_${Date.now()}`,
      name: newConfigName.trim(),
      createdAt: new Date().toISOString(),
      productId: currentProductId,
      productColor: currentProductColor,
      activeLogo: currentLogo,
      customScene: currentCustomScene,
      transform: currentTransform,
      bgRemoval: currentBgRemoval,
      category: selectedCategory,
      tags: selectedTags,
      order: 0,
    };

    const updated = [
      newConfig,
      ...configs.map((c, idx) => ({
        ...c,
        order: c.order !== undefined ? c.order + 1 : idx + 1,
      })),
    ];
    if (saveToLocalStorage(updated)) {
      setSuccess("Design saved successfully!");
      setIsManualEdit(false); // Reset so the next save suggest is also AI semantic
      setSelectedTags([]);
      setCustomTagInput("");
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering Load if clicked delete
    setError(null);
    setSuccess(null);

    const updated = configs.filter((c) => c.id !== id);
    if (saveToLocalStorage(updated)) {
      setSuccess("Preset deleted.");
      setCheckedConfigIds((prev) => prev.filter((item) => item !== id));
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleDuplicate = (configToDuplicate: SavedConfig, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering Load if clicked duplicate
    setError(null);
    setSuccess(null);

    const duplicatedConfig: SavedConfig = {
      ...configToDuplicate,
      id: `config_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${configToDuplicate.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };

    // Find index of the duplicated config to insert right next to it
    const index = configs.findIndex((c) => c.id === configToDuplicate.id);
    const updated = [...configs];

    if (index !== -1) {
      updated.splice(index + 1, 0, duplicatedConfig);
    } else {
      updated.unshift(duplicatedConfig);
    }

    // Re-index sequentially to prevent overlap/bugs in manual sorting
    const sequential = updated.map((c, idx) => ({
      ...c,
      order: idx,
    }));

    if (saveToLocalStorage(sequential)) {
      setSuccess(`Duplicated preset as "${duplicatedConfig.name}"!`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteSelected = () => {
    const count = checkedConfigIds.length;
    if (count === 0) return;

    if (confirm(`Are you sure you want to delete the ${count} selected configurations?`)) {
      setError(null);
      setSuccess(null);
      const updated = configs.filter((c) => !checkedConfigIds.includes(c.id));
      if (saveToLocalStorage(updated)) {
        setSuccess(`Successfully deleted ${count} presets.`);
        setCheckedConfigIds([]);
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  const handleBatchRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const prefix = batchRenamePrefix.trim();
    if (!prefix) {
      setError("Please provide a shared base prefix name.");
      return;
    }

    let currentNum = batchRenameStartNumber;
    const renameMap: { [id: string]: string } = {};

    // Sort the checked IDs according to their current visual order in processedConfigs, or fallback to chronological
    const sortedSelectedIds = [...checkedConfigIds].sort((a, b) => {
      const idxA = processedConfigs.findIndex((c) => c.id === a);
      const idxB = processedConfigs.findIndex((c) => c.id === b);
      return idxA - idxB;
    });

    sortedSelectedIds.forEach((id) => {
      let newName = "";
      if (batchRenameFormat === "suffix") {
        newName = `${prefix} - ${currentNum}`;
      } else if (batchRenameFormat === "prefix") {
        newName = `${currentNum} - ${prefix}`;
      } else {
        newName = `${prefix} ${currentNum}`;
      }
      renameMap[id] = newName;
      currentNum++;
    });

    const updated = configs.map((c) => {
      if (renameMap[c.id]) {
        return {
          ...c,
          name: renameMap[c.id],
        };
      }
      return c;
    });

    if (saveToLocalStorage(updated)) {
      setSuccess(`Successfully renamed ${sortedSelectedIds.length} presets!`);
      setIsBatchRenaming(false);
      setBatchRenamePrefix("");
      setCheckedConfigIds([]);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleLoad = (config: SavedConfig) => {
    setError(null);
    onLoadConfig(config);
    setSuccess(`Loaded configuration: "${config.name}"`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const bottomHalf = relativeY > rect.height / 2;
      setIsDropAfter(bottomHalf);
      if (dragOverId !== id) {
        setDragOverId(id);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setIsDropAfter(false);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      setIsDropAfter(false);
      return;
    }

    // Work on the currently visual items (processedConfigs) so rearrangement is category-aware
    const currentVisualList = [...processedConfigs];
    const draggedVisualIdx = currentVisualList.findIndex((c) => c.id === draggedId);
    const targetVisualIdx = currentVisualList.findIndex((c) => c.id === targetId);

    if (draggedVisualIdx === -1 || targetVisualIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      setIsDropAfter(false);
      return;
    }

    const reorderedVisualList = [...currentVisualList];
    const [draggedItem] = reorderedVisualList.splice(draggedVisualIdx, 1);
    
    // Find where the target is in the spliced array
    const newTargetVisualIdx = reorderedVisualList.findIndex((c) => c.id === targetId);
    
    // Determine target index based on top or bottom half drop
    const insertIdx = isDropAfter ? newTargetVisualIdx + 1 : newTargetVisualIdx;
    reorderedVisualList.splice(insertIdx, 0, draggedItem);

    // Merge reorderedVisualList back into full configs list
    // Preserve manual order baseline of other items not currently visible
    const baseConfigs = [...configs].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : new Date(a.createdAt).getTime();
      const orderB = b.order !== undefined ? b.order : new Date(b.createdAt).getTime();
      return orderA - orderB;
    });

    const visualIds = new Set(currentVisualList.map((item) => item.id));
    const slotIndices: number[] = [];
    baseConfigs.forEach((config, idx) => {
      if (visualIds.has(config.id)) {
        slotIndices.push(idx);
      }
    });

    const updatedConfigs = [...baseConfigs];
    slotIndices.forEach((slotIdx, i) => {
      updatedConfigs[slotIdx] = reorderedVisualList[i];
    });

    // sequential re-indexing of all configs
    const sequential = updatedConfigs.map((c, index) => ({
      ...c,
      order: index,
    }));

    if (saveToLocalStorage(sequential)) {
      setSortBy("manual");
      setSuccess("Rearranged category mockup priority!");
      setTimeout(() => setSuccess(null), 2500);
    }

    setDraggedId(null);
    setDragOverId(null);
    setIsDropAfter(false);
  };

  const processedConfigs = (() => {
    let list = configs.filter((c) => {
      const matchesCategory = activeFilter === "All" || (c.category || "General") === activeFilter;
      const matchesProduct = productFilter === "All" || c.productId === productFilter;
      const matchesTag = tagFilter === "All" || (c.tags && c.tags.includes(tagFilter));
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        c.name.toLowerCase().includes(query) ||
        (c.category || "General").toLowerCase().includes(query) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(query))) ||
        (PRODUCTS.find((p) => p.id === c.productId)?.name || "").toLowerCase().includes(query);

      return matchesCategory && matchesProduct && matchesTag && matchesSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "manual") {
        const orderA = a.order !== undefined ? a.order : new Date(a.createdAt).getTime();
        const orderB = b.order !== undefined ? b.order : new Date(b.createdAt).getTime();
        return orderA - orderB;
      } else if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "product-type") {
        const pA = PRODUCTS.find((p) => p.id === a.productId)?.name || "";
        const pB = PRODUCTS.find((p) => p.id === b.productId)?.name || "";
        return pA.localeCompare(pB);
      } else if (sortBy === "name-az" || sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "tags-count") {
        const countA = a.tags ? a.tags.length : 0;
        const countB = b.tags ? b.tags.length : 0;
        return countB - countA;
      } else if (sortBy === "tags-asc") {
        const tagA = a.tags && a.tags.length > 0 ? a.tags[0] : "zzz";
        const tagB = b.tags && b.tags.length > 0 ? b.tags[0] : "zzz";
        return tagA.localeCompare(tagB);
      }
      return 0;
    });
  })();

  const allUniqueTags = Array.from(
    new Set(configs.flatMap((c) => c.tags || []))
  );

  return (
    <div className="space-y-6" id="saved-configs-panel">
      {/* Save current setup section */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-xl p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Save className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-xs font-bold text-white tracking-wide uppercase">Save Current Setup</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Preserve your complete workspace design, including active garments, customized colors, placement scales, and your loaded artwork.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center justify-between">
              <span>Preset Name</span>
              {isGeneratingName && (
                <span className="text-[9px] text-blue-400 font-medium animate-pulse flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  Generating AI Name...
                </span>
              )}
            </label>
            <div className="relative flex items-center gap-1.5">
              <input
                type="text"
                value={newConfigName}
                onChange={(e) => {
                  setNewConfigName(e.target.value);
                  setIsManualEdit(true);
                }}
                placeholder="E.g., Winter Streetwear Tee"
                className="w-full text-xs border border-white/10 rounded-lg p-2.5 pr-10 bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-zinc-500"
                maxLength={50}
                id="preset-name-input"
              />
              <button
                type="button"
                onClick={handleAIGenerateName}
                disabled={isGeneratingName}
                className="absolute right-2 p-1.5 text-zinc-400 hover:text-blue-400 disabled:opacity-50 transition-colors focus:outline-none rounded-md hover:bg-white/5 cursor-pointer flex items-center justify-center"
                title="Suggest a poetic, semantic name using AI based on active product, color & logo"
                id="ai-generate-name-btn"
              >
                <Sparkles className={`h-4 w-4 ${isGeneratingName ? "animate-spin text-blue-400" : ""}`} />
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 leading-normal">
              AI automatically creates a poetic retail name (e.g., "Midnight Lotus Hoodie") combining color tones, product types, and logo styles. Or click the sparkle to re-generate.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Preset Category / Folder
              </label>
              
              {!isAddingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-all focus:outline-none cursor-pointer"
                  id="toggle-add-folder-btn"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>+ New Folder</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-[9px] font-bold text-zinc-500 hover:text-zinc-400 transition-all focus:outline-none cursor-pointer"
                  id="cancel-add-folder-btn"
                >
                  Cancel
                </button>
              )}
            </div>

            {isAddingCategory && (
              <form onSubmit={handleAddCategory} className="flex items-center gap-2 bg-zinc-900/40 p-2 rounded-lg border border-white/5 animate-fadeIn">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New Folder (e.g. Office, Summer Line)"
                  className="flex-1 text-xs border border-white/10 rounded px-2 py-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={20}
                  required
                  id="new-folder-input"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                  id="add-folder-submit-btn"
                >
                  Create
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                const isCore = ["General", "Favorites", "Work", "Personal"].includes(cat);
                return (
                  <div key={cat} className="relative group/cat flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition-all focus:outline-none cursor-pointer ${
                        isActive
                          ? cat === "Favorites"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/20"
                            : cat === "Work" || cat === "Office" || cat === "T-shirts" || cat === "Hoodies"
                            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-950/20"
                            : "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-lg"
                          : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                      }`}
                    >
                      {cat === "Favorites" && <Star className="h-3 w-3 shrink-0 text-amber-400" />}
                      {cat === "Work" && <Briefcase className="h-3 w-3 shrink-0 text-indigo-400" />}
                      {cat === "Personal" && <User className="h-3 w-3 shrink-0 text-purple-400" />}
                      {cat === "General" && <Tag className="h-3 w-3 shrink-0 text-zinc-400" />}
                      {cat === "T-shirts" && <ShoppingBag className="h-3 w-3 shrink-0 text-emerald-400" />}
                      {cat === "Hoodies" && <Folder className="h-3 w-3 shrink-0 text-violet-400" />}
                      {cat === "Office" && <Briefcase className="h-3 w-3 shrink-0 text-teal-400" />}
                      {!["Favorites", "Work", "Personal", "General", "T-shirts", "Hoodies", "Office"].includes(cat) && <Folder className="h-3 w-3 shrink-0 text-blue-400" />}
                      <span>{cat}</span>
                    </button>
                    {!isCore && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(cat, e)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover/cat:opacity-100 focus:opacity-100 transition-all cursor-pointer shadow-md z-10"
                        title={`Delete folder "${cat}"`}
                        id={`delete-folder-${cat}`}
                      >
                        <X className="h-2 w-2" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Tags Selection */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Preset Tags (e.g., Draft, Final, Experiment)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["Draft", "Final", "Experiment"].map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={`py-1 px-2.5 rounded-full text-[9px] font-semibold border transition-all cursor-pointer focus:outline-none ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse"
                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {selectedTags
                .filter((t) => !["Draft", "Final", "Experiment"].includes(t))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTags((prev) => prev.filter((t) => t !== tag));
                    }}
                    className="py-1 px-2.5 rounded-full text-[9px] font-semibold border transition-all cursor-pointer focus:outline-none bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    title="Click to remove custom tag"
                  >
                    <span>{tag}</span>
                    <span className="ml-1 text-[8px] opacity-60">×</span>
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Type custom tag (e.g. Winter, Sprint)"
                className="flex-1 text-[10px] border border-white/10 rounded px-2 py-1.5 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600"
                maxLength={15}
                id="custom-tag-input"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = customTagInput.trim();
                  if (trimmed && !selectedTags.includes(trimmed)) {
                    setSelectedTags((prev) => [...prev, trimmed]);
                    setCustomTagInput("");
                  }
                }}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                id="add-custom-tag-btn"
              >
                + Tag
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center space-x-2 text-white bg-blue-600 hover:bg-blue-500 transition-all focus:outline-none shadow-md shadow-blue-900/20"
            id="save-preset-btn"
            title="Save preset configuration (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Configuration Set (Ctrl+S)</span>
          </button>
        </form>

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-lg text-[11px] leading-relaxed">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start space-x-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-[11px] leading-relaxed">
            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}
      </div>

      {/* List existing setups section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center space-x-1.5 px-1">
            <FolderOpen className="h-4 w-4 text-zinc-400" />
            <h4 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Your Saved Layouts</h4>
            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded-full">
              {configs.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportPresets}
              type="button"
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-white/10 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all focus:outline-none cursor-pointer"
              title="Export all saved presets as a JSON file"
              id="export-presets-btn"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
            <label
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-white/10 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition-all focus:outline-none cursor-pointer"
              title="Import presets from a saved JSON file"
              id="import-presets-label"
            >
              <Upload className="h-3 w-3" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportPresets}
                className="hidden"
                id="import-presets-input"
              />
            </label>
          </div>
        </div>

        {/* Modern Search & Sort Toolbar at the top */}
        {configs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 items-center">
            {/* Search Input */}
            <div className="relative sm:col-span-7">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets by name, folder, or tag..."
                className="w-full text-xs pl-8.5 pr-8 py-1.5 border border-white/10 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="preset-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 sm:col-span-5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs border border-white/10 rounded-lg px-2.5 py-1.5 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                id="top-preset-sort-select"
              >
                <optgroup label="Custom">
                  <option value="manual">Manual Priority (Drag & Drop)</option>
                </optgroup>
                <optgroup label="By Date">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </optgroup>
                <optgroup label="By Name">
                  <option value="name-az">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </optgroup>
                <optgroup label="By Tag">
                  <option value="tags-count">Most Tags</option>
                  <option value="tags-asc">First Tag (A-Z)</option>
                </optgroup>
                <optgroup label="By Product">
                  <option value="product-type">Product Type (A-Z)</option>
                </optgroup>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Category Filter Bar / Tabs */}
        {configs.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-0.5">Filter by Category Folder</span>
            <div className="flex items-center gap-1.5 pb-2 overflow-x-auto scrollbar-none">
              {["All", ...categories].map((tab) => {
                const count = tab === "All"
                  ? configs.length
                  : configs.filter((c) => (c.category || "General") === tab).length;
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border focus:outline-none cursor-pointer shadow-sm ${
                      isActive
                        ? tab === "Favorites"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 ring-1 ring-amber-500/20"
                          : tab === "T-shirts"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/20"
                          : tab === "Hoodies"
                          ? "bg-violet-500/10 text-violet-300 border-violet-500/30 ring-1 ring-violet-500/20"
                          : tab === "Office"
                          ? "bg-teal-500/10 text-teal-300 border-teal-500/30 ring-1 ring-teal-500/20"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/30 ring-1 ring-blue-500/20"
                        : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-white/5"
                    }`}
                  >
                    {tab !== "All" ? (
                      getCategoryIcon(tab)
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span>{tab}</span>
                    <span className={`text-[8px] font-mono px-1 rounded-md ${isActive ? 'bg-white/10 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtering & Sorting Controls */}
        {configs.length > 0 && (
          <div className="flex flex-col gap-2 bg-zinc-900/30 p-2.5 rounded-lg border border-white/5 space-y-1">
            <div className="flex items-center space-x-1.5 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
              <SlidersHorizontal className="h-3 w-3 text-zinc-500" />
              <span>Library Controls</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-500 block">
                  Category Folder
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  id="category-filter-select"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-500 block">
                  Product Type
                </label>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  id="product-type-filter"
                >
                  <option value="All">All Products</option>
                  {PRODUCTS.map((prod) => {
                    const hasConfigs = configs.some((c) => c.productId === prod.id);
                    if (!hasConfigs) return null;
                    return (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-500 block">
                  Filter by Tag
                </label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  id="tag-filter-select"
                >
                  <option value="All">All Tags</option>
                  {allUniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-500 block">
                  Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  id="presets-sort"
                >
                  <option value="manual">Manual Priority (Drag & Drop)</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-az">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="tags-count">Most Tags First</option>
                  <option value="tags-asc">First Tag (A-Z)</option>
                  <option value="product-type">Product Type (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {configs.length === 0 ? (
          <div className="border border-dashed border-white/10 bg-zinc-950/20 rounded-xl p-8 text-center text-zinc-500">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-xs font-semibold text-zinc-400">No custom configurations saved yet</p>
            <p className="text-[10px] text-zinc-500 mt-1">Design something unique and capture it above!</p>
          </div>
        ) : processedConfigs.length === 0 ? (
          <div className="border border-dashed border-white/5 bg-zinc-950/10 rounded-xl p-8 text-center text-zinc-500">
            <Tag className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
            <p className="text-xs font-semibold text-zinc-400">No matching presets found</p>
            <p className="text-[10px] text-zinc-500 mt-1">Try relaxing your product type or category filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bulk Action Panel / Delete Selected Button */}
            {checkedConfigIds.length > 1 && (
              <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl animate-fadeIn shadow-xl space-y-3">
                {isBatchRenaming ? (
                  <form onSubmit={handleBatchRenameSubmit} className="space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Keyboard className="h-3 w-3 text-blue-400" />
                        Batch Rename ({checkedConfigIds.length} items)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBatchRenaming(false);
                          setBatchRenamePrefix("");
                        }}
                        className="text-[9px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-zinc-850 px-1.5 py-0.5 rounded"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-semibold text-zinc-500 uppercase block">Shared Base Name</label>
                        <input
                          type="text"
                          value={batchRenamePrefix}
                          onChange={(e) => setBatchRenamePrefix(e.target.value)}
                          placeholder="e.g. Winter Mockup"
                          className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-semibold text-zinc-500 uppercase block">Start Index</label>
                        <input
                          type="number"
                          value={batchRenameStartNumber}
                          onChange={(e) => setBatchRenameStartNumber(parseInt(e.target.value) || 1)}
                          min={0}
                          className="w-full text-[10px] border border-white/10 rounded px-1.5 py-1 bg-zinc-950 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-semibold text-zinc-500 uppercase">Format:</span>
                        <select
                          value={batchRenameFormat}
                          onChange={(e) => setBatchRenameFormat(e.target.value)}
                          className="text-[9px] border border-white/10 rounded px-1 py-0.5 bg-zinc-950 text-zinc-300 focus:outline-none cursor-pointer"
                        >
                          <option value="suffix">Name - [1]</option>
                          <option value="prefix">[1] - Name</option>
                          <option value="simple">Name [1]</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-bold transition-colors cursor-pointer focus:outline-none shadow"
                      >
                        Apply Rename
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                      <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
                        {checkedConfigIds.length} Selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckedConfigIds([])}
                        className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 cursor-pointer focus:outline-none transition-colors"
                        id="deselect-all-presets-btn"
                      >
                        Clear
                      </button>
                      <span className="text-zinc-800 text-xs">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBatchRenaming(true);
                          setBatchRenamePrefix("");
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer focus:outline-none border border-white/5"
                        id="batch-rename-presets-btn"
                      >
                        <Keyboard className="h-3 w-3 text-blue-400" />
                        <span>Batch Rename</span>
                      </button>
                      <span className="text-zinc-800 text-xs">•</span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-2.5 py-1 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer focus:outline-none shadow-md shadow-red-950/20"
                        id="delete-selected-presets-btn"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {processedConfigs.map((config) => {
                const product = PRODUCTS.find((p) => p.id === config.productId);
                const productName = product ? product.name : "Custom merchandise";
                const formattedDate = new Date(config.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isChecked = checkedConfigIds.includes(config.id);

                const isDraggingMe = draggedId === config.id;
                const isDragOverMe = dragOverId === config.id;

                return (
                  <div
                    key={config.id}
                    onClick={() => handleLoad(config)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, config.id)}
                    onDragOver={(e) => handleDragOver(e, config.id)}
                    onDragEnter={(e) => handleDragEnter(e, config.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, config.id)}
                    className={`group relative flex items-center justify-between p-3 border rounded-xl hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-all cursor-pointer text-left focus:outline-none ${
                      isChecked
                        ? "bg-blue-950/20 border-blue-500/40"
                        : "bg-zinc-900/40 border-white/5"
                    } ${
                      isDraggingMe ? "opacity-30 border-dashed border-zinc-600 bg-zinc-950/40" : ""
                    } ${
                      isDragOverMe
                        ? isDropAfter
                          ? "border-b-2 border-b-blue-500 bg-zinc-800/40 shadow-md shadow-blue-950/10"
                          : "border-t-2 border-t-blue-500 bg-zinc-800/40 shadow-md shadow-blue-950/10"
                        : ""
                    }`}
                    title="Drag grip to rearrange order or click to restore design setup"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden pr-18 w-full">
                      {/* Drag Handle */}
                      <div
                        className="shrink-0 text-zinc-600 group-hover:text-zinc-400 hover:text-blue-400 p-1 cursor-grab active:cursor-grabbing transition-colors"
                        title="Drag handle to reorder preset priority"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Multi-select checkbox */}
                      <div className="shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const configId = config.id;
                            const isShiftPressed = e.shiftKey;

                            setCheckedConfigIds((prev) => {
                              const alreadyChecked = prev.includes(configId);
                              
                              if (isShiftPressed && prev.length > 0) {
                                // Find indices of last checked config and current config in processedConfigs
                                const lastCheckedId = prev[prev.length - 1];
                                const lastIdx = processedConfigs.findIndex((c) => c.id === lastCheckedId);
                                const currentIdx = processedConfigs.findIndex((c) => c.id === configId);
                                
                                if (lastIdx !== -1 && currentIdx !== -1) {
                                  const start = Math.min(lastIdx, currentIdx);
                                  const end = Math.max(lastIdx, currentIdx);
                                  const sliceIds = processedConfigs.slice(start, end + 1).map((c) => c.id);
                                  
                                  // Merge with prev without duplicates
                                  const newCheckedSet = new Set([...prev, ...sliceIds]);
                                  return Array.from(newCheckedSet);
                                }
                              }

                              return alreadyChecked
                                ? prev.filter((id) => id !== configId)
                                : [...prev, configId];
                            });
                          }}
                          className="p-1 rounded hover:bg-white/5 transition-all focus:outline-none cursor-pointer flex items-center justify-center"
                          id={`select-preset-checkbox-${config.id}`}
                          title="Select preset for bulk actions (Hold Shift for range selection)"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4.5 w-4.5 text-blue-400" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-zinc-600 hover:text-zinc-400" />
                          )}
                        </button>
                      </div>

                      {/* Visual thumbnail representation of the product, custom scene, and logo */}
                      <div
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          let x = rect.left - 232;
                          if (x < 10) {
                            x = rect.right + 12;
                          }
                          const y = rect.top + (rect.height / 2) - 110;
                          setHoveredPreviewPosition({ x, y });
                          setHoveredPreviewConfig(config);
                        }}
                        onMouseLeave={() => {
                          setHoveredPreviewConfig(null);
                          setHoveredPreviewPosition(null);
                        }}
                        className="relative w-12 h-12 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden p-0.5"
                      >
                        {config.customScene && config.customScene.imageUrl ? (
                          <img
                            src={config.customScene.imageUrl}
                            alt=""
                            className="w-full h-full object-cover rounded"
                            referrerPolicy="no-referrer"
                          />
                        ) : product ? (
                          <div
                            className="w-full h-full flex items-center justify-center opacity-85"
                            dangerouslySetInnerHTML={{ __html: product.getSvg(config.productColor) }}
                          />
                        ) : (
                          <ShoppingBag className="h-4 w-4 text-zinc-500" />
                        )}

                        {/* Overlaid Logo with exact styling & transform */}
                        {config.activeLogo && (
                          <div
                            style={{
                              position: "absolute",
                              left: `${config.customScene && config.customScene.imageUrl ? 20 : (product?.printArea?.x ?? 30)}%`,
                              top: `${config.customScene && config.customScene.imageUrl ? 20 : (product?.printArea?.y ?? 30)}%`,
                              width: `${config.customScene && config.customScene.imageUrl ? 60 : (product?.printArea?.width ?? 40)}%`,
                              height: `${config.customScene && config.customScene.imageUrl ? 60 : (product?.printArea?.height ?? 40)}%`,
                              pointerEvents: "none",
                              overflow: config.transform.smartCrop ? "hidden" : "visible",
                            }}
                          >
                            <img
                              src={config.activeLogo.processedSrc || config.activeLogo.src}
                              alt=""
                              className="absolute object-contain"
                              style={{
                                maxWidth: "70%",
                                maxHeight: "70%",
                                left: `calc(50% + ${config.transform.x}%)`,
                                top: `calc(50% + ${config.transform.y}%)`,
                                transform: `translate(-50%, -50%) rotate(${config.transform.rotation}deg) scale(${config.transform.scale})`,
                                opacity: config.transform.opacity,
                                mixBlendMode: config.transform.blendMode || "normal",
                              }}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Hover Expand Button Overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLightboxConfig(config);
                          }}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 cursor-pointer text-white z-10"
                          title="Expand Mock-up Preview"
                          id={`expand-preset-${config.id}`}
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-white/90 drop-shadow-md hover:scale-110 hover:text-white transition-all" />
                        </button>
                      </div>

                      <div className="overflow-hidden flex-1">
                        <h5 className="text-xs font-semibold text-white truncate leading-tight">
                          {config.name}
                        </h5>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] text-zinc-400 font-medium bg-zinc-850 px-1.5 py-0.5 rounded border border-white/[0.03]">
                            {productName}
                          </span>
                          <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {formattedDate}
                          </span>

                          {/* Dynamic Categorization Badge Dropdown */}
                          <select
                            value={config.category || "General"}
                            onChange={(e) => handleUpdateCategory(config.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none transition-all ${getCategoryStyles(config.category || "General")}`}
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat} className="bg-zinc-950 text-white font-medium text-xs">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tags on Card */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5" onClick={(e) => e.stopPropagation()}>
                          {config.tags && config.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {config.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-500/10"
                                >
                                  <span>{tag}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(config.id, tag)}
                                    className="hover:text-red-400 text-blue-400/60 transition-colors cursor-pointer text-[10px] leading-none"
                                    title={`Remove tag "${tag}"`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Inline Tag Editor Trigger / Form */}
                          {editingTagsPresetId === config.id ? (
                            <div className="flex items-center gap-1 animate-fadeIn bg-zinc-950/80 p-1 rounded border border-white/5">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddTag(config.id, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                className="text-[8px] font-bold border border-white/10 rounded px-1 py-0.5 bg-zinc-950 text-zinc-300 focus:outline-none cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>+ Tag...</option>
                                {["Draft", "Final", "Experiment", "Winter", "Summer", "Sprint", "Review"].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Or custom..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      handleAddTag(config.id, val);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }
                                }}
                                className="w-16 text-[8px] border border-white/10 rounded px-1 py-0.5 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setEditingTagsPresetId(null)}
                                className="text-[8px] text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer px-1.5 bg-zinc-800 rounded"
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingTagsPresetId(config.id)}
                              className="inline-flex items-center gap-0.5 text-[8px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer px-1 py-0.5 border border-dashed border-white/10 rounded"
                              title="Manage preset tags"
                            >
                              <Plus className="h-2 w-2" />
                              <span>Tags</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (visible on hover or focus) */}
                    <div className="absolute right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(config, e)}
                        className="p-1.5 rounded-md hover:bg-blue-950/80 text-zinc-500 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                        title="Duplicate configuration (branch off design)"
                        id={`duplicate-preset-${config.id}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(config.id, e)}
                        className="p-1.5 rounded-md hover:bg-red-950/80 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                        title="Delete saved configuration"
                        id={`delete-preset-${config.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer with Keyboard Shortcuts Help Tooltip */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <span>Workspace System v1.4</span>
        <div className="relative group/help">
          <button
            type="button"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 transition-colors py-1 px-2 rounded hover:bg-zinc-900 focus:outline-none cursor-pointer"
            id="keyboard-shortcuts-help-btn"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Shortcuts & Help</span>
          </button>
          
          {/* Elegant Floating Hover Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl pointer-events-none opacity-0 group-hover/help:opacity-100 group-focus-within/help:opacity-100 transition-all duration-250 z-30 translate-y-1 group-hover/help:translate-y-0 text-left font-sans leading-normal">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-2.5">
              <Keyboard className="h-4 w-4 text-blue-400" />
              <h5 className="font-bold text-white text-xs">Keyboard Shortcuts & Hotkeys</h5>
            </div>
            
            <div className="space-y-2.5 text-[11px] text-zinc-400">
              <div className="flex justify-between items-center">
                <span>Save Current Workspace</span>
                <span className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold shadow-inner">
                  Ctrl + S
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Undo Last Change</span>
                <span className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold shadow-inner">
                  Ctrl + Z
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Redo Previous Change</span>
                <span className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold shadow-inner">
                  Ctrl + Y
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Range Selection</span>
                <span className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold shadow-inner">
                  Shift + Click
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reorder Priority</span>
                <span className="bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold shadow-inner">
                  Drag & Drop
                </span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-2 mt-2.5 text-[10px] text-zinc-500 leading-relaxed font-normal">
              Hold <kbd className="bg-zinc-900 px-1 py-0.5 rounded text-[9px] border border-white/10 font-mono">Shift</kbd> while clicking a checkbox to select all presets between the last checked item and the clicked one for rapid bulk deletions.
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Preview Overlay */}
      {hoveredPreviewConfig && hoveredPreviewPosition && (
        <div
          className="fixed z-50 p-2.5 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-none flex flex-col items-center justify-center animate-fadeIn"
          style={{
            left: `${hoveredPreviewPosition.x}px`,
            top: `${hoveredPreviewPosition.y}px`,
            width: "220px",
            height: "220px",
          }}
        >
          <div className="relative w-full h-full rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden p-1.5">
            {(() => {
              const previewProduct = PRODUCTS.find((p) => p.id === hoveredPreviewConfig.productId);
              return (
                <>
                  {hoveredPreviewConfig.customScene && hoveredPreviewConfig.customScene.imageUrl ? (
                    <img
                      src={hoveredPreviewConfig.customScene.imageUrl}
                      alt=""
                      className="w-full h-full object-cover rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : previewProduct ? (
                    <div
                      className="w-full h-full flex items-center justify-center opacity-90"
                      dangerouslySetInnerHTML={{ __html: previewProduct.getSvg(hoveredPreviewConfig.productColor) }}
                    />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-zinc-500" />
                  )}

                  {/* Overlaid Logo with exact styling & transform */}
                  {hoveredPreviewConfig.activeLogo && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${hoveredPreviewConfig.customScene && hoveredPreviewConfig.customScene.imageUrl ? 20 : (previewProduct?.printArea?.x ?? 30)}%`,
                        top: `${hoveredPreviewConfig.customScene && hoveredPreviewConfig.customScene.imageUrl ? 20 : (previewProduct?.printArea?.y ?? 30)}%`,
                        width: `${hoveredPreviewConfig.customScene && hoveredPreviewConfig.customScene.imageUrl ? 60 : (previewProduct?.printArea?.width ?? 40)}%`,
                        height: `${hoveredPreviewConfig.customScene && hoveredPreviewConfig.customScene.imageUrl ? 60 : (previewProduct?.printArea?.height ?? 40)}%`,
                        pointerEvents: "none",
                        overflow: hoveredPreviewConfig.transform.smartCrop ? "hidden" : "visible",
                      }}
                    >
                      <img
                        src={hoveredPreviewConfig.activeLogo.processedSrc || hoveredPreviewConfig.activeLogo.src}
                        alt=""
                        className="absolute object-contain"
                        style={{
                          maxWidth: "70%",
                          maxHeight: "70%",
                          left: `calc(50% + ${hoveredPreviewConfig.transform.x}%)`,
                          top: `calc(50% + ${hoveredPreviewConfig.transform.y}%)`,
                          transform: `translate(-50%, -50%) rotate(${hoveredPreviewConfig.transform.rotation}deg) scale(${hoveredPreviewConfig.transform.scale})`,
                          opacity: hoveredPreviewConfig.transform.opacity,
                          mixBlendMode: hoveredPreviewConfig.transform.blendMode || "normal",
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          {/* Label overlay inside the tooltip card */}
          <div className="absolute bottom-1.5 left-2 right-2 bg-black/80 backdrop-blur-sm border border-white/10 py-1 px-2 rounded-lg text-[9px] font-medium text-zinc-200 font-mono text-center truncate shadow-lg">
            {hoveredPreviewConfig.name}
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {selectedLightboxConfig && (
        <div
          className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 animate-fadeIn"
          onClick={() => setSelectedLightboxConfig(null)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl relative flex flex-col overflow-hidden max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {selectedLightboxConfig.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryStyles(selectedLightboxConfig.category || "General")}`}>
                    {selectedLightboxConfig.category || "General"}
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    Created {new Date(selectedLightboxConfig.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLightboxConfig(null)}
                className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close lightbox"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stage */}
            <div
              className={`relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-white/5 select-none ${
                zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
              }`}
              onMouseDown={(e) => {
                if (zoom <= 1) return;
                setIsDragging(true);
                setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                const nextX = e.clientX - dragStart.x;
                const nextY = e.clientY - dragStart.y;
                // Bound the panning based on zoom level to prevent dragging too far off screen
                const maxPan = 250 * (zoom - 1);
                setPanOffset({
                  x: Math.max(-maxPan, Math.min(maxPan, nextX)),
                  y: Math.max(-maxPan, Math.min(maxPan, nextY))
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                if (zoom <= 1) return;
                const touch = e.touches[0];
                setIsDragging(true);
                setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
              }}
              onTouchMove={(e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                const nextX = touch.clientX - dragStart.x;
                const nextY = touch.clientY - dragStart.y;
                const maxPan = 250 * (zoom - 1);
                setPanOffset({
                  x: Math.max(-maxPan, Math.min(maxPan, nextX)),
                  y: Math.max(-maxPan, Math.min(maxPan, nextY))
                });
              }}
              onTouchEnd={() => setIsDragging(false)}
              onDoubleClick={() => {
                if (zoom > 1) {
                  setZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoom(2.5);
                }
              }}
            >
              {/* Zoomed/Panned Content Wrapper */}
              <div
                className="w-full h-full relative flex items-center justify-center"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                }}
              >
                {selectedLightboxConfig.customScene && selectedLightboxConfig.customScene.imageUrl ? (
                  <img
                    src={selectedLightboxConfig.customScene.imageUrl}
                    alt={selectedLightboxConfig.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (() => {
                    const p = PRODUCTS.find((prod) => prod.id === selectedLightboxConfig.productId);
                    return p ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-8 bg-zinc-950"
                        dangerouslySetInnerHTML={{ __html: p.getSvg(selectedLightboxConfig.productColor) }}
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-zinc-500" />
                    );
                  })()
                )}

                {/* Overlaid Logo with exact styling & transform */}
                {(() => {
                  const p = PRODUCTS.find((prod) => prod.id === selectedLightboxConfig.productId);
                  return selectedLightboxConfig.activeLogo ? (
                    <div
                      style={{
                        position: "absolute",
                        left: `${selectedLightboxConfig.customScene && selectedLightboxConfig.customScene.imageUrl ? 20 : (p?.printArea?.x ?? 30)}%`,
                        top: `${selectedLightboxConfig.customScene && selectedLightboxConfig.customScene.imageUrl ? 20 : (p?.printArea?.y ?? 30)}%`,
                        width: `${selectedLightboxConfig.customScene && selectedLightboxConfig.customScene.imageUrl ? 60 : (p?.printArea?.width ?? 40)}%`,
                        height: `${selectedLightboxConfig.customScene && selectedLightboxConfig.customScene.imageUrl ? 60 : (p?.printArea?.height ?? 40)}%`,
                        pointerEvents: "none",
                        overflow: selectedLightboxConfig.transform.smartCrop ? "hidden" : "visible",
                      }}
                    >
                      <img
                        src={selectedLightboxConfig.activeLogo.processedSrc || selectedLightboxConfig.activeLogo.src}
                        alt=""
                        className="absolute object-contain"
                        style={{
                          maxWidth: "70%",
                          maxHeight: "70%",
                          left: `calc(50% + ${selectedLightboxConfig.transform.x}%)`,
                          top: `calc(50% + ${selectedLightboxConfig.transform.y}%)`,
                          transform: `translate(-50%, -50%) rotate(${selectedLightboxConfig.transform.rotation}deg) scale(${selectedLightboxConfig.transform.scale})`,
                          opacity: selectedLightboxConfig.transform.opacity,
                          mixBlendMode: selectedLightboxConfig.transform.blendMode || "normal",
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Pan Helper Badge */}
              {zoom > 1 && (
                <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-md shadow-md border border-blue-500/30 flex items-center gap-1.5 backdrop-blur-sm pointer-events-none animate-fadeIn">
                  <Hand className="h-3 w-3 animate-pulse" />
                  <span>Pan Active (Drag to explore)</span>
                </div>
              )}

              {/* Zoom Control Panel */}
              <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-lg select-none z-25">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newZoom = Math.max(1, zoom - 0.5);
                    setZoom(newZoom);
                    if (newZoom === 1) setPanOffset({ x: 0, y: 0 });
                  }}
                  disabled={zoom <= 1}
                  className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer focus:outline-none"
                  title="Zoom Out"
                  id="lightbox-zoom-out-btn"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>

                <span className="text-[10px] font-mono font-bold text-zinc-300 w-11 text-center">
                  {zoom.toFixed(1)}x
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newZoom = Math.min(4, zoom + 0.5);
                    setZoom(newZoom);
                  }}
                  disabled={zoom >= 4}
                  className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer focus:outline-none"
                  title="Zoom In"
                  id="lightbox-zoom-in-btn"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>

                <div className="h-3.5 w-px bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  disabled={zoom === 1 && panOffset.x === 0 && panOffset.y === 0}
                  className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer focus:outline-none"
                  title="Reset Zoom & Pan"
                  id="lightbox-zoom-reset-btn"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Footer Specifications Info */}
            <div className="p-4 bg-zinc-950/40 border-b border-white/5 space-y-2.5">
              {/* Tags display */}
              {selectedLightboxConfig.tags && selectedLightboxConfig.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Tags:</span>
                  {selectedLightboxConfig.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-500/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Grid of parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Logo Scale</p>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {selectedLightboxConfig.transform.scale.toFixed(2)}x
                  </p>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Rotation</p>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {selectedLightboxConfig.transform.rotation}°
                  </p>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Opacity</p>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {Math.round(selectedLightboxConfig.transform.opacity * 100)}%
                  </p>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Smart Crop</p>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5 flex items-center gap-1">
                    {selectedLightboxConfig.transform.smartCrop ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <span className="text-blue-300">Centered</span>
                      </>
                    ) : (
                      "Off"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-3 bg-zinc-900 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLightboxConfig(null)}
                className="px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs font-bold text-zinc-300 hover:text-white rounded-lg transition-all focus:outline-none cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLoad(selectedLightboxConfig);
                  setSelectedLightboxConfig(null);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Restore Layout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
