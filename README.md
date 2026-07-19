# ComfyUI 3R3BOS Pack

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.8-blue?style=for-the-badge)
![Registry](https://img.shields.io/badge/Comfy_Registry-er3bos-black?style=for-the-badge&logo=comfyui)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)

![3R3BOSicon](https://github.com/user-attachments/assets/92fe4504-0521-4685-bbe3-5774cee78dad)

<br>

**The essential toolkit to master control, prompting, and visualization in your ComfyUI workflows.**
Created to simplify complex interactions, this **evolving suite** brings professional "Human-in-the-Loop" tools, dynamic prompt databases, and zero-latency visualization to your generation process.

[Installation](#installation) — [Report Bug](https://github.com/3R3BOS/ComfyUI-3R3BOS-Pack/issues)

</div>

<br>

## 📦 The Collection

This pack is designed to grow. Currently, it includes four core tools focused on UX and Efficiency.

---

### 1. Prompt Selector (Database & Management)
**"Your Ultimate Personal Prompt & LoRA's trigger words Library."**
Stop copying and pasting text from notepads. The Prompt Selector is a visually stunning, fully interactive database built right into the ComfyUI canvas.

#### 🎥 Prompt Selector Demo
https://github.com/user-attachments/assets/6082f4a2-eb26-4c3d-a688-73d135b33cdc

#### Features
*   **Built-in Database Editor:** Create, rename, and delete Categories, Subcategories, and Prompt tags directly inside the node. No need to edit JSON files manually.
*   **Cascading Color System:** Assign custom colors to your categories (e.g., Red for NSFW, Blue for Styles). The interface automatically inherits these colors using a beautiful "Glassmorphism" UI with neon accents.
*   **Not just for Styles:** Perfect for storing complex prompt engineering tricks, or even **LoRA Trigger Words** so you never forget them!
*   **Live Preview & Override:** See your final concatenated prompt in real-time in the bottom terminal window. Need a quick tweak? Click `✏️ Edit Live Prompt` to manually add custom text or adjust weights without changing your saved templates.
*   **Indestructible Layout:** The node automatically resizes and distributes vertical space depending on how many tags you select.

> [!WARNING]
> **Data Security:** Your prompts are saved locally in the `prompts_db.json` file inside the node folder. **Please make regular backups of this file** before updating or reinstalling your ComfyUI to ensure you never lose your library!

> **Node Name:** `Prompt Selector`
> **Menu:** `3R3BOS/Text`

---

### 2. Batch Selector (Control)
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

### 3. Image Comparer Slider (Visualization)
**"The ultimate A/B testing tool."**
A high-performance slider to compare Checkpoints, LoRAs, or "Before/After" Upscaling results with zero latency.

#### 🎥 Image Comparer Slider Demo
https://github.com/user-attachments/assets/abe6becf-a282-4232-a537-d704b12ec7c0

#### Features
*   **Slate-Cyan Premium Theme:** Sleek slate-steel body background (`#242730`) with dark title headers (`#1b1e24`) and soft cyan blue accents (`#00b4d8`) to match Aspect Ratio Master.
*   **Texture Inspector (Synchronized Pan & Zoom):** Zoom in with the mouse wheel centered on your cursor and pan by dragging (left/middle click). The view remains perfectly synchronized across all compared images. Double-click to reset.
*   **Auto-Loop Playback:** Dedicated Play/Pause button (`▶` / `⏸`) to automatically scroll through images in a smooth forward/reverse ping-pong loop at ~12 FPS. Perfect for video generations and batch testing.
*   **Smart Source Tracker:** Automatically traces and displays the exact connected source node name (e.g. `KSampler Face`, `Upscale 4x`) under the slider.
*   **Dynamic Inputs:** Automatically creates up to 20 input slots as you connect wires.
*   **Zero-Lag:** Client-side caching ensures 60fps scrubbing.
*   **Auto-Compaction & Memory Safe:** Smart inputs reorganize themselves upon wire disconnection. Includes full Pointer Capture events and automatic lifecycle garbage collection to prevent browser leaks.

> **Node Name:** `Image Comparer (3R3BOS)`
> **Menu:** `3R3BOS/Image`

---

### 4. Aspect Ratio Master (Ultimate)
**"The definitive resolution calculator."**
Stop guessing resolutions. The Aspect Ratio Master provides a smart, visual interface to select the perfect resolution for any modern model, guaranteeing strict adherence to specific VAE compression requirements.

#### 🎥 Aspect Ratio Master Demo
https://github.com/user-attachments/assets/5df2d21f-075e-4837-a77c-06d6c206c6cc

#### Features
*   **Aero Sky Blue Theme:** High-contrast professional design with matte obsidian base (`#111216`), frosted grid cards, and sky-blue accents (`#00a2ff`).
*   **Next-Gen Support (2026):** Full native configuration for **NVIDIA Cosmos (Gen/Predict)**, **SANA-1.5 / SANA-Video**, **Wan Video (V2.x/V2.5)**, **Hunyuan Video**, **CogVideoX**, **Mochi 1**, **HiDream**, **LTX Video / LTX-2**, **Z-Image Family**, **Flux.1/2**, **Krea 2**, **AuraFlow**, **Lumina**, **OmniGen / OmniGen2**, **SD 3.x**, **Hunyuan Image 1.0 / 2.1**, **SDXL**, **Pony**, **Illustrious / NoobAI**, **SD 1.5** — each with its correct latent channel count and VAE compression factor.
*   **Correct Latent Channels per Architecture:** Each model outputs the exact right latent shape — `4ch` for SDXL/SD1.5, `12ch` for Mochi, `16ch` for Flux/Wan/SD3/CogVideoX/etc., `32ch` for SANA, `128ch` for LTX Video — preventing channel mismatch crashes with the VAE decoder.
*   **Direct Pixel Inputs & Custom Toggle:** Toggle switch (`CUSTOM ON / OFF`) placed at the top of the node, with integer fields (`custom_width` & `custom_height`) that auto-scale and round safely to prevent PyTorch tensor mismatch crashes.
*   **VAE Latent Shape Ticker:** Real-time bottom status bar showing final output dimensions, megapixels count, and exact VAE latent shapes (e.g. `128x64` latents) before queueing.
*   **Interactive 🔄 Swap:** Swap preset ratios symmetrically (including `2:1 (Univisium)` and `1:2 (Portrait Extra)`), or swap custom width and height values directly when custom mode is enabled.
*   **Size Lock Protection:** Restricts minimum dimensions to `380x680` to prevent resizing overlaps.

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

## 📜 Update Log

### v1.0.8
*   **CRITICAL FIX — Aspect Ratio Master:** Latent channel count was hardcoded to `4` for every architecture. All modern models (Flux, Wan, SD3, CogVideoX, Hunyuan Video, Cosmos, etc.) were generating an incorrect latent shape, causing VAE decode crashes or silent grey outputs. Each architecture now outputs the exact correct channel count: `4ch` (SDXL/SD1.5), `12ch` (Mochi 1), `16ch` (Flux/Wan/SD3/CogVideoX/HiDream/Krea2/AuraFlow/Lumina/Z-Image/OmniGen/Hunyuan Image/Cosmos), `32ch` (SANA-1.5), `128ch` (LTX Video).
*   **FIX — VAE Compression Factor:** `LTX Video` corrected from `vae_factor=8` to `vae_factor=32` (DC-VAE). `Hunyuan Image 2.1` corrected from `vae_factor=8` to `vae_factor=32` (32× spatial compression). `PixArt Alpha/Sigma` corrected to `4ch` (uses SDXL-compatible VAE, not a 16ch architecture).

### v1.0.7
*   **PREMIUM SLATE-CYAN THEME:** Complete visual redesign of both **Aspect Ratio Master** and **Image Comparer Slider** with a unified premium Slate-Steel grey theme (`#242730`) and soft cyan blue accents (`#00b4d8`).
*   **ASPECT RATIO MASTER REFACTOR:** Integrated support for modern 2026 architectures (NVIDIA Cosmos, SANA-1.5, Wan Video, Z-Image, OmniGen), direct custom pixel inputs, real-time VAE latent shape tracking, canvas shadow bleed isolation, and layout dimension locks.
*   **IMAGE COMPARER SLIDER OVERHAUL:** Added a Synchronized Texture Inspector (Pointer Pan & Zoom), Auto-Play Ping-Pong loop functionality, dynamic source node name tracking, memory-safe pointer capture handlers, and automated cache cleanup routines.

### v1.0.6
*   **NEW NODE:** Introduced **Prompt Selector**. A massive interactive database to store and organize your prompts, styles, and LoRA trigger words.
*   **PREMIUM UI:** Built completely in native Canvas with dark mode, linear gradients, and a cascading color customization system.
*   **WORKFLOW:** Added a built-in UI editor to Create, Rename, and Delete categories and prompts without ever leaving ComfyUI.
*   **FLEXIBILITY:** Features a Live Preview terminal with manual text override capabilities.

### v1.0.5
*   **CRITICAL FIX:** Solved `Batch Selector` freezing issue when switching browser tabs during generation.
*   **ROBUSTNESS:** Implemented "Heartbeat" mechanism to ensure the UI never loses connection with the backend.
*   **STABILITY:** Added crash protection for corrupt or incomplete images in the preview grid.

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
