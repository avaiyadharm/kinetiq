from PIL import Image, ImageDraw, ImageEnhance, ImageOps
import os
import random

def draw_scientific_diagram(img, sim_id):
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    # Common colors (Neon)
    colors = {
        "cyan": (0, 255, 255, 180),
        "magenta": (255, 0, 255, 180),
        "yellow": (255, 255, 0, 180),
        "orange": (255, 165, 0, 180),
        "emerald": (0, 255, 127, 180),
        "red": (255, 50, 50, 180),
        "white": (255, 255, 255, 180)
    }
    
    # CATEGORY: MECHANICS
    if sim_id == "projectile-motion":
        draw.arc([w//4, h//4, 3*w//4, 3*h//4], start=180, end=360, fill=colors["emerald"], width=5)
    elif sim_id == "circular-motion":
        draw.ellipse([w//2-50, h//2-50, w//2+50, h//2+50], outline=colors["cyan"], width=4)
        draw.line([w//2, h//2, w//2+50, h//2], fill=colors["cyan"], width=3)
    elif sim_id == "momentum":
        draw.ellipse([w//3-20, h//2-20, w//3+20, h//2+20], fill=colors["yellow"])
        draw.ellipse([2*w//3-20, h//2-20, 2*w//3+20, h//2+20], fill=colors["magenta"])
        draw.line([w//3+20, h//2, 2*w//3-20, h//2], fill=colors["white"], width=2)

    # CATEGORY: THERMO
    elif sim_id == "carnot-engine":
        points = [(w//4, h//4), (3*w//4, h//4 + 20), (2*w//3, 3*h//4), (w//3, 3*h//4 - 20), (w//4, h//4)]
        draw.line(points, fill=colors["orange"], width=5)
    elif sim_id == "kinetic-theory":
        for _ in range(30):
            x, y = random.randint(50, w-50), random.randint(50, h-50)
            draw.ellipse([x-3, y-3, x+3, y+3], fill=colors["emerald"])

    # CATEGORY: WAVES
    elif sim_id == "resonance":
        for i in range(5):
            draw.ellipse([w//2 - i*20, h//2 - i*20, w//2 + i*20, h//2 + i*20], outline=colors["magenta"], width=2)
    elif sim_id == "sound-waves":
        for i in range(10):
            draw.line([w//4 + i*20, h//4, w//4 + i*20, 3*h//4], fill=colors["cyan"], width=3)

    return img

def create_truly_unique_variant(base_path, output_name, sim_id, tint=None):
    if not os.path.exists(base_path):
        print(f"Base image not found: {base_path}")
        return
    
    img = Image.open(base_path).convert("RGBA")
    
    if tint:
        # Improved tint using color multiply or blend
        overlay = Image.new("RGBA", img.size, tint + (100,))
        img = Image.alpha_composite(img, overlay)
        
    img = draw_scientific_diagram(img, sim_id)
    img.save(f"public/images/simulations/{output_name}.png")
    print(f"Created: {output_name}.png")

base_dir = "public/images/simulations/"

# Comprehensive Unique List
labs = [
    ("projectile-motion", "projectile-motion", "projectile-motion", (0, 255, 100)),
    ("newtons-laws", "newtons-laws", "newtons-laws", (255, 255, 255)),
    ("circular-motion", "circular-motion", "circular-motion", (0, 100, 255)),
    ("momentum", "momentum", "momentum", (255, 200, 0)),
    ("collision", "collision", "collision", (255, 50, 50)),
    ("wave-interference", "wave-interferenc", "wave-interferenc", (255, 0, 255)),
    ("standing-waves", "standing-waves", "standing-waves", (0, 255, 255)),
    ("resonance", "resonance", "resonance", (255, 0, 150)),
    ("sound-waves", "sound-wave", "sound-wave", (0, 150, 255)),
    ("gas-laws", "gas-laws", "gas-laws", (255, 255, 0)),
    ("carnot-engine", "carnot-engine", "carnot-engine", (255, 100, 0)),
    ("kinetic-theory", "kinetic-theory", "kinetic-theory", (0, 255, 100)),
    ("heat-transfer", "heat-transfer", "heat-transfer", (255, 0, 100)),
    ("thermal-expansion", "thermal-expansion", "thermal-expansion", (255, 255, 150)),
]

for sim_id, base, output, tint in labs:
    create_truly_unique_variant(f"{base_dir}{base}.png", output, sim_id, tint)
