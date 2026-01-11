# Developed by 3R3BOS
import os
import time
import json
import torch
import numpy as np
from PIL import Image
from aiohttp import web
from server import PromptServer
import folder_paths
import execution
import uuid
import nodes

# Global dictionary to store pending events: { node_id: { "status": "pending" | "approved" | "rejected", "event": threading.Event } }
PENDING_DECISIONS = {}

class VisualGatekeeper:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
                "prompt_id": "PROMPT_ID",
            }
        }

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "run"
    CATEGORY = "3R3BOS/Logic"
    OUTPUT_NODE = True

    def run(self, image, unique_id, prompt_id=None):
        # Ensure unique_id is a string
        unique_id = str(unique_id)
        
        # 1. Setup State
        if unique_id not in PENDING_DECISIONS:
             PENDING_DECISIONS[unique_id] = {"status": "pending"}
        
        PENDING_DECISIONS[unique_id]["status"] = "pending"
        print(f"[VisualGatekeeper] Registered node {unique_id} for review.")

        # Fallback if prompt_id is missing
        if prompt_id is None:
            prompt_id = str(uuid.uuid4())

        # 2. Save Image for Frontend
        # Convert tensor to PIL 
        # (Batch size 1 assumed for simplicity, or handle batch 0)
        img_tensor = image[0] 
        i = 255. * img_tensor.cpu().numpy()
        img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
        
        # Save to temp directory so frontend can see it
        # Naming convention: gatekeeper_{unique_id}.png
        filename = f"gatekeeper_{unique_id}_{prompt_id}.png"
        subfolder = "visual_gatekeeper"
        full_output_folder = os.path.join(folder_paths.get_temp_directory(), subfolder)
        os.makedirs(full_output_folder, exist_ok=True)
        img.save(os.path.join(full_output_folder, filename))

        # 3. Notify Frontend (optional, but good for UX updates)
        # We can send a message via websocket
        PromptServer.instance.send_sync("3r3bos.gatekeeper.show", {
            "node_id": unique_id,
            "image_url": f"/view?filename={filename}&type=temp&subfolder={subfolder}"
        })

        # 4. Blocking Loop
        print(f"[VisualGatekeeper] Node {unique_id} blocking execution. Waiting for signal...")
        while True:
            # Poll status
            current_status = PENDING_DECISIONS.get(unique_id, {}).get("status", "pending")
            
            if current_status == "approved":
                print(f"[VisualGatekeeper] Node {unique_id} APPROVED. Resuming...")
                if unique_id in PENDING_DECISIONS:
                    del PENDING_DECISIONS[unique_id]
                break
            
            if current_status == "rejected":
                print(f"[VisualGatekeeper] Node {unique_id} REJECTED. Returning image (Workflow should be interrupted by Frontend)...")
                if unique_id in PENDING_DECISIONS:
                    del PENDING_DECISIONS[unique_id]
                # We do NOT raise an exception here. 
                # The Frontend checks "Reject" and sends api.interrupt() to ComfyUI.
                # We just finish this node successfully. The execution engine will see the interrupt flag and stop.
                break

            # Sleep to prevent high CPU usage
            time.sleep(0.5)

        return (image,)


# API Endpoint Registration
@PromptServer.instance.routes.post("/3r3bos/gatekeeper/decision")
async def gatekeeper_decision(request):
    try:
        data = await request.json()
        node_id = str(data.get("node_id")) # Force string
        decision = data.get("decision") # "approve" or "reject"
        
        print(f"[VisualGatekeeper] API received decision '{decision}' for node '{node_id}'")

        if node_id in PENDING_DECISIONS:
            if decision == "approve":
                PENDING_DECISIONS[node_id]["status"] = "approved"
            elif decision == "reject":
                PENDING_DECISIONS[node_id]["status"] = "rejected"
            else:
                print(f"[VisualGatekeeper] Invalid decision: {decision}")
                return web.Response(status=400, text="Invalid decision")
            
            print(f"[VisualGatekeeper] Status updated for {node_id}")
            return web.Response(status=200, text="Decision recorded")
        else:
            print(f"[VisualGatekeeper] Node {node_id} NOT FOUND in pending list. Keys: {list(PENDING_DECISIONS.keys())}")
            return web.Response(status=404, text=f"Node {node_id} not waiting")
            
    except Exception as e:
        print(f"[VisualGatekeeper] API Error: {e}")
        return web.Response(status=500, text=str(e))
