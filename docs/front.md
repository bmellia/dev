# UI/UX Design Specification: "Don Se/Sae" Minimalist Login

This specification defines the visual and structural requirements for a high-fidelity, Notion-inspired login interface with a playful, hand-corrected header.

---

## 1. Global Visual Identity
- **Background:** Pure white (`#FFFFFF`). No gradients or patterns.
- **Typography:** Primary font is **Inter** (for UI elements).
- **Color Palette:**
  - **Primary Text:** Zinc-950 (`#09090b`).
  - **Secondary Text:** Zinc-500 (`#71717a`).
  - **Accent (Header):** A saturated sky blue (`#0077c2`).
  - **Correction (X):** A semi-transparent red (`rgba(239, 68, 68, 0.4)`).
  - **Button:** A clean, vibrant blue (`#3b82f6`).

---

## 2. Header: The Playful "Correction"
- **Base Text:** "돈 세는 가계부"
- **Styling:**
  - **Color:** Saturated sky blue.
  - **Typography:** A cute, rounded, or hand-written style font.
  - **Layout:** Characters should have subtle, organic offsets (random `translateY` or `rotate`) to feel "bouncy."
- **The "Correction" Effect:**
  - **The Red X:** A hand-drawn style red 'X' must be superimposed over the character **'세'**.
  - **X Properties:** It should be slightly smaller than the character it covers and have a lower opacity (~40%) so the '세' remains visible underneath.
  - **The '새' Correction:** The character **'새'** should be placed directly above the crossed-out '세', appearing as a handwritten correction. It should match the font and color of the base text.

---

## 3. Login Container (The Card)
- **Layout:** Centered perfectly in the viewport.
- **Dimensions:** Fixed width (approx. `420px`).
- **Surface Styling:**
  - **Background:** White (`#FFFFFF`).
  - **Border:** A subtle, 1px solid line in Zinc-100 (`#f4f4f5`).
  - **Shadow:** A soft, diffused drop shadow (`shadow-xl`) to provide depth.
  - **Padding:** Large internal padding (e.g., `p-12`).

---

## 4. Input Fields & Form Elements
- **Structure:**
  - **No external labels.**
  - **Inputs:**
    - Background: Zinc-50 (`#f9fafb`).
    - Border: None.
    - Placeholder Text: "ID" and "PW" in Zinc-400.
    - Padding: Large vertical/horizontal padding for a chunky feel.
    - Spacing: Consistent vertical gap between fields.
- **Primary Button:**
  - **Label:** "Login"
  - **Style:** Solid blue background, white text.
  - **Shape:** Rounded corners (approx. `8px`).
  - **Action:** Full-width button at the bottom.

---

## 5. Exclusions & Constraints
- **NO** headers like "Admin Login" inside the card.
- **NO** secondary links like "Forgot Password" or "Signup".
- **NO** footer text, copyright, or branding links.
- The focus is entirely on the quirky header and the singular, clean login action.

---

## Implementation Goal
The final result must balance high-end minimalist UI (Notion-style) with a chaotic, whimsical brand element, creating a memorable "Editorial Canvas" experience.
