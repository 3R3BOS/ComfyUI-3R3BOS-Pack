# ComfyUI 3R3BOS Pack

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.1-blue?style=for-the-badge)
![Registry](https://img.shields.io/badge/Comfy_Registry-er3bos-black?style=for-the-badge&logo=comfyui)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)

<br>

**The essential toolkit to master control and visualization in your ComfyUI workflows.**
Created to simplify complex interactions, this **evolving suite** brings professional "Human-in-the-Loop" tools and zero-latency visualization to your generation process.

[Installation](#installation) — [Report Bug](https://github.com/3R3BOS/ComfyUI-3R3BOS-Pack/issues)

</div>

<br>

## 📦 The Collection

This pack is designed to grow. Currently, it includes two core tools focused on UX and Efficiency.

---

### 1. Visual Gatekeeper (Logic)
**"Stop wasting GPU time on bad generations."**
The Visual Gatekeeper brings a true "Pause" button to ComfyUI. It halts the workflow after an initial generation, allowing you to approve or reject the image before sending it to expensive Refiners or Upscalers.

#### 🎥 Gatekeeper Demo
https://github.com/user-attachments/assets/a0ce436b-20b6-45a4-9dad-97841de2be94

* **Human-in-the-Loop:** Grants you manual control over the generation pipeline.
* **Clear UX:** Large preview with prominent **APPROVE** (Green) and **REJECT** (Red) buttons.
* **Resource Saving:** Instantly cancels the rest of the workflow if the image is rejected.

> **Node Name:** `Visual Gatekeeper`
> **Menu:** `3R3BOS/Logic`

---

### 2. Image Comparer Slider (Visualization)
**"The ultimate A/B testing tool."**
A high-performance slider to compare Checkpoints, LoRAs, or "Before/After" Upscaling results with zero latency.

#### 🎥 Slider Demo
https://github.com/user-attachments/assets/f10d6c4d-be38-40c9-9cec-135250451fa9

* **Dynamic Inputs:** Automatically creates up to 20 input slots as you connect wires.
* **Zero-Lag:** Client-side caching ensures 60fps scrubbing.
* **Auto-Compaction:** Smart inputs reorganize themselves if you disconnect a source.

> **Node Name:** `Image Comparer Slider`
> **Menu:** `3R3BOS/Image`

<br>

## 🚀 Installation

### Option A: ComfyUI Manager (Recommended)
1. Open **ComfyUI Manager** in your browser.
2. Search for: `3R3BOS Pack`.
3. Click **Install** and Restart ComfyUI.

### Option B: Comfy Registry (CLI)
If you are using the official `comfy-cli`, you can install the pack directly with:
```bash
comfy node install 3r3bos-pack
