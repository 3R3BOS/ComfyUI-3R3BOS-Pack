# Developed by 3R3BOS
import torch
import os
import json
import time
import random
import folder_paths
import numpy as np
from PIL import Image
from server import PromptServer
from aiohttp import web

# Global cache for selection data
SELECTION_CACHE = {}

class CancelledException(Exception):
    pass


# Register API route to receive selection from frontend
if hasattr(PromptServer.instance, "routes"):
    @PromptServer.instance.routes.post("/3r3bos/batch_selection")
    async def selection_handler(request):
        try:
            data = await request.json()
            node_id = str(data.get("id"))
            indices = data.get("selection") # List of integers
            
            if node_id is None or indices is None:
                return web.json_response({"error": "Missing id or selection"}, status=400)

            SELECTION_CACHE[node_id] = indices
            return web.json_response({"status": "received"})
        except Exception as e:
            print(f"[3R3BOS] Error in selection_handler: {e}")
            return web.json_response({"error": str(e)}, status=500)

class BatchSelector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("selected_images",)
    FUNCTION = "select_batch"
    CATEGORY = "3R3BOS/Image"
    OUTPUT_NODE = True

    def select_batch(self, images, unique_id):
        if unique_id in SELECTION_CACHE:
            del SELECTION_CACHE[unique_id]

        batch_size = images.shape[0]
        temp_dir = folder_paths.get_temp_directory()
        filenames = []

        for i in range(batch_size):
            # Convert tensor to PIL
            i_tensor = images[i]
            img_np = 255. * i_tensor.cpu().numpy()
            img = Image.fromarray(np.clip(img_np, 0, 255).astype(np.uint8))
            
            # Save with unique name
            prefix = f"3r3bos_batch_{unique_id}_{i}_{int(time.time())}"
            filename = f"{prefix}.png"
            img.save(os.path.join(temp_dir, filename))
            filenames.append(filename)

        # Notify frontend
        PromptServer.instance.send_sync("3r3bos-batch-selector-start", {
            "id": unique_id,
            "images": filenames,
            "count": batch_size
        })

        # Wait for response (with heartbeat)
        last_send_time = time.time()
        
        while unique_id not in SELECTION_CACHE:
            current_time = time.time()
            if current_time - last_send_time > 2.0:
                # Resend event every 2 seconds to ensure frontend gets it
                PromptServer.instance.send_sync("3r3bos-batch-selector-start", {
                    "id": unique_id,
                    "images": filenames,
                    "count": batch_size
                })
                last_send_time = current_time
            
            time.sleep(0.1)

        selected_indices = SELECTION_CACHE.pop(unique_id)
        if not selected_indices:
            # Empty selection triggers a pass-through of original images (or handle as cancellation)
            return (images,)
        
        selected_indices = [int(i) for i in selected_indices if 0 <= int(i) < batch_size]
        
        if not selected_indices:
             return (images,)

        # Slicing
        
        filtered_images = images[selected_indices]

        return (filtered_images,)

    @classmethod
    def IS_CHANGED(s, images, unique_id):
        # Always re-run because it involves user interaction
        return float("nan")
