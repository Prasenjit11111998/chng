# Chng — Product Requirements Document

**Version:** 1.0  
**Status:** Revamped  
**Last Updated:** June 2026  

---

## 1. Overview

### 1.1 Product Summary

Chng is a personal browser-based toolkit for fast, private image processing. Every tool runs entirely client-side — no uploads, no servers, no accounts. The product is designed around dedicated client-side tools running in WebAssembly (ImageMagick), starting with a Format Converter and an Image Compressor.

### 1.2 Problem Statement

Common image tasks like format conversion and compression require either: (a) slow, bloated desktop software, or (b) online tools that upload your files to third-party servers. Neither is acceptable for someone who values speed, privacy, and simplicity. Most tools also force unnecessary workflows — multi-step wizards, ads, sign-up walls — for what should be a five-second job.

### 1.3 Vision

A minimal, fast, keyboard-friendly toolkit that gets out of the way. You drop a file, you get a result. No friction, no tracking, no setup. The browser is the platform.

---

## 2. Core Principles

| Principle | Definition |
|---|---|
| Privacy First | Zero data leaves the browser. No analytics on file content. No uploads. |
| WebAssembly Powered | ImageMagick compiled to WASM is utilized for reliable, professional-grade local conversion and compression. |
| Performance First | No loading states longer than 300ms. Compression and conversion must feel instant. |
| Tool Independence | Each tool is a self-contained feature slice. Adding or removing one does not affect others. |
| Zero Setup | Clone, install, run. No environment variables, no backend, no external services. |

---

## 3. Target Users

**Primary:** Developers, designers, and power users who regularly work with images and want a fast local alternative to online tools.

**Secondary:** Anyone who needs to compress or convert an image quickly without installing software or visiting a slow ad-heavy website.

**User mindset:** Values keyboard shortcuts, hates unnecessary steps, trusts tools that are transparent about what they do with files.

---

## 4. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 19 | Component model, modern hooks, declarative rendering |
| Build Tool | Vite 8 | Ultra-fast HMR, minimal config, optimized production bundling |
| Language | TypeScript (strict) | Type safety across slices, better developer experience |
| State | Redux Toolkit + React Redux | Feature slice pattern, predictable state management |
| Navigation | Tab-based View Switcher | High-performance inline state routing |
| Styling | Tailwind CSS v3 + Sass (SCSS) | Premium monochrome design system, 60-30-10 styling formula |
| Image Processing | ImageMagick WebAssembly (`magick-wasm`) | Highly reliable, professional image decoding, encoding, resizing, and stripping |
| Archive | Client Zip / Fflate | Client-side zip generation for batch downloads |
| Font | Geist Sans & Geist Mono (via Fontsource) | Sleek, modern typography |
| Service Worker | Service Worker Cache | Pre-caches worker files and magick.wasm for instant startup |

---

## 5. Navigation Model

Chng features a premium horizontal navbar navigation bar at the top of the viewport. It allows users to quickly jump between the two primary workspaces:
1. **Converter** (for format conversion)
2. **Compressor** (for target size optimization)

Settings and about views are accessible via inline overlays or dedicated switches.

---

## 6. Information Architecture

- **Converter View** — Image conversion dropzone and output format selector.
- **Compressor View** — Image compression dropzone, per-file target size input (KB/MB), starting quality range slider, and batch download.

---

## 7. Feature Specifications

### 7.1 Tool: Format Converter

**Purpose:** Convert images between formats entirely in the browser using ImageMagick WASM.

**Supported input formats:** JPG, JPEG, PNG, WebP, GIF, SVG, BMP, ICO, CR2, CR3, NEF, DNG, TIFF, and other raw/modern image formats.  
**Supported output formats:** WebP, JPEG, PNG, BMP, GIF, ICO, and more.

**Functional requirements:**
- User can upload one or multiple image files via drag-and-drop or file picker
- System auto-detects the input format and lets user pick the output format
- User clicks "Convert All" to process the batch
- A progress indicator shows current file and overall progress
- User can download files individually or as a single ZIP
- User can clear all files and results

---

### 7.2 Tool: Image Compressor

**Purpose:** Compress images to a user-specified target file size using iterative WebAssembly quality and scale reduction.

**Supported input formats:** JPG, JPEG, PNG, WebP, and other ImageMagick formats (PNG/BMP/GIF are converted to JPEG for lossy target compression).

**Functional requirements:**
- User uploads one or multiple image files
- User sets a target size in KB or MB via numeric input
- Quality slider (10–100%) provides a starting quality hint — the algorithm iterates from this value downward
- User clicks "Compress All" to process the batch
- Algorithm iteratively reduces quality and/or scale to reach the target size
- Progress indicator shows current file progress
- Output filename appends `_cmp` before the extension

**Compression algorithm:**
1. Start at user-specified quality
2. Clone image in WASM memory
3. If scale < 1.0, resize image
4. Strip EXIF metadata and write image to bytes at current quality
5. If byte size <= target: output compressed file
6. If byte size > target: reduce quality by 8%, retry
7. If quality < 15%: reduce scale by 5%, reset quality, retry
8. Stop when target is met, scale < 20%, or quality < 10%

---

## 8. Out of Scope

- User accounts or saved history
- Server-side processing of any kind
- Audio or video files (removed FFmpeg)
- Document conversion (removed Pandoc)
- Internationalization

---

*Chng is a personal project. Simplicity is a feature. Complexity is a bug.*
