# Design System: Editorial Tactility & The Soft-Modern Aesthetic

## 1. Overview & Creative North Star: "The Weighted Cloud"
This design system moves away from the "flat" web of the last decade, embracing a concept we call **"The Weighted Cloud."** While the subject matter is tender and soft (plush toys), the digital execution must feel premium, intentional, and editorial. 

We achieve this through **Organic Asymmetry** and **Tonal Depth**. Instead of rigid, boxed-in grids, we use overlapping elements and varying surface heights to mimic the physical experience of a curated boutique. The interface should feel like it has "volume"—as if the user could reach out and squeeze the components.

## 2. Colors & Surface Philosophy
The palette is a sophisticated interplay of creams, dusty roses, and muted teals. We do not use "white" (#FFFFFF) as a default background; we use `surface` (#f7f6f3) to provide a warmer, more tactile foundation.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. 
- **Definition through Shift:** Separate a "Featured Plush" section from the "New Arrivals" grid using a background shift from `surface` to `surface-container-low`.
- **Definition through Negative Space:** Use the Spacing Scale (specifically `8` to `16`) to create breathing room that acts as a natural boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested, physical layers. 
- **Level 0 (Base):** `surface` (#f7f6f3)
- **Level 1 (Sections):** `surface-container-low` (#f1f1ee)
- **Level 2 (Cards/Modules):** `surface-container-lowest` (#ffffff)
This "reverse nesting" (putting a pure white card on a cream base) creates a natural "pop" without a single line of CSS border.

### Signature Textures & Glass
To elevate the "Modern" requirement:
- **Glassmorphism:** Use `surface-container-lowest` at 70% opacity with a `20px` backdrop-blur for floating navigation bars or "Quick View" modals.
- **Tonal Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#923f5f) to `primary-container` (#fe97b9) at a 135-degree angle. This adds "soul" and mimics the way light hits velvet or faux fur.

## 3. Typography: The Friendly Authoritative
We use **Plus Jakarta Sans** across all scales. Its geometric yet soft curves perfectly balance "modern" and "friendly."

- **Display Scale (`display-lg` to `display-sm`):** Reserved for hero emotional copy (e.g., "A Friend for Life"). Use tight letter-spacing (-0.02em) to make the rounded terminals feel more cohesive.
- **Headline & Title Scale:** These should use `on-surface` (#2e2f2d). The contrast between the large, soft typeface and the muted background creates an editorial, high-end look.
- **Body & Label Scale:** Use `on-surface-variant` (#5b5c5a) for secondary information. This reduction in contrast prevents the "soft" aesthetic from feeling too "loud" or "childish."

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "dirty." In this system, we use **Ambient Glows.**

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container` background. The change in hex code provides 90% of the visual separation.
- **Ambient Shadows:** For product cards, use a shadow color tinted with the primary brand color: `rgba(146, 63, 95, 0.08)` with a blur of `40px` and a Y-offset of `12px`. This makes the shadow feel like a reflection of the plush toy's warmth.
- **The "Ghost Border" Fallback:** If a container sits on an identical color (e.g., in a search result), use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### Product Cards (The "Plush" Card)
- **Shape:** `rounded-xl` (3rem) or `rounded-lg` (2rem).
- **Depth:** No border. Use `surface-container-lowest` background with an Ambient Shadow.
- **Interaction:** On hover, the card should scale (1.02) and the shadow blur should increase to `60px`, mimicking a physical lift.

### Buttons
- **Primary:** `rounded-full`. Background: `primary` to `primary-container` gradient. Typography: `title-sm` in `on-primary`.
- **Secondary:** `rounded-full`. Background: `secondary-container`. Typography: `on-secondary-container`. No border.
- **Tertiary:** `rounded-full`. No background. Use `title-sm` with a subtle `primary` underline.

### Input Fields
- **Styling:** `rounded-md` (1.5rem). Background: `surface-container-high`.
- **Focus State:** Transition background to `surface-container-lowest` and add a `2px` "Ghost Border" using `primary_container`.

### "Soft" Chips
- Use `rounded-full` with `tertiary-container` backgrounds. These should look like small pebbles. Use for "New," "Limited Edition," or "Organic Cotton" tags.

### Forbid Dividers
Divider lines (`<hr>`) are strictly forbidden. Use `spacing-10` (3.5rem) of vertical white space or a full-width background color shift to separate content blocks.

## 6. Do's and Don'ts

### Do
- **Do** embrace asymmetry. A hero image of a plush toy should overlap a background container to create depth.
- **Do** use `on-primary-container` for text on pastel backgrounds to ensure AAA accessibility while maintaining the color story.
- **Do** use the `full` roundedness scale for interactive elements to emphasize the "huggable" nature of the brand.

### Don't
- **Don't** use pure black (#000000) for text. It breaks the soft immersion. Use `on-surface`.
- **Don't** use sharp corners (0px to 4px). The minimum radius for any container should be `sm` (0.5rem).
- **Don't** use high-contrast, "harsh" drop shadows. If the shadow looks like a "line," it is too dark. It must look like a "glow."