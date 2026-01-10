# Author: 3R3BOS

from .image_comparer_slider import RefinerCompareNode

NODE_CLASS_MAPPINGS = {
    "RefinerCompareNode": RefinerCompareNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "RefinerCompareNode": "Image Comparer Slider (3R3BOS)"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
