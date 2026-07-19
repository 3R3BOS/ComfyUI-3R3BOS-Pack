# Developed by 3R3BOS
import torch
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PRESETS = {
    "Low Quality": {
        "video_qhd": 0.409600,
        "video_ltx": 0.262144,
        "video_dvd": 0.345600,
        "image_eco": 0.600000,
        "image_hunyuan": 1.048576,
        "image_pony": 0.640000,
        "image_illustrious": 1.048576,
        "legacy": 0.262144
    },
    "Middle Quality": {
        "video_qhd": 0.921600,
        "video_ltx": 0.856064,
        "video_dvd": 0.921600,
        "image_eco": 1.048576,
        "image_hunyuan": 2.097152,
        "image_pony": 1.048576,
        "image_illustrious": 1.500000,
        "legacy": 0.393216
    },
    "High Quality": {
        "video_qhd": 2.073600,
        "video_ltx": 2.073600,
        "video_dvd": 2.073600,
        "image_eco": 2.097152,
        "image_hunyuan": 4.194304,
        "image_pony": 1.500000,
        "image_illustrious": 2.359296,
        "legacy": 0.640000
    }
}

ARCHITECTURES = {
    # --- VIDEO ---
    # Wan 2.1/2.2: 3D causal VAE, 16 latent channels, 8x spatial
    "Wan Video (V2.x/V2.5)":          {"round": 16, "type": "video_qhd", "vae_factor": 8,  "channels": 16},
    # Cosmos: 16ch latent, 16x spatial compression
    "NVIDIA Cosmos (Gen/Predict)":   {"round": 16, "type": "video_dvd", "vae_factor": 16, "channels": 16},
    # Hunyuan Video: 3D causal VAE, 16ch
    "Hunyuan Video (V1/V2/V1.5)":    {"round": 16, "type": "video_qhd", "vae_factor": 8,  "channels": 16},
    # Mochi 1: 3D VAE with 12 latent channels, 8x spatial, 6x temporal
    "Mochi 1 (HD/Standard)":         {"round": 16, "type": "video_qhd", "vae_factor": 8,  "channels": 12},
    # HiDream video: uses Flux-compatible 16ch VAE
    "HiDream (Video/Dynamic)":       {"round": 16, "type": "video_qhd", "vae_factor": 8,  "channels": 16},
    # LTX Video: unique 128ch latent, 32x spatial (DC-VAE)
    "LTX Video / LTX-2":             {"round": 32, "type": "video_ltx", "vae_factor": 32, "channels": 128},
    # CogVideoX: 3D causal VAE, 16ch
    "CogVideoX":                     {"round": 32, "type": "video_dvd", "vae_factor": 8,  "channels": 16},

    # --- NEXT-GEN IMAGE ---
    # Flux: 16ch, 8x spatial
    "Flux.1 / Flux.2 [Klein]":       {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # Z-Image: 16ch (same family as Flux)
    "Z-Image Family (Base/Turbo/Edit)": {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # SANA: DC-AE f32c32, 32ch latent, 32x spatial
    "SANA-1.5 / SANA-Video":         {"round": 32, "type": "image_eco", "vae_factor": 32, "channels": 32},
    # OmniGen2: 16ch latent diffusion path
    "OmniGen / OmniGen2":            {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # Krea 2: Qwen-Image VAE, 16ch
    "Krea 2 (Turbo/Raw)":            {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # AuraFlow: 16ch latent space
    "Aura Flow":                     {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # Lumina/Lumina-Next: 16ch
    "Lumina / Lumina-Next":          {"round": 32, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # PixArt Alpha/Sigma: uses SDXL-compatible 4ch VAE
    "PixArt Alpha / Sigma":          {"round": 32, "type": "image_eco", "vae_factor": 8,  "channels": 4},
    # Hunyuan Image 1.0: 16ch, 8x
    "Hunyuan Image 1.0":             {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    # Hunyuan Image 2.1: 16ch, 32x spatial compression
    "Hunyuan Image 2.1 (2K)":        {"round": 16, "type": "image_hunyuan", "vae_factor": 32, "channels": 16},

    # --- SDXL / PONY ---
    "SDXL (Base/Turbo/Lightning)":   {"round": 8,  "type": "image_pony", "vae_factor": 8,  "channels": 4},
    "Pony / Pony V7":                {"round": 8,  "type": "image_pony", "vae_factor": 8,  "channels": 4},
    "Kolors (Kwai)":                 {"round": 8,  "type": "image_pony", "vae_factor": 8,  "channels": 4},
    "Illustrious / NoobAI":          {"round": 8,  "type": "image_illustrious", "vae_factor": 8,  "channels": 4},

    # --- LEGACY ---
    # SD3.x: 16ch VAE
    "SD 3.5 (Large/Turbo)":          {"round": 64, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    "SD 3.0":                        {"round": 16, "type": "image_eco", "vae_factor": 8,  "channels": 16},
    "SD 1.5 / LCM":                  {"round": 8,  "type": "legacy",    "vae_factor": 8,  "channels": 4}
}

def pil2tensor(image):
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)

class AspectRatioMaster:
    @classmethod
    def INPUT_TYPES(s):
        sorted_archs = sorted(list(ARCHITECTURES.keys()))
        priority = [
            "Wan Video (V2.x/V2.5)", 
            "Flux.1 / Flux.2 [Klein]", 
            "Z-Image Family (Base/Turbo/Edit)", 
            "NVIDIA Cosmos (Gen/Predict)"
        ]
        for p in reversed(priority):
            if p in sorted_archs:
                sorted_archs.insert(0, sorted_archs.pop(sorted_archs.index(p)))

        return {
            "required": {
                "use_custom_ratio": ("BOOLEAN", {"default": False, "label_on": "CUSTOM ON", "label_off": "CUSTOM OFF"}),
                "custom_width": ("INT", {"default": 1024, "min": 64, "max": 8192, "step": 8}),
                "custom_height": ("INT", {"default": 1024, "min": 64, "max": 8192, "step": 8}),
                "model_arch": (sorted_archs, {"default": "Wan Video (V2.x/V2.5)"}),
                "performance_mode": (["Low Quality", "Middle Quality", "High Quality"], {"default": "Middle Quality"}),
                "aspect_ratio": ([
                    "1:1 (Square)", "4:3 (Photo)", "3:4 (Portrait)",
                    "16:9 (Cinematic)", "9:16 (Stories)", "21:9 (Ultrawide)",
                    "9:21 (Tower)", "3:2 (DSLR)", "2:3 (Classic)",
                    "2:1 (Univisium)", "1:2 (Portrait Extra)", "5:4 (Medium)", "4:5 (Social)"
                ], {"default": "16:9 (Cinematic)"}),
                "use_batch": ("BOOLEAN", {"default": False, "label_on": "BATCH ON", "label_off": "BATCH OFF"}),
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 64}),
                "custom_scale_factor": ("FLOAT", {"default": 1.0, "min": 0.5, "max": 2.0, "step": 0.05}),
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
        img = Image.new('RGBA', (W, H), (36, 39, 48, 255))
        draw = ImageDraw.Draw(img)

        for i in range(0, W, 40): draw.line([(i, 0), (i, H)], fill=(45, 48, 58, 255))
        for i in range(0, H, 40): draw.line([(0, i), (W, i)], fill=(45, 48, 58, 255))

        f_xl = self.get_font(60)
        f_md = self.get_font(24)
        f_sm = self.get_font(16)

        draw.rectangle([0, 0, 300, H], fill=(27, 30, 36, 255))
        draw.line([(300, 0), (300, H)], fill=(38, 42, 51, 255), width=2)

        y = 40
        def draw_label(lbl, val, col="#ffffff"):
            nonlocal y
            draw.text((20, y), lbl, fill="#8f9cae", font=f_sm)
            draw.text((20, y+20), str(val), fill=col, font=f_md)
            y += 70

        short_arch = arch_name.split('(')[0].split('/')[0].strip()
        draw_label("ARCHITECTURE", short_arch, "#00b4d8")
        draw_label("QUALITY", mode_name.upper(), "#00b4d8")
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

        border_col = (0, 180, 216)
        draw.rectangle([x1, y1, x2, y2], fill=(0, 180, 216, 40), outline=border_col, width=3)
        
        txt = f"{width} x {height}"
        bbox = draw.textbbox((0,0), txt, font=f_xl)
        tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
        
        draw.text((cx - tw/2 + 2, cy - th/2 + 2), txt, fill=(0, 0, 0, 255), font=f_xl)
        draw.text((cx - tw/2, cy - th/2), txt, fill=(255, 255, 255, 255), font=f_xl)

        return pil2tensor(img.convert('RGB'))

    def scout(self, model_arch, performance_mode, aspect_ratio, use_custom_ratio, custom_width, custom_height, use_batch, batch_size, custom_scale_factor, unique_id):
        conf = ARCHITECTURES.get(model_arch, ARCHITECTURES["Wan Video (V2.x/V2.5)"])
        round_to = conf["round"]
        arch_type = conf["type"]
        vae_factor = conf.get("vae_factor", 8)
        latent_channels = conf.get("channels", 4)

        selected_preset = PRESETS.get(performance_mode, PRESETS["Middle Quality"])
        base_mp = selected_preset.get(arch_type, 1.0)
        final_mp = base_mp * (custom_scale_factor ** 2)

        if use_custom_ratio:
            w = int(round((custom_width * custom_scale_factor) / round_to) * round_to)
            h = int(round((custom_height * custom_scale_factor) / round_to) * round_to)
        else:
            rw, rh = 1.0, 1.0
            try:
                p = aspect_ratio.split(' ')[0].split(':')
                rw, rh = float(p[0]), float(p[1])
            except:
                rw, rh = 1.0, 1.0

            pixels = final_mp * 1_000_000
            s = (pixels / (rw * rh)) ** 0.5
            w = int(round(s * rw / round_to) * round_to)
            h = int(round(s * rh / round_to) * round_to)

        b_count = batch_size if use_batch else 1
        latent = torch.zeros([b_count, latent_channels, h // vae_factor, w // vae_factor])

        batch_str = str(b_count) if use_batch else "SINGLE"
        ratio_str_val = f"{w}:{h}" if use_custom_ratio else aspect_ratio
        prev = self.create_preview_image(w, h, ratio_str_val, model_arch, performance_mode, batch_str)

        return (w, h, {"samples": latent}, prev)
