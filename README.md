# ComfyUI 3R3BOS Pack

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.2-blue?style=for-the-badge)
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

This pack is designed to grow. Currently, it includes two core tools focused on UX and Efficiency.

---

### 1. Batch Selector (Control)
**"Filter your generations like a Pro."**
The Batch Selector replaces the need for complex preview-and-cancel workflows. It pauses execution, allowing you to visually select the best candidates from a batch before passing them downstream.

#### 🎥 Selector Demo
https://github.com/user-attachments/assets/a7475e56-9183-4be0-87c8-7816d6574f7c

#### Features
*   **Native Canvas UI:** A responsive, pixel-perfect interface drawn directly in the node graph. No floating HTML windows.
*   **Intelligent Layout:** Automatically adjusts the grid to fit your image aspect ratios (Portrait/Landscape) without distortion.
*   **Zero-Overhead:** Only passes the selected images to the next node (Upscaler, Saver, etc.), saving massive GPU time.
*   **Workflow Control:** Includes a dedicated **CANCEL** button to instantly stop the workflow if the batch is unsatisfactory.

> **Node Name:** `Batch Selector`
> **Menu:** `3R3BOS`

---

### 2. Image Comparer Slider (Visualization)
**"The ultimate A/B testing tool."**
A high-performance slider to compare Checkpoints, LoRAs, or "Before/After" Upscaling results with zero latency.

#### 🎥 Slider Demo
https://github.com/user-attachments/assets/f10d6c4d-be38-40c9-9cec-135250451fa9

*   **Dynamic Inputs:** Automatically creates up to 20 input slots as you connect wires.
*   **Zero-Lag:** Client-side caching ensures 60fps scrubbing.
*   **Auto-Compaction:** Smart inputs reorganize themselves if you disconnect a source.

> **Node Name:** `Image Comparer Slider`
> **Menu:** `3R3BOS/Image`

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

### v1.0.2
*   **NEW NODE:** Introduced `Batch Selector`. A powerful replacement for the deprecated Visual Gatekeeper.
*   **REMOVED:** `Visual Gatekeeper` (replaced by Batch Selector).
*   **UI OVERHAUL:** Unified design language across all nodes (Sober/Monochrome aesthetic).
*   **PERFORMANCE:** Native canvas rendering for Batch Selector eliminates HTML overlay issues.
