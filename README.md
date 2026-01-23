# ComfyUI 3R3BOS Pack

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.4-blue?style=for-the-badge)
![Registry](https://img.shields.io/badge/Comfy_Registry-er3bos-black?style=for-the-badge&logo=comfyui)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)

![3R3BOSicon](https://github.com/user-attachments/assets/92fe4504-0521-4685-bbe3-5774cee78dad)

<br>

**The essential toolkit to master control and visualization in your ComfyUI workflows.**
Created to simplify complex interactions, this **evolving suite** brings professional "Human-in-the-Loop" tools and zero-latency visualization to your generation process.

[Installation](#installation) — [Report Bug](https://github.com/3R3BOS/ComfyUI-3R3BOS-Pack/issues)

</div>

<br>

## 📦 The Collection

This pack is designed to grow. Currently, it includes three core tools focused on UX and Efficiency.

---

### 1. Batch Selector (Control)
**"Filter your generations like a Pro."**
The Batch Selector replaces the need for complex preview-and-cancel workflows. It pauses execution, allowing you to visually select the best candidates from a batch before passing them downstream.

#### 🎥 Batch Selector Demo
https://github.com/user-attachments/assets/a7475e56-9183-4be0-87c8-7816d6574f7c

#### Features
*   **Native Canvas UI:** A responsive, pixel-perfect interface drawn directly in the node graph. No floating HTML windows.
*   **Intelligent Layout:** Automatically adjusts the grid to fit your image aspect ratios (Portrait/Landscape) without distortion.
*   **Zero-Overhead:** Only passes the selected images to the next node (Upscaler, Saver, etc.), saving massive GPU time.
*   **Workflow Control:** Includes a dedicated **CANCEL** button to instantly stop the workflow if the batch is unsatisfactory.

> **Node Name:** `Batch Selector`
> **Menu:** `3R3BOS/Image`

---

### 2. Image Comparer Slider (Visualization)
**"The ultimate A/B testing tool."**
A high-performance slider to compare Checkpoints, LoRAs, or "Before/After" Upscaling results with zero latency.

#### 🎥 Image Comparer Slider Demo
https://github.com/user-attachments/assets/ebc723e3-692f-49ff-b843-7601d938e799

#### Features
*   **Dynamic Inputs:** Automatically creates up to 20 input slots as you connect wires.
*   **Zero-Lag:** Client-side caching ensures 60fps scrubbing.
*   **Auto-Compaction:** Smart inputs reorganize themselves if you disconnect a source.

> **Node Name:** `Image Comparer Slider`
> **Menu:** `3R3BOS/Image`

---

### 3. Aspect Ratio Master (Ultimate)
**"The definitive resolution calculator."**
Stop guessing resolutions. The Aspect Ratio Master provides a smart, visual interface to select the perfect resolution for any modern model (SDXL, Flux, Wan, LTX, etc.), guaranteeing adherence to specific VAE requirements (Mod16, Mod32, Mod64).

#### 🎥 Aspect Ratio Master Demo
https://github.com/user-attachments/assets/80087374-b33f-4037-830b-8e42a4efdd65

#### Features
*   **Smart Database (2026):** Native support for **Hunyuan 2.1 (2K)**, **Wan 2.2**, **Flux.2**, and **LTX Video**.
*   **Magic Numbers:** Automatically calculates the exact pixel dimensions to avoid artifacts (e.g., Mod32 for LTX).
*   **Visual Grid:** A beautiful, real-time preview of your aspect ratio and resolution.
*   **Labs Mode 🧪:** Unlocks "Sweet Spot" resolutions used by the community for maximum quality (e.g., 1.5MP for Flux).

> **Node Name:** `Aspect Ratio Master`
> **Menu:** `3R3BOS/Utils`

---

<br>

##  Installation

### Option A: ComfyUI Manager (Recommended)
1. Open **ComfyUI Manager** in your browser.
2. Search for: `3R3BOS Pack`.
3. Click **Install** and Restart ComfyUI.

### Option B: Comfy Registry (CLI)
If you are using the official `comfy-cli`, you can install the pack directly with:
```bash
comfy node install 3r3bos-pack
```

### Option C: Manual
Clone this repository into your `custom_nodes` folder:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/3R3BOS/ComfyUI-3R3BOS-Pack.git
```

<br>

## Update Log

### v1.0.4
*   **NEW NODE:** Introduced **Aspect Ratio Master**. The ultimate tool for calculating optimal resolutions for SDXL, Flux, Wan, LTX, Etc.
*   **FULL SYNC:** Includes "Magic Numbers" for 2026 models (Hunyuan 2.1, Wan 2.2).
*   **STABILITY:** Enforced strict Mod64/Mod32 constraints to prevent VAE artifacts.
*   **BUGFIX:** Moved `Batch Selector` to the `3R3BOS/Image` menu category for better organization.

### v1.0.3
*   **BUGFIX:** Batch Selector now correctly scales images using 'contain' mode, preventing edge cropping on non-square images (Fixes Issue #3).

### v1.0.2
*   **NEW NODE:** Introduced `Batch Selector`. A powerful replacement for the deprecated Visual Gatekeeper.
*   **REMOVED:** `Visual Gatekeeper` (replaced by Batch Selector).
*   **UI OVERHAUL:** Unified design language across all nodes (Sober/Monochrome aesthetic).
*   **PERFORMANCE:** Native canvas rendering for Batch Selector eliminates HTML overlay issues.
