---
name: Premium Medical Wellness
colors:
  surface: '#fcf8ff'
  surface-dim: '#dad6ff'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2ff'
  surface-container: '#efebff'
  surface-container-high: '#e9e5ff'
  surface-container-highest: '#e3dfff'
  on-surface: '#181445'
  on-surface-variant: '#4a4455'
  inverse-surface: '#2d2a5b'
  inverse-on-surface: '#f3eeff'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#5f5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2dd'
  on-secondary-container: '#656461'
  tertiary: '#524584'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a5d9e'
  on-tertiary-container: '#eae1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e5e2dd'
  secondary-fixed-dim: '#c9c6c2'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#e7deff'
  tertiary-fixed-dim: '#ccbeff'
  on-tertiary-fixed: '#1e0e4e'
  on-tertiary-fixed-variant: '#4a3d7c'
  background: '#fcf8ff'
  on-background: '#181445'
  surface-variant: '#e3dfff'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 42px
  headline-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The brand personality of this design system is defined by quiet luxury, clinical precision, and restorative serenity. It targets a discerning audience seeking high-end aesthetic and medical treatments. The emotional response should be one of immediate calm, absolute trust, and the feeling of entering a sanctuary.

The design style is **Minimalist with Glassmorphic accents**. It prioritizes a high-ratio of whitespace to content, ensuring the UI never feels cluttered or "loud." We use subtle translucent layers and background blurs to suggest depth and high-tech sophistication, reminiscent of modern medical environments and premium skincare packaging.

## Colors

The palette transitions from medical sterility to luxury wellness. 

*   **Primary (#7c3aed):** A deep, modern purple used for primary actions, signifying authority and premium quality.
*   **Secondary (#f5f2ed):** A warm parchment tone used for large surface areas to soften the clinical feel of the UI.
*   **Tertiary (#c4b5fd):** A soft lavender for accents, badges, and secondary interactive states.
*   **Neutral (#1e1b4b):** A deep indigo-toned slate for typography and high-contrast borders, providing better legibility and a "midnight" premium feel compared to pure black.

Success, warning, and error states should be muted and desaturated to maintain the sophisticated aesthetic.

## Typography

This design system utilizes a high-contrast typographic pairing to balance editorial elegance with functional clarity.

*   **Newsreader** is used for all headlines and display text. Its literary, traditional serif qualities evoke the authority of medical expertise and the heritage of luxury brands.
*   **Manrope** serves as the primary typeface for body copy and UI labels. Its modern, geometric construction provides a clean, neutral counterpoint to the serif headers, ensuring high readability for service descriptions and data-heavy forms.

Use tight letter-spacing for large display headlines to maintain a modern, "fashion-magazine" feel.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to maintain a curated, editorial feel. The content is centered within a 1280px container to ensure visual stability and control over line lengths.

*   **Grid:** 12-column layout for desktop; 4-column layout for mobile.
*   **Spacing Rhythm:** An 8px base unit drives all padding and margins. 
*   **Margins:** Generous outer margins (64px) on desktop create a sense of exclusivity and "breathing room." On mobile, this scales down to 20px to maximize functional space.
*   **Verticality:** High vertical spacing (80px–120px) between sections is encouraged to separate different treatment categories or service tiers.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Glassmorphism**, avoiding heavy, dark shadows that can look "dirty" in a medical context.

*   **Surface Tiers:** Backgrounds use the Secondary color (#f5f2ed). Cards and containers use pure white (#ffffff).
*   **Glassmorphism:** Navigation bars and modal overlays should use a semi-transparent white background (opacity 80%) with a high-density backdrop blur (20px). This mimics the appearance of frosted glass found in high-end spa partitions.
*   **Shadows:** When necessary for floating elements (like FABs or dropdowns), use "Ambient Shadows"—extremely soft, low-opacity (#1e1b4b at 5-8% opacity) with a large blur radius (24px) and no spread.

## Shapes

The shape language is **Rounded**, striking a balance between the clinical sharp edges of traditional medical apps and the overly playful circles of social apps. 

A 0.5rem (8px) corner radius is the standard for cards and inputs. For elements that require a more organic, "human" feel—such as image containers for lifestyle photography or "Book Now" buttons—use the `rounded-xl` (1.5rem) token to soften the visual impact.

## Components

*   **Buttons:** Primary buttons use the Primary Purple (#7c3aed) with white text. Secondary buttons use an outline of the Neutral Indigo or a solid Tertiary Lavender background with purple text.
*   **Chips & Badges:** Used for treatment categories (e.g., "Dermatology", "Wellness"). These should use the Tertiary color with a 0.5 opacity background and the Primary Purple for the text.
*   **Input Fields:** Ghost-style inputs with a subtle 1px border in a lightened Neutral color. Focus states must use a 2px Primary Purple border with a very soft glow.
*   **Cards:** Pure white backgrounds with no borders. Depth is created purely through the Tonal Layers defined in the Elevation section.
*   **Lists:** High-density lists (like treatment menus) should use thin, subtle dividers in a 10% opacity Neutral Indigo to maintain a clean, organized look.
*   **Booking Modal:** Should utilize the glassmorphic style for the backdrop, ensuring the spa's environment remains visible but blurred behind the functional UI.