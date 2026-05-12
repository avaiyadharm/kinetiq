from PIL import Image, ImageEnhance, ImageOps
import os

def create_unique_variant(base_path, output_name, hue_shift=0, rotate=0, mirror=False, contrast=1.0):
    if not os.path.exists(base_path):
        print(f"Base image not found: {base_path}")
        return
    
    img = Image.open(base_path).convert("RGBA")
    
    if mirror:
        img = ImageOps.mirror(img)
    
    if rotate != 0:
        img = img.rotate(rotate, expand=False)
    
    if contrast != 1.0:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(contrast)
        
    # Simple color shift by rotating hue (simulated with basic color matrix or similar)
    # Since PIL doesn't have a direct hue-shift, we'll do a simple color tint for now
    if hue_shift != 0:
        r, g, b, a = img.split()
        # Very crude hue shift by swapping channels
        if hue_shift == 1: # Reddish
            img = Image.merge("RGBA", (r, b, g, a))
        elif hue_shift == 2: # Bluish
            img = Image.merge("RGBA", (b, g, r, a))
        elif hue_shift == 3: # Greenish
            img = Image.merge("RGBA", (g, r, b, a))
            
    img.save(f"public/images/simulations/{output_name}.png")
    print(f"Created: {output_name}.png")

# Base directory
base_dir = "public/images/simulations/"

# Mappings (Name, Base, hue_shift, rotate, mirror, contrast)
variants = [
    ("resonance", "wave-interference", 1, 15, False, 1.2),
    ("sound-waves", "wave-interference", 2, -15, True, 1.1),
    ("shm-waves", "projectile-motion", 3, 45, False, 1.3),
    ("pendulum", "projectile-motion", 2, 180, True, 1.0),
    ("heat-transfer", "thermal-expansion", 1, 90, False, 1.4),
    ("carnot-engine", "gas-laws", 2, 30, True, 1.2),
    ("kinetic-theory", "gas-laws", 3, -30, False, 1.1),
    ("capacitors", "circuits-lab", 1, 10, False, 1.3),
    ("ohms-law", "circuits-lab", 2, -10, True, 1.2),
    ("induction", "magnetic-fields", 3, 20, False, 1.1),
    ("mirrors", "optics", 1, 5, True, 1.4),
    ("lenses", "optics", 2, -5, False, 1.3),
    ("refraction", "optics", 3, 12, True, 1.2),
    ("diffraction", "optics", 1, -12, False, 1.1),
    ("interference-optics", "optics", 2, 25, True, 1.5),
    ("radioactivity", "atomic-models", 1, 40, False, 1.2),
    ("quantum-effects", "atomic-models", 3, -40, True, 1.4),
]

for name, base, h, r, m, c in variants:
    create_unique_variant(f"{base_dir}{base}.png", name, h, r, m, c)
