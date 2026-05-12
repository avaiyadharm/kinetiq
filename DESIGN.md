# Design System: Kinetiq Physics Platform
**Project ID:** 9439526024794915798

## 1. Visual Theme & Atmosphere
The Kinetiq design system is defined as **Tactile Modernist**, engineered for a high-performance physics simulation platform. It balances scientific rigor with the spark of discovery. The UI feels as precise as a laboratory instrument but as approachable as a modern digital toy.

*   **Precision Engineering:** Clean lines and a structured grid reflect mathematical accuracy.
*   **Interactive Feedback:** High-contrast states and physical metaphors (depth, shadows) encourage manipulation of variables.
*   **Clarity & Accessibility:** A focus on high legibility and clear affordances for a diverse range of learners.

## 2. Color Palette & Roles
The palette is built for maximum functional differentiation, utilizing a clean, light base with high-contrast scientific accents.

*   **Vibrant Science Blue (#2563EB):** The primary brand color. Used for main actions, structural navigation, and representing "Standard" forces or states.
*   **Laboratory Teal (#0D9488):** Represents successful states, "Ready" indicators, and secondary data categories.
*   **Energy Orange (#F59E0B):** Reserved for interactive highlights, active drag handles, and "Live" simulation warnings to focus attention on experiment control points.
*   **Clean Background (#F8F9FF):** A sterile, high-readability canvas that provides a professional laboratory feel.
*   **Slate Neutrals (#1F2937):** Used for sharp contrast in text and iconography.
*   **Surface Tint (#0053DB):** Used for subtle layering and highlighting active surfaces.

## 3. Typography Rules
A three-tier typeface strategy reinforces the technical-yet-friendly aesthetic:

*   **Space Grotesk (Headlines):** Geometric and technical. Used for displays and headings to provide a "physics-lab" feel while remaining highly legible.
*   **Inter (Body):** A modern, neutral sans-serif used for all instructional and descriptive content to ensure maximum readability.
*   **JetBrains Mono (Labels/Data):** A monospaced font employed for numerical values, slider labels, and data outputs to emphasize precision and scientific accuracy.

## 4. Component Stylings
*   **Buttons:** 
    *   *Primary:* Solid Vibrant Science Blue with white text. Deepens on hover; shrinks by 2% on click for tactile feedback.
    *   *Secondary:* Outlined in Science Blue with a 2px stroke for high visibility.
*   **Cards/Containers:** 
    *   *Shape:* Standard components use a 0.5rem (8px) corner radius. Large containers use 1.5rem (24px).
    *   *Style:* Clean white backgrounds with 1px borders and subtle, tight ambient shadows (Level 1 elevation).
*   **Interactive Controls:** 
    *   *Tactile Sliders:* Large thumbs (24x24px) that turn Energy Orange on hover.
    *   *Toggle Switches:* Physical metaphor toggles with Laboratory Teal "on" states.
*   **Inputs/Forms:** Sharp, well-defined strokes with clear focus states using the Primary Blue.

## 5. Layout Principles
*   **Fixed-Control Fluid-Canvas:** The simulation canvas expands to fill the viewport, while controls are housed in a fixed-width (320px) sidebar.
*   **Rhythm & Spacing:** Follows an 8px grid system with a 4px baseline grid for text alignment. 
*   **Safe Zones:** Large 40px - 64px margins are maintained around primary simulation areas to prevent accidental interaction during physics manipulation.
*   **Gutter:** Standard 24px spacing between major UI blocks.
