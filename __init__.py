# Developed by 3R3BOS
from .nodes.visual_gatekeeper import VisualGatekeeper
from .nodes.image_comparer_slider import ImageComparerSlider

NODE_CLASS_MAPPINGS = {
    "Visual Gatekeeper (3R3BOS)": VisualGatekeeper,
    "Image Comparer (3R3BOS)": ImageComparerSlider
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "Visual Gatekeeper (3R3BOS)": "Visual Gatekeeper",
    "Image Comparer (3R3BOS)": "Image Comparer Slider"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
