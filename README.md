# ComfyUI Image Comparer Slider

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-black?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)

<br>

**A seamless, high-performance image comparison node designed for efficiency.**
Streamline your workflow with smart input management and zero-latency scrubbing.

[View Demo](#demo) — [Installation](#installation) — [Documentation](#usage)

</div>

<br>

## Overview

The **Image Comparer Slider** addresses the clutter of traditional comparison workflows. It replaces manual wiring and gallery reloading with a single, intelligent node that adapts to your graph.

| Core Capabilities | |
| :--- | :--- |
| **Dynamic Inputs** | Slots are generated on-demand. Connect a wire, and a new slot appears automatically. |
| **Auto-Compaction** | Disconnecting a source automatically reorganizes the inputs to remove gaps. |
| **Native Integration** | A custom-rendered slider within the node allowing for precise "Before/After" analysis. |
| **Performance** | Built-in Javascript caching ensures 60fps scrubbing with no server round-trips. |

---

## Demo

https://github.com/user-attachments/assets/4fa94f00-4c20-4478-9fbd-3ca0467015da

---

## Installation

### Option A: ComfyUI Manager
The recommended way to install.
1.  Open **ComfyUI Manager**
2.  Search for: `Image Comparer Slider`
3.  Install and Restart

### Option B: Manual Clone
To install via terminal:

```bash
cd ComfyUI/custom_nodes/
git clone [https://github.com/3R3BOS/ComfyUI-Image_Comparer_Slider.git](https://github.com/3R3BOS/ComfyUI-Image_Comparer_Slider.git)
