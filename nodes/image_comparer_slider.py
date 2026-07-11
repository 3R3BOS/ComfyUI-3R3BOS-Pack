# Developed by 3R3BOS
import torch
import numpy as np
from PIL import Image
import folder_paths
import os

class ImageComparerSlider:
    def __init__(self):
        self.output_dir = folder_paths.get_temp_directory()
        self.type = "temp"

    @classmethod
    def INPUT_TYPES(s):
        input_dict = {
            "required": {
                "image_1": ("IMAGE",),
            },
            "optional": {}
        }
        for i in range(2, 21):
            input_dict["optional"][f"image_{i}"] = ("IMAGE",)
            
        return input_dict

    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = "compare_images"
    CATEGORY = "3R3BOS/Image"

    def compare_images(self, image_1, **kwargs):
        results = []
        subfolder = "3r3bos_slider_cache"
        full_output_dir = os.path.join(self.output_dir, subfolder)
        
        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)
        else:
            # OPTIMISATION C : Nettoyage automatique du cache précédent
            for f in os.listdir(full_output_dir):
                if f.startswith("comp_") and f.endswith(".png"):
                    try:
                        os.remove(os.path.join(full_output_dir, f))
                    except:
                        pass

        images_map = {1: image_1}
        for key, value in kwargs.items():
            if key.startswith("image_") and value is not None:
                try:
                    idx = int(key.split("_")[1])
                    images_map[idx] = value
                except ValueError:
                    continue

        sorted_indices = sorted(images_map.keys())
        global_index = 0

        for idx in sorted_indices:
            tensor_batch = images_map[idx]
            
            for i in range(tensor_batch.shape[0]):
                tensor = tensor_batch[i]
                
                array = 255. * tensor.cpu().numpy()
                array = np.clip(array, 0, 255).astype(np.uint8)
                
                # Sécurité pour les images monochromes/grayscale [H, W, 1]
                if array.shape[-1] == 1:
                    array = array.squeeze(-1)

                image = Image.fromarray(array)

                filename = f"comp_{global_index}_{os.urandom(4).hex()}.png"
                image.save(os.path.join(full_output_dir, filename))

                # BUG A FIX : On passe le slot_index d'origine (0-based) au frontend
                results.append({
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": self.type,
                    "slot_index": idx - 1
                })
                global_index += 1

        return {"ui": {"slider_images": results}}
