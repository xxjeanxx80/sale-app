---
name: Clinical Excellence System
colors:
  surface: '#f4fbf4'
  surface-dim: '#d4dcd5'
  surface-bright: '#f4fbf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef6ee'
  surface-container: '#e8f0e9'
  surface-container-high: '#e3eae3'
  surface-container-highest: '#dde4dd'
  on-surface: '#161d19'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2b322d'
  inverse-on-surface: '#ebf3eb'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#a0a3a5'
  on-tertiary-container: '#36393b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f4fbf4'
  on-background: '#161d19'
  surface-variant: '#dde4dd'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
---

## Brand & Style

This design system is engineered for high-end medical spas and premium clinics. The visual narrative balances **Clinical Precision** with **Luxury Hospitality**. It utilizes a "Neo-Medical" aesthetic—moving away from sterile, cold environments toward warm, sophisticated, and technologically advanced interfaces.

The core style is a refined **Modern Minimalism** infused with **Glassmorphism**. Surfaces should feel airy and breathable, utilizing generous white space and translucent layers to suggest transparency and cleanliness. The emotional goal is to instill confidence in practitioners while providing a calming, "sanctuary-like" experience for patients engaging with the POS or booking interfaces.

## Colors

The palette is rooted in **Zinc and Slate** neutrals to provide a stable, professional foundation. 

- **Primary Emerald (#10b981):** Used exclusively for high-intent actions, "Success" states, and critical health indicators. It represents vitality and growth.
- **Surface Strategy:** The "primarily light" mode uses `Slate-50` for backgrounds and `White` for elevated cards. Dark mode should utilize `Zinc-950` as the base with `Zinc-900` for containers.
- **Gradients:** Subtle Emerald-to-Teal gradients are reserved for primary buttons and featured dashboard cards to create a sense of premium depth.
- **Overlays:** Glassmorphism should use `white/80` or `zinc-900/80` with a `20px` backdrop blur to maintain legibility while suggesting a physical, layered environment.

## Typography

**Geist** is the sole typeface for this design system, chosen for its monospaced-influenced precision and modern, technical clarity. 

- **Headlines:** Use tighter letter-spacing and semi-bold weights to create a sense of "premium authority."
- **Data Display:** For numerical values (pricing, patient vitals), ensure the tabular numbers feature of Geist is active to maintain alignment in tables.
- **Hierarchy:** Use `label-sm` in uppercase with slight tracking for category headers and overlines to create a sophisticated, editorial structure.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid** grid. Sidebars and navigation remain fixed, while content areas use a 12-column fluid grid.

- **Spacing Rhythm:** Based on an 8px scale, but utilizes `1.5rem (24px)` as the standard gutter to prevent the interface from feeling "cramped," maintaining the luxury clinic feel.
- **Margins:** Desktop layouts should prioritize wide margins (`2.5rem`) to frame the content, acting like a gallery or high-end retail space.
- **Mobile Reflow:** On mobile, all cards should go full-width with a `1rem` margin, and complex tables should transition into "Expandable List" cards.

## Elevation & Depth

This design system uses a **multi-layered shadow strategy** to define the hierarchy without relying on heavy borders.

1.  **Level 0 (Surface):** The background (Slate-50).
2.  **Level 1 (Base Cards):** Pure white background with a very soft `shadow-md`.
3.  **Level 2 (Interactive/Floating):** Use a `shadow-xl` (diffused, 15% opacity Slate-900) to signify elements that are actionable or can be moved.
4.  **Glass Layers:** Use for global navigation bars and modals. Apply `backdrop-blur-md` and a `1px` white/20 border to simulate the edge of a glass pane. This "lens" effect is central to the state-of-the-art medical vibe.

## Shapes

The shape language is defined by **rounded-2xl (1rem)**. This generous radius softens the technical nature of the POS system, making it feel approachable and high-end. 

- **Outer Containers:** Use `1rem (16px)` for all primary cards and modals.
- **Inner Elements:** Nested elements (like buttons inside a card) should use `0.5rem (8px)` to maintain visual nesting harmony (the "radius-minus-padding" rule).
- **Inputs:** Form fields should match the button radius of `0.5rem` to ensure a consistent interactive language.

## Components

- **Buttons:** Primary buttons use the Emerald-to-Teal gradient. Secondary buttons use a transparent background with a subtle Zinc-200 border. All buttons have a height of 44px for touch-friendly POS use.
- **Cards:** Defined by a white background, `rounded-2xl`, and `shadow-xl`. Header areas within cards should be separated by a subtle `1px` border in `Slate-100`.
- **Tables:** Essential for POS. Use "Clean" style: No vertical borders. Zebra striping is replaced by a `Slate-50` hover state. Header cells use `label-sm` typography.
- **Badges/Chips:** Used for appointment status (e.g., "Confirmed," "In-Progress"). Use high-contrast "Soft" pills: background at 10% opacity of the status color with 100% opacity text.
- **Input Fields:** Use a subtle `Slate-100` fill that clears on focus, replaced by a 2px `Emerald` ring.
- **Specialty Component - "The Patient Timeline":** A vertical line component using Emerald nodes to track treatment history, utilizing the glassmorphism style for detail popovers.