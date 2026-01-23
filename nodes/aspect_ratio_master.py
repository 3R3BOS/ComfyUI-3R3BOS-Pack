# Developed by 3R3BOS - Version 1.0.6 (Full 2026 Sync & No Deletion)
import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Target MP (MegaPixels) configuration per performance mode
PRESETS = {
    "Speed / Draft": {
        "video": 0.409600,     
        "video_ltx": 0.262144, 
        "image": 0.600000,     
        "legacy": 0.262144
    },
    "Community / Labs 🧪": {
        "video_qhd": 0.522240, 
        "video_ltx": 1.048576, 
        "video_dvd": 0.345600, 
        "image_eco": 1.500000, 
        "image_pony": 1.254400, 
        "legacy": 0.393216     
    },
    "Standard / Native": {
        "video": 0.921600,     
        "video_ltx": 0.856064, 
        "image": 1.048576,     
        "image_hunyuan": 4.194304, 
        "legacy": 0.262144
    }
}

# Architecture database with rounding constraints and VAE factor
ARCHITECTURES = {
    # --- VIDEO ---
    "Wan Video (All Versions)":      {"round": 16, "type": "video_qhd", "vae_factor": 8},
    "Hunyuan Video (V1/V2)":         {"round": 16, "type": "video_qhd", "vae_factor": 8},
    "Mochi 1 (HD/Standard)":         {"round": 16, "type": "video_qhd", "vae_factor": 8},
    "HiDream (Video/Dynamic)":       {"round": 16, "type": "video_qhd", "vae_factor": 8},
    "LTX Video / LTX-2":             {"round": 32, "type": "video_ltx", "vae_factor": 8},
    "CogVideoX":                     {"round": 32, "type": "video_dvd", "vae_factor": 8},

    # --- NEXT-GEN IMAGE ---
    "Flux.1 / Flux.2 [Klein]":       {"round": 16, "type": "image_eco", "vae_factor": 8},
    "Z Image Turbo":                 {"round": 16, "type": "image_eco", "vae_factor": 8},
    "Aura Flow":                     {"round": 16, "type": "image_eco", "vae_factor": 8},
    "Lumina / Lumina-Next":          {"round": 32, "type": "image_eco", "vae_factor": 8},
    "PixArt Alpha / Sigma":          {"round": 32, "type": "image_eco", "vae_factor": 8},
    "Hunyuan Image 1.0":             {"round": 16, "type": "image_eco", "vae_factor": 8},
    "Hunyuan Image 2.1 (2K)":        {"round": 16, "type": "image_hunyuan", "vae_factor": 8},

    # --- SDXL / PONY ---
    "SDXL (Base/Turbo/Lightning)":   {"round": 8,  "type": "image_pony", "vae_factor": 8},
    "Pony / Pony V7":                {"round": 8,  "type": "image_pony", "vae_factor": 8},
    "Kolors (Kwai)":                 {"round": 8,  "type": "image_pony", "vae_factor": 8},
    "Illustrious / NoobAI":          {"round": 8,  "type": "image_pony", "vae_factor": 8},

    # --- LEGACY & SPECIAL ---
    "SD 3.5 (Large/Turbo)":          {"round": 64, "type": "image_eco", "vae_factor": 8},
    "SD 3.0":                        {"round": 16, "type": "image_eco", "vae_factor": 8},
    "SD 1.5 / LCM":                  {"round": 8,  "type": "legacy", "vae_factor": 8}
}

def pil2tensor(image):
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)

class AspectRatioMaster:
    @classmethod
    def INPUT_TYPES(s):
        sorted_archs = sorted(list(ARCHITECTURES.keys()))
        # Priority cleanup and synchronization
        priority = ["Wan Video (All Versions)", "Flux.1 / Flux.2 [Klein]", "SDXL (Base/Turbo/Lightning)", "LTX Video / LTX-2"]
        for p in reversed(priority):
            if p in sorted_archs:
                sorted_archs.insert(0, sorted_archs.pop(sorted_archs.index(p)))

        return {
            "required": {
                "model_arch": (sorted_archs, {"default": "Wan Video (All Versions)"}),
                "performance_mode": (["Speed / Draft", "Community / Labs 🧪", "Standard / Native"], {"default": "Standard / Native"}),
                
                "aspect_ratio": ([
                    "1:1 (Square)",
                    "4:3 (Photo)", "3:4 (Portrait)",
                    "16:9 (Cinematic)", "9:16 (Stories)",
                    "21:9 (Ultrawide)", "9:21 (Tower)",
                    "3:2 (DSLR)", "2:3 (Classic)",
                    "2:1 (Univisium)",
                    "5:4 (Medium)", "4:5 (Social)",
                    "Custom"
                ], {"default": "16:9 (Cinematic)"}),

                "orientation_override": (["Auto", "Force Landscape", "Force Portrait"], {"default": "Auto"}),
                "use_batch": ("BOOLEAN", {"default": False, "label_on": "BATCH ON", "label_off": "BATCH OFF"}),
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 64}),
                "custom_scale_factor": ("FLOAT", {"default": 1.0, "min": 0.5, "max": 2.0, "step": 0.05, "tooltip": "Multiplier applied to base resolution"}),
            },
            "hidden": {"unique_id": "UNIQUE_ID"},
        }

    RETURN_TYPES = ("INT", "INT", "LATENT", "IMAGE")
    RETURN_NAMES = ("width", "height", "empty_latent", "preview")
    FUNCTION = "scout"
    CATEGORY = "3R3BOS/Utils"

    def get_font(self, size):
        fonts = ["arial.ttf", "segoeui.ttf", "Roboto-Regular.ttf", "DejaVuSans.ttf"]
        for font_name in fonts:
            try: return ImageFont.truetype(font_name, size)
            except IOError: continue
        return ImageFont.load_default()

    def create_preview_image(self, width, height, ratio_str, arch_name, mode_name, batch_info):
        W, H = 800, 400
        img = Image.new('RGB', (W, H), (20, 20, 22))
        draw = ImageDraw.Draw(img)

        # Grid background
        for i in range(0, W, 40): draw.line([(i, 0), (i, H)], fill=(30, 30, 35))
        for i in range(0, H, 40): draw.line([(0, i), (W, i)], fill=(30, 30, 35))

        f_xl = self.get_font(60)
        f_md = self.get_font(24)
        f_sm = self.get_font(16)

        draw.rectangle([0, 0, 300, H], fill=(12, 12, 14))
        draw.line([(300,0), (300,H)], fill=(60,60,60), width=2)

        y = 40
        def draw_label(lbl, val, col="#fff"):
            nonlocal y
            draw.text((20, y), lbl, fill="#888", font=f_sm)
            draw.text((20, y+20), str(val), fill=col, font=f_md)
            y += 70

        short_arch = arch_name.split('(')[0].split('/')[0].strip()
        short_mode = mode_name.split('/')[0].strip()
        
        mode_col = "#00FFFF" # Standard
        if "Labs" in mode_name: mode_col = "#FF00FF" # Magenta
        if "Speed" in mode_name: mode_col = "#FFFF00" # Yellow

        draw_label("ARCHITECTURE", short_arch, "#00FF88")
        draw_label("MODE", short_mode.upper(), mode_col)
        draw_label("ASPECT RATIO", ratio_str.split(' ')[0])
        if batch_info != "SINGLE":
            draw_label("BATCH", batch_info, "#FF0055")

        cx, cy = 300 + (W-300)//2, H//2
        scale = 0.15
        bw, bh = width * scale, height * scale
        
        max_w, max_h = 450, 350
        if bw > max_w: s=max_w/bw; bw*=s; bh*=s
        if bh > max_h: s=max_h/bh; bw*=s; bh*=s

        x1, y1 = cx - bw/2, cy - bh/2
        x2, y2 = cx + bw/2, cy + bh/2

        border_col = (255, 0, 255) if "Labs" in mode_name else (0, 255, 136)
        if "Speed" in mode_name: border_col = (255, 255, 0)
        
        fill_col = (*border_col, 40) if len(border_col) == 3 else (0, 255, 136, 40)

        draw.rectangle([x1, y1, x2, y2], fill=fill_col, outline=border_col, width=3)
        
        txt = f"{width} x {height}"
        bbox = draw.textbbox((0,0), txt, font=f_xl)
        tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
        
        draw.text((cx - tw/2 + 2, cy - th/2 + 2), txt, fill="black", font=f_xl)
        draw.text((cx - tw/2, cy - th/2), txt, fill="white", font=f_xl)

        return pil2tensor(img)

    def scout(self, model_arch, performance_mode, aspect_ratio, orientation_override, use_batch, batch_size, custom_scale_factor, unique_id):
        # 1. Configuration Retrieval
        conf = ARCHITECTURES.get(model_arch, ARCHITECTURES["Wan Video (All Versions)"])
        round_to = conf["round"]
        arch_type = conf["type"]
        vae_factor = conf.get("vae_factor", 8) # Dynamic VAE factor retrieval

        # 2. Preset Selection
        if "Labs" in performance_mode:
            selected_preset = PRESETS["Community / Labs 🧪"]
        elif "Speed" in performance_mode:
            selected_preset = PRESETS["Speed / Draft"]
        else:
            selected_preset = PRESETS["Standard / Native"]
            
        if arch_type in selected_preset:
            base_mp = selected_preset[arch_type]
        else:
            generic_key = "legacy" if "legacy" in arch_type else ("video" if "video" in arch_type else "image")
            base_mp = selected_preset.get(generic_key, 1.0)

        # 3. Resolution Calculation
        final_mp = base_mp * (custom_scale_factor ** 2)

        try:
            p = aspect_ratio.split(' ')[0].split(':')
            rw, rh = float(p[0]), float(p[1])
        except: rw, rh = 1.0, 1.0

        r_val = rw / rh
        if orientation_override == "Force Portrait" and r_val > 1: rw, rh = rh, rw
        elif orientation_override == "Force Landscape" and r_val < 1: rw, rh = rh, rw

        pixels = final_mp * 1_000_000
        s = (pixels / (rw * rh)) ** 0.5
        w = int(round(s * rw / round_to) * round_to)
        h = int(round(s * rh / round_to) * round_to)

        # 4. Adaptive Latent Generation
        b_count = batch_size if use_batch else 1
        # Use vae_factor for latent space calculation
        latent = torch.zeros([b_count, 4, h // vae_factor, w // vae_factor])
        
        batch_str = str(b_count) if use_batch else "SINGLE"
        prev = self.create_preview_image(w, h, aspect_ratio, model_arch, performance_mode, batch_str)
        
        return (w, h, {"samples": latent}, prev)
