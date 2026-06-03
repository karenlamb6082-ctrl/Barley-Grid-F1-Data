---
name: Barley Grid
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#494740'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#7a776f'
  outline-variant: '#cbc6bd'
  surface-tint: '#605e5b'
  primary: '#030302'
  on-primary: '#ffffff'
  primary-container: '#1e1d1b'
  on-primary-container: '#878582'
  inverse-primary: '#cac6c2'
  secondary: '#aa3434'
  on-secondary: '#ffffff'
  secondary-container: '#fe716d'
  on-secondary-container: '#700410'
  tertiary: '#060200'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1a01'
  on-tertiary-container: '#9b815c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6e2de'
  primary-fixed-dim: '#cac6c2'
  on-primary-fixed: '#1c1b19'
  on-primary-fixed-variant: '#484644'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3af'
  on-secondary-fixed: '#410005'
  on-secondary-fixed-variant: '#891b20'
  tertiary-fixed: '#fedeb2'
  tertiary-fixed-dim: '#e0c298'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#584323'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.15em
  data-numeric:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-tablet: 32px
  margin-mobile: 20px
---

## Brand & Style
The design system embodies the intersection of elite motorsport engineering and high-end editorial curation. It adopts a **Swiss Modernist** and **Bauhaus-inspired** philosophy, prioritizing structural clarity, mathematical grids, and an "art gallery" atmosphere. Unlike traditional F1 interfaces that lean into aggressive, high-contrast aesthetics, this system is restrained, luxurious, and calm.

The emotional response should be one of "quiet authority"—moving away from the noise of the track into the sophisticated inner circle of the paddock. It utilizes a minimalist aesthetic where white space is treated as a premium material, and information density is managed through rigorous alignment and hierarchy.

## Colors
The palette is rooted in a **Matte/Morandi** spectrum, avoiding the harshness of pure digital blacks and neons. 

- **Canvas & Surface:** The primary background is Champagne White, mimicking heavyweight art paper. Card surfaces are pure white to provide subtle lift.
- **Ink:** Carbon Black is the primary vehicle for content, appearing as matte graphite rather than a flat digital hex.
- **Accents:** Dark Red is reserved strictly for "Live" indicators, critical alerts, or active racing data. Dark Gold/Bronze is used for premium navigation states and ornamental hairline dividers.
- **Secondary Data:** Fog Blue provides a soft contrast for non-critical telemetry and secondary metrics.

## Typography
Typography is the primary driver of the "Editorial Magazine" feel. We pair a high-contrast serif with a functional, modern sans-serif.

- **The Serif (Playfair Display):** Used for large-scale numbers (driver standings, lap times), editorial headers, and pull quotes. It provides a sense of heritage and luxury.
- **The Sans-Serif (Inter):** Used for all functional data, body copy, and UI labels. Its neutrality balances the personality of the serif.
- **Metadata Styling:** All labels, categories, and secondary tags must be set in uppercase with wide tracking (+0.15em) to maintain a structural, architectural feel.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop, centered to create a gallery-like framing effect. 

- **Grid:** A 12-column grid is used for desktop. Components should align to these columns with generous 24px gutters.
- **Whitespace:** Embody the "Bauhaus" spirit by using asymmetrical white space. Elements do not need to fill every corner; allow the background Champagne White to flow between content blocks.
- **Rhythm:** Use an 8px base unit for all internal component spacing (8, 16, 24, 32, 48, 64).
- **Mobile Adaption:** On mobile, margins shrink to 20px, and the grid collapses to a single column, but the oversized serif headers remain relatively large to maintain the "magazine" impact.

## Elevation & Depth
In alignment with the flat, modernist aesthetic, traditional heavy shadows are strictly forbidden. Depth is achieved through:

- **Tonal Layering:** The primary method of separation. White cards sit on the Champagne White canvas.
- **Hairline Borders:** Use 1px borders with extreme transparency (`rgba(30, 29, 27, 0.05)`) to define boundaries without adding visual weight.
- **Glassmorphism:** For overlays or navigation bars, a very subtle backdrop blur (12px) with a semi-transparent white fill may be used to maintain a sense of lightness.
- **Focus:** Instead of "lifting" an object with shadows on hover, use a color shift to the Bronze accent or a subtle 1px inset border.

## Shapes
The shape language is sophisticated and organic. We avoid the sharp, "aggressive" angles often found in sports tech.

- **Corners:** Components use a 16px base radius. Larger containers (main cards, image containers) should scale up to 24px (`rounded-xl`).
- **Geometric Accents:** Small circular indicators (for status) and perfectly square icons create a Bauhaus contrast against the rounded containers.
- **Interactive Elements:** Buttons and input fields should maintain the 16px radius, never becoming fully pill-shaped, to keep a more structured, architectural profile.

## Components
- **Buttons:** Primary buttons are Matte Carbon Black with White text. Secondary buttons use the Bronze accent for text or a 1px border. No heavy gradients or 3D effects.
- **Cards:** Cards are pure White with 24px padding. They should feel like individual "exhibits" on the Champagne background.
- **Data Chips:** Small, rectangular chips with the 16px radius. Use Fog Blue for neutral data and the Dark Red for "Live" or "DRS Active" states.
- **Input Fields:** Minimalist. Only a bottom border of 1px (Bronze or Carbon) or a very light gray stroke. Use Inter for input text.
- **List Items:** Separated by Champagne Dark Gold hairline dividers. High internal padding (24px) to ensure the data has room to breathe.
- **Telemetry Visuals:** Graphs and charts should use thin strokes (1px or 1.5px) in Carbon, Bronze, and Fog Blue. No area fills unless at very low (5%) opacity.