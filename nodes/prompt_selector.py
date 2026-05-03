# Developed by 3R3BOS
import os
import json
from aiohttp import web
from server import PromptServer
import folder_paths

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts_db.json")

if hasattr(PromptServer.instance, "routes"):
    @PromptServer.instance.routes.get("/3r3bos/prompts_db")
    async def get_prompts_db(request):
        try:
            if not os.path.exists(DB_PATH):
                return web.json_response({"error": "prompts_db.json not found"}, status=404)
            with open(DB_PATH, "r", encoding="utf-8") as f:
                db_data = json.load(f)
            return web.json_response(db_data)
        except Exception as e:
            print(f"[3R3BOS] Error reading prompts_db.json: {e}")
            return web.json_response({"error": str(e)}, status=500)

    @PromptServer.instance.routes.post("/3r3bos/prompts_db/save")
    async def save_prompts_db(request):
        try:
            data = await request.json()
            with open(DB_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            return web.json_response({"status": "success"})
        except Exception as e:
            print(f"[3R3BOS] Error saving prompts_db.json: {e}")
            return web.json_response({"error": str(e)}, status=500)

class PromptSelector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "selected_items": ("STRING", {"default": "[]"}),
                "custom_text": ("STRING", {"default": ""})
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "build_prompt"
    CATEGORY = "3R3BOS/Text"
    
    def build_prompt(self, selected_items, custom_text=""):
        if custom_text and custom_text.strip():
            return (custom_text.strip(),)

        try:
            selected_ids = json.loads(selected_items)
            if not isinstance(selected_ids, list):
                selected_ids = []
        except:
            selected_ids = []

        snippets = []
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, "r", encoding="utf-8") as f:
                    db_data = json.load(f)
                
                id_to_prompt = {}
                for category, subcats in db_data.items():
                    for subcat, items in subcats.items():
                        if subcat == "_meta": continue
                        for item in items:
                            if "id" in item and "prompt" in item:
                                id_to_prompt[item["id"]] = item["prompt"]
                
                for item_id in selected_ids:
                    if item_id in id_to_prompt:
                        snippets.append(id_to_prompt[item_id])
            except Exception as e:
                print(f"[3R3BOS] Error processing prompts_db: {e}")
        
        parts = []
        parts.extend(snippets)
        final_prompt = ", ".join(parts)
        final_prompt = final_prompt.replace(", ,", ",")
        
        return (final_prompt,)

    @classmethod
    def IS_CHANGED(s, selected_items, custom_text=""):
        return selected_items + custom_text
