import torch
import numpy as np
from PIL import Image
import folder_paths
import os

class RefinerCompareNode:
    def __init__(self):
        self.output_dir = folder_paths.get_temp_directory()
        self.type = "temp"

    @classmethod
    def INPUT_TYPES(s):
        # Dynamically generate 20 inputs.
        # image_1 is required, others (2 to 20) are optional.
        input_dict = {
            "required": {
                "image_1": ("IMAGE",),
            },
            "optional": {}
        }
        
        # Generating slots image_2 to image_20
        for i in range(2, 21):
            input_dict["optional"][f"image_{i}"] = ("IMAGE",)
            
        return input_dict

    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = "compare_images"
    CATEGORY = "image"

    def compare_images(self, image_1, **kwargs):
        results = []
        subfolder = "refiner_compare_cache"
        full_output_dir = os.path.join(self.output_dir, subfolder)
        
        if not os.path.exists(full_output_dir):
            os.makedirs(full_output_dir)

        # 1. Retrieve all inputs into a dictionary
        images_map = {1: image_1}
        
        # 2. Iterate through optional arguments (image_2, etc.)
        for key, value in kwargs.items():
            if key.startswith("image_") and value is not None:
                try:
                    idx = int(key.split("_")[1])
                    images_map[idx] = value
                except ValueError:
                    continue

        # 3. Sort images by their number to ensure slider order
        sorted_indices = sorted(images_map.keys())
        
        global_index = 0

        # 4. Processing and Saving
        for idx in sorted_indices:
            tensor_batch = images_map[idx]
            
            # Batch handling (if an input contains multiple images)
            for i in range(tensor_batch.shape[0]):
                tensor = tensor_batch[i]
                
                # Conversion Tensor -> Numpy -> PIL
                array = 255. * tensor.cpu().numpy()
                image = Image.fromarray(np.clip(array, 0, 255).astype(np.uint8))

                # Unique name with random to prevent browser caching
                filename = f"comp_{global_index}_{os.urandom(4).hex()}.png"
                image.save(os.path.join(full_output_dir, filename))

                results.append({
                    "filename": filename,
                    "subfolder": subfolder,
                    "type": self.type
                })
                global_index += 1

        # TRICK: We use "slider_images" instead of "images" 
        # so ComfyUI doesn't display its default gallery in duplicate.
        return {"ui": {"slider_images": results}}
