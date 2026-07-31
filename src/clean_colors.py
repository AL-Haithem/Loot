import os
import re

css_dir = r"c:\Users\haith\Desktop\Loot\Frontend\src"

# Regex pattern for hex colors and rgba/rgb
color_pattern = re.compile(r'(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b|rgba?\([^)]+\))')

# Colors we are allowed to keep/use
ALLOWED_HEX = {"#19180A", "#3F220F", "#772014", "#AF4319", "#E71D36", 
               "#19180a", "#3f220f", "#772014", "#af4319", "#e71d36",
               "#fff", "#ffffff", "#000", "#000000"}

# A basic map to redirect old colors to new ones based on their general "vibe"
# We'll map purples/blues to Primary or Secondary
# Dark slate backgrounds to Background
# Lighter slate to Surface

def map_color(color_str):
    c = color_str.lower().strip()
    
    # White / Black / Transparent are fine
    if c in ["#fff", "#ffffff", "white", "#000", "#000000", "black", "transparent"]:
        return color_str
        
    # If it's already one of our allowed colors, keep it
    if c in ALLOWED_HEX:
        return color_str
        
    # rgba with white/black can be mapped to variables or kept (opacity on white/black is common for borders/text)
    if "rgba(255, 255, 255" in c or "rgba(255,255,255" in c or "rgba(0,0,0" in c or "rgba(0, 0, 0" in c:
        return color_str
        
    # Now the mappings for the old palette
    # Dark backgrounds (slate, dark blue, very dark grey)
    if any(x in c for x in ["#060913", "#080b14", "#030712", "#111827", "#0d111e"]):
        return "var(--clr-bg)"
        
    # Slightly lighter surfaces
    if any(x in c for x in ["#1f2937", "#374151", "#1e293b", "#334155"]):
        return "var(--clr-surface)"
        
    # Primary/Bright accents (cyans, pinks, purples)
    if any(x in c for x in ["#00f0ff", "#00f2fe", "#ff0055", "#d946ef", "#e11d48", "#ff4466"]):
        return "var(--clr-primary)"
        
    # Secondary accents (indigo, blue, gold, green)
    if any(x in c for x in ["#6366f1", "#7c3aed", "#a78bfa", "#0066ff", "#00aaff", "#f0b429", "#00d4aa", "#059669", "#00c864"]):
        return "var(--clr-secondary)"
        
    # Muted texts / grays
    if any(x in c for x in ["#94a3b8", "#64748b", "#7c8fac", "#e2e8f0", "#f0f4ff"]):
        return "var(--clr-text-muted)"
        
    # rgba glows and borders
    if "rgba(0, 240, 255" in c or "rgba(0,242,254" in c or "rgba(255, 0, 85" in c or "rgba(255,0,85" in c or "rgba(217, 70, 239" in c or "rgba(255,68,102" in c:
        return "var(--clr-primary-dim)"
        
    if "rgba(124,58,237" in c or "rgba(167,139,250" in c or "rgba(99,102,241" in c or "rgba(240,180,41" in c or "rgba(0,212,170" in c or "rgba(0,200,100" in c:
        return "var(--clr-secondary-dim)"
        
    if "rgba(251,191,36" in c:
        return "var(--clr-warning-dim)"

    # Default fallback for anything else not recognized
    return "var(--clr-primary)"


def process_css_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def repl(match):
        return map_color(match.group(0))

    new_content = color_pattern.sub(repl, content)

    # Double check no raw old variables are left like --bg-main if they were hardcoded somewhere (they should be mapped in index.css anyway)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for root, _, files in os.walk(css_dir):
    for file in files:
        if file.endswith('.css'):
            # don't mess with tokens.css or variables if we had them
            if file == "index.css": 
                continue 
            process_css_file(os.path.join(root, file))

print("Done cleaning CSS files.")
