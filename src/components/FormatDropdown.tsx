import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { updateFileTo, removeFile, uploadAndAddFiles, vertFileRegistry } from '../store/filesSlice';
import { ChevronDown, Search as SearchIcon } from 'lucide-react';
import { m } from '../lib/paraglide/messages';
import { converters, categories as defaultCategories, byNative } from '../lib/converters';
import { ChngFile } from '../lib/types/ChngFile';

interface FormatDropdownProps {
  categories: typeof defaultCategories;
  from?: string;
  selected?: string;
  onselect?: (option: string) => void;
  disabled?: boolean;
  dropdownSize?: "default" | "large" | "small";
  file?: any; // ChngFileState
}

export const FormatDropdown: React.FC<FormatDropdownProps> = ({
  categories,
  from,
  selected = '',
  onselect,
  disabled = false,
  dropdownSize = "default",
  file,
}) => {
  const [open, setOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"left" | "center" | "right">("center");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();

  // Pick optimal category on initial load
  useEffect(() => {
    if (currentCategory) return;

    const pickCategoryFromConverters = (convList: any[]) => {
      let bestCategory: string | null = null;
      let maxOverlap = 0;

      for (const cat of Object.keys(categories)) {
        const overlapCount = categories[cat].formats.filter((fmt) =>
          convList.some((conv) => conv.formatStrings().includes(fmt)),
        ).length;

        if (overlapCount > maxOverlap) {
          maxOverlap = overlapCount;
          bestCategory = cat;
        }
      }

      return bestCategory;
    };

    let convertersToCheck = [];
    if (file) {
      // Find converters for the file
      const match = converters.filter(c => c.formatStrings().includes(file.from));
      convertersToCheck = match;
    } else {
      convertersToCheck = converters;
    }

    const detectedCategory = pickCategoryFromConverters(convertersToCheck) || Object.keys(categories)[0];
    setCurrentCategory(detectedCategory);
  }, [file, categories, currentCategory]);

  // Available categories to convert to
  const availableCategories = useMemo(() => {
    if (!currentCategory) return Object.keys(categories);
    
    let finalCategories = Object.keys(categories).filter(
      (cat) => cat === currentCategory || categories[currentCategory]?.canConvertTo?.includes(cat)
    );

    if (from === ".gif") {
      finalCategories = Array.from(new Set([...finalCategories, "video"]));
    }

    if (file && file.size > 2 * 1024 * 1024 * 1024) { // Large file check
      if (currentCategory === "video") {
        finalCategories = finalCategories.filter((cat) => cat !== "audio");
      }
    }

    return finalCategories;
  }, [currentCategory, categories, from, file]);

  const shouldInclude = (format: string): boolean => {
    if (from && categories["audio"]?.formats.includes(from) && format === ".gif") {
      return false;
    }
    return true;
  };

  // Filtered formats based on search query
  const filteredData = useMemo(() => {
    const normalize = (str: string) => str.replace(/^\./, "").toLowerCase();
    
    if (!searchQuery) {
      const formats = currentCategory
        ? categories[currentCategory].formats.filter(shouldInclude)
        : [];
      return {
        categories: availableCategories,
        formats,
      };
    }

    const searchLower = normalize(searchQuery);
    const matchingCategories = availableCategories.filter((cat) =>
      categories[cat].formats.some((format) => normalize(format).includes(searchLower) && shouldInclude(format))
    );

    if (matchingCategories.length === 0) {
      return {
        categories: availableCategories,
        formats: [],
      };
    }

    let filteredFormats = currentCategory
      ? categories[currentCategory].formats.filter(
          (format) => normalize(format).includes(searchLower) && shouldInclude(format)
        )
      : [];

    filteredFormats = [...filteredFormats].sort((a, b) => {
      const aExact = normalize(a) === searchLower;
      const bExact = normalize(b) === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return {
      categories: matchingCategories,
      formats: filteredFormats,
    };
  }, [searchQuery, currentCategory, availableCategories, categories, from]);

  const selectOption = (option: string) => {
    console.log("[FormatDropdown] selectOption called with:", option);
    if (file) {
      dispatch(updateFileTo({ id: file.id, to: option }));
    }
    onselect?.(option);
    setOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      const queryLower = query.toLowerCase().replace(/^\./, "");
      const categoriesWithMatches = availableCategories.filter((cat) =>
        categories[cat].formats.some((format) => format.replace(/^\./, "").toLowerCase().includes(queryLower))
      );

      if (categoriesWithMatches.length > 0) {
        const currentHasMatches = currentCategory && categories[currentCategory].formats.some((format) =>
          format.replace(/^\./, "").toLowerCase().includes(queryLower)
        );

        if (!currentHasMatches) {
          setCurrentCategory(categoriesWithMatches[0]);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredData.formats.length > 0) {
        selectOption(filteredData.formats[0]);
      }
    }
  };

  const clickDropdown = () => {
    const nextOpen = !open;
    console.log("[FormatDropdown] clickDropdown called, nextOpen:", nextOpen);
    setOpen(nextOpen);

    if (nextOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      let widthFactor = 2.5;

      if (dropdownSize === "large") widthFactor = 3.2;
      else if (dropdownSize === "small") widthFactor = 1.5;

      const dropdownWidth = rect.width * widthFactor;
      const centerX = rect.left + rect.width / 2;
      const leftEdge = centerX - dropdownWidth / 2;
      const rightEdge = centerX + dropdownWidth / 2;

      if (leftEdge < 0) {
        setDropdownPosition("left");
      } else if (rightEdge > viewportWidth) {
        setDropdownPosition("right");
      } else {
        setDropdownPosition("center");
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    try {
      const { extractZip } = await import('../lib/util/zip');
      
      const originalChngFile = vertFileRegistry.get(file.id);
      if (!originalChngFile) return;

      const extractedFiles = await extractZip(originalChngFile.file);
      if (extractedFiles.length === 0) return;

      const newFiles = extractedFiles.map(({ filename, data }) => {
        return new File([data as any], filename, { type: "application/octet-stream" });
      });

      dispatch(removeFile(file.id));
      // @ts-expect-error thunk expects File[]
      dispatch(uploadAndAddFiles(newFiles));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const contains = dropdownRef.current?.contains(target);
      const isAttached = target && document.body.contains(target);
      console.log("[FormatDropdown] handleClickOutside: target:", target, "contains:", contains, "isAttached:", isAttached);
      if (target && !document.body.contains(target)) {
        console.log("[FormatDropdown] handleClickOutside: target is detached, ignoring");
        return;
      }
      if (dropdownRef.current && !contains) {
        console.log("[FormatDropdown] handleClickOutside: clicked outside, setting open to false");
        setOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Format category translation key mapping
  const categoryLabel = (cat: string) => {
    if (cat === 'image') return m["convert.dropdown.image"]();
    if (cat === 'video') return m["convert.dropdown.video"]();
    if (cat === 'audio') return m["convert.dropdown.audio"]();
    if (cat === 'doc') return m["convert.dropdown.doc"]();
    return cat;
  };

  return (
    <div className="relative w-full text-xs font-semibold text-center" ref={dropdownRef}>
      <button
        type="button"
        className={`relative flex items-center justify-center w-full font-display h-10 px-3 bg-button rounded-full overflow-hidden pixel-btn ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={clickDropdown}
        disabled={disabled}
      >
        <span className="font-body font-semibold truncate max-w-[4rem] text-foreground">
          {selected || "N/A"}
        </span>
        <ChevronDown
          size={16}
          className={`ml-3 mt-0.5 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      {open && (
        <div
          ref={dropdownMenuRef}
          onClick={(e) => e.stopPropagation()}
          className={`min-w-full shadow-xl bg-panel-alt absolute top-full mt-2 z-50 rounded-2xl overflow-hidden border border-separator ${
            dropdownSize === "large" ? 'w-[320%]' : dropdownSize === "small" ? 'w-[150%]' : 'w-[250%]'
          } ${
            dropdownPosition === "center" ? '-translate-x-1/2 left-1/2' : dropdownPosition === "left" ? 'left-0' : 'right-0'
          }`}
        >
          {/* Search box */}
          <div className="p-3 w-full">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={m["convert.dropdown.placeholder"]()}
                className="flex-grow w-full !pl-11 !pr-10 rounded-lg bg-panel text-foreground py-2 text-sm focus:outline-accent border-2 border-button"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-muted">
                <SearchIcon size={16} />
              </span>
              {searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  {filteredData.formats.length}
                </span>
              )}
            </div>
          </div>

          {/* Categories Tab Header */}
          <div className="flex items-center justify-between border-b border-separator">
            {filteredData.categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`flex-grow text-sm hover:text-foreground border-b-2 pb-2 capitalize bg-transparent border-none cursor-pointer ${
                  currentCategory === category
                    ? 'text-accent border-accent font-semibold'
                    : 'border-transparent text-muted'
                }`}
                onClick={() => setCurrentCategory(category)}
              >
                {categoryLabel(category)}
              </button>
            ))}
          </div>

          {/* Formats Grid */}
          <div className="max-h-60 overflow-y-auto grid grid-cols-3 gap-1.5 p-2">
            {filteredData.formats.length > 0 ? (
              filteredData.formats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className={`w-full p-2 text-center rounded-xl text-sm border-none cursor-pointer ${
                    format === selected
                      ? 'bg-accent text-on-accent font-semibold'
                      : format === from
                        ? 'bg-separator text-on-accent opacity-60'
                        : 'hover:bg-panel text-foreground bg-transparent'
                  }`}
                  onClick={() => selectOption(format)}
                >
                  {format}
                </button>
              ))
            ) : (
              <div className="col-span-3 text-center p-4 text-muted text-sm font-normal">
                {searchQuery
                  ? m["convert.dropdown.no_results"]()
                  : m["convert.dropdown.no_formats"]()}
              </div>
            )}
          </div>

          {/* Zip extract option */}
          {file?.name.toLowerCase().endsWith(".zip") && (
            <div className="border-t border-separator text-sm p-2">
              <button
                type="button"
                className="w-full p-2 text-center rounded-lg bg-accent text-on-accent font-semibold border-none cursor-pointer"
                onClick={handleExtract}
              >
                {m["convert.archive_file.extract"]()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default FormatDropdown;
