---
version: alpha
name: Figma
website: "https://www.figma.com"
description: "A confident black-and-white editorial frame interrupted by oversized, hand-cut pastel color blocks. The marketing canvas is rigorously monochrome — figmaSans variable type, pure white surfaces, pure black ink, pill-shaped CTAs — while each story section drops the page into a saturated lime, lavender, cream, mint, or pink panel that reads like a sticky note placed on a clean desk. The result is a design system that feels both technical and joyful — a tool for serious work, made by people who like color."

seo:
  title: "Figma Design System: Black, White and Pastel Color Blocks"
  metaDescription: "A monochrome editorial frame in figmaSans with pill CTAs, broken by lime, lavender, mint and pink panels. Figma's DESIGN.md for React and AI tools."
  highlights:
    - "Monochrome chrome — every CTA is black #000000 or white #ffffff; the system never reaches for a brand color outside the pastel blocks"
    - "Seven oversized pastel surfaces — lime, lilac, cream, mint, pink, coral, navy — span full content width with 24px corners and 48px padding"
    - "Pill is the only button shape — 50px radius for text CTAs, 9999px for icon buttons, no square button anywhere"
    - "figmaSans at unusual weight increments — 320, 330, 340, 480, 540, 700 — the type reads as one voice modulating, not a stepped family"
    - "Display headlines pull -1.72px tracking at 86px — editorial cadence without sacrificing body readability at 18px"
  tags:
    - "Design & Creative Tools"
    - "Productivity & SaaS"
  lastUpdated: "2026-05-12"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Figma's marketing site is the rare case where a design tool actually demonstrates its own design discipline. The frame is monochrome — black ink, white canvas, figmaSans variable type, pill-shaped CTAs — but every long-form page interrupts itself with oversized pastel panels that span the full content width. Lime for systems and FAQ, lilac for the /design route and FigJam highlights, cream for templates, mint and pink for FigJam pastel stories, coral for "ship products" on the home page, and a deep navy for the only inverse story block above the footer. The chrome stays editorial; the blocks do the storytelling. There is no gradient, no shadow stack, no second accent color outside a single magenta promo pill reserved for one CTA per page.

    This page packages all of that into a single DESIGN.md file. Inside: 20 color tokens grouped into brand, surface, text, and semantic roles; 13 type styles across figmaSans and figmaMono; 7 corner radius steps from 2px hairline to a 50px pill; 9 spacing tokens on an 8px base; and 26 components covering buttons, pricing tabs, color-block sections, navigation, comparison glyphs, and the dense footer link grid. The file follows Google Labs' DESIGN.md spec, so every token resolves to a concrete hex, px, or weight a build tool can read.

    Feed the file to Claude, Cursor, or GitHub Copilot and the agent reproduces Figma's contrast — monochrome chrome interrupted by deliberate color-block sections — rather than a generic SaaS theme. Reference the tokens directly to wire them into Tailwind config, CSS variables, or your own component library. The system is worth studying because it solves a problem most marketing sites get wrong: how to feel both technical and joyful without leaning on bling.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://www.figma.com/design/"
      title: "Figma Design product page"
      description: "The live /design/ route Figma uses to market the editor — the lilac hero is the canonical color-block reference."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files — the format this page is built on."
  questions:
    - id: "color-blocks"
      title: "What are Figma's signature color blocks?"
      answer: "The color blocks are full-content-width pastel panels with 24px rounded corners and 48px interior padding. The full set runs lime (#dceeb1), lilac (#c5b0f4), cream (#f4ecd6), mint (#c8e6cd), pink (#efd4d4), coral (#f3c9b6), and a deep navy (#1f1d3d). Each route uses a different rhythm — the home page rotates through the full set, FigJam leans heavily on the pastels, and the pricing page closes with a lime FAQ panel. They are the system's primary depth device, replacing the drop shadow that most SaaS sites would reach for."
    - id: "primary-color"
      title: "What is Figma's primary brand color?"
      answer: "The system primary is pure black (#000000). It carries every primary CTA, every headline, every body line, the marquee strip directly under the nav, and the inverse canvas of dark sections. White (#ffffff) is the canvas and the foreground of secondary pill buttons. There is no third brand color in the chrome — the only saturated accent is a single magenta (#ff3d8b) reserved for one promotional pill per page, typically inside the lilac Release Notes banner."
    - id: "typography"
      title: "What typography does Figma use, and what should I use if figmaSans isn't available?"
      answer: "Figma runs figmaSans, a proprietary variable typeface, alongside figmaMono for eyebrows and captions. The variable weight axis is exercised at unusually fine increments — 320, 330, 340, 480, 540, 700 — so the system reads as one voice flexing rather than a stepped weight family. Display sizes pull aggressive negative tracking (-1.72px at 86px, -0.96px at 64px). Inter or Geist are the closest open-source substitutes for the sans; JetBrains Mono or Geist Mono for the mono. Adjust line-heights down by ~0.02 to compensate for Inter's slightly taller x-height."
    - id: "dark-mode"
      title: "Does Figma's design system have a dark mode?"
      answer: "No — the marketing site is light-only. The closest analog is the navy color-block section (#1f1d3d) on the home page and the inverse-canvas footer that takes the same black ink role from the opposite direction. The editor itself ships dark and light themes, but those are product surfaces and aren't represented in this DESIGN.md, which captures the public marketing experience."
    - id: "shape-language"
      title: "Why is every button a pill?"
      answer: "Pill (50px radius) is the only button shape in the system — every text CTA, every pricing-tab toggle, every secondary action. Icon buttons take the fully-rounded 9999px circle. Form inputs and image frames use the gentler 8px radius. Square corners only appear at the 2px hairline level for sub-nav tabs. The consistency is intentional: a square CTA would read as a different brand. The pill-and-circle pairing is the brand signature."
    - id: "use-in-project"
      title: "Can I use this DESIGN.md to build my own React marketing site?"
      answer: "Yes — the file is designed to be fed into Claude, Cursor, or any AI tool that reads structured design tokens. The agent will reproduce Figma's contrast pattern — monochrome chrome, oversized pastel color-block sections between editorial bands — rather than a generic shadcn theme. You can also reference the tokens directly: every color, type style, radius, and spacing value in the spec is a quoted value you can paste into Tailwind config, CSS variables, or your own component library."

colors:
  primary: "#000000"
  on-primary: "#ffffff"
  ink: "#000000"
  canvas: "#ffffff"
  inverse-canvas: "#000000"
  inverse-ink: "#ffffff"
  on-inverse-soft: "#ffffff"
  hairline: "#e6e6e6"
  hairline-soft: "#f1f1f1"
  surface-soft: "#f7f7f5"
  block-lime: "#dceeb1"
  block-lilac: "#c5b0f4"
  block-cream: "#f4ecd6"
  block-pink: "#efd4d4"
  block-mint: "#c8e6cd"
  block-coral: "#f3c9b6"
  block-navy: "#1f1d3d"
  accent-magenta: "#ff3d8b"
  semantic-success: "#1ea64a"
  overlay-scrim: "#000000"

typography:
  display-xl:
    fontFamily: figmaSans
    fontSize: 86px
    fontWeight: 340
    lineHeight: 1.00
    letterSpacing: -1.72px
    fontFeature: kern
  display-lg:
    fontFamily: figmaSans
    fontSize: 64px
    fontWeight: 340
    lineHeight: 1.10
    letterSpacing: -0.96px
    fontFeature: kern
  headline:
    fontFamily: figmaSans
    fontSize: 26px
    fontWeight: 540
    lineHeight: 1.35
    letterSpacing: -0.26px
    fontFeature: kern
  subhead:
    fontFamily: figmaSans
    fontSize: 26px
    fontWeight: 340
    lineHeight: 1.35
    letterSpacing: -0.26px
    fontFeature: kern
  card-title:
    fontFamily: figmaSans
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: 0
    fontFeature: kern
  body-lg:
    fontFamily: figmaSans
    fontSize: 20px
    fontWeight: 330
    lineHeight: 1.40
    letterSpacing: -0.14px
    fontFeature: kern
  body:
    fontFamily: figmaSans
    fontSize: 18px
    fontWeight: 320
    lineHeight: 1.45
    letterSpacing: -0.26px
    fontFeature: kern
  body-sm:
    fontFamily: figmaSans
    fontSize: 16px
    fontWeight: 330
    lineHeight: 1.45
    letterSpacing: -0.14px
    fontFeature: kern
  link:
    fontFamily: figmaSans
    fontSize: 20px
    fontWeight: 480
    lineHeight: 1.40
    letterSpacing: -0.10px
    fontFeature: kern
  button:
    fontFamily: figmaSans
    fontSize: 20px
    fontWeight: 480
    lineHeight: 1.40
    letterSpacing: -0.10px
    fontFeature: kern
  eyebrow:
    fontFamily: figmaMono
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.30
    letterSpacing: 0.54px
    fontFeature: kern
  caption:
    fontFamily: figmaMono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.00
    letterSpacing: 0.60px
    fontFeature: kern

rounded:
  xs: 2px
  sm: 6px
  md: 8px
  lg: 24px
  xl: 32px
  pill: 50px
  full: 9999px

spacing:
  hair: 1px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 10px 20px
  button-primary-pressed:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 8px 18px 10px
  button-tertiary-text:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.link}"
    rounded: "{rounded.full}"
    padding: 8px 12px
  button-icon-circular:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    size: 40px
  button-icon-circular-inverse:
    backgroundColor: "{colors.on-inverse-soft}"
    textColor: "{colors.inverse-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    size: 40px
  button-magenta-promo:
    backgroundColor: "{colors.accent-magenta}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 10px 18px
  pricing-tab-default:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 8px 18px
  pricing-tab-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 8px 18px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  pricing-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  pricing-card-feature-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
  color-block-section:
    backgroundColor: "{colors.block-lime}"
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: 48px
  color-block-section-lilac:
    backgroundColor: "{colors.block-lilac}"
    textColor: "{colors.ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: 48px
  color-block-section-navy:
    backgroundColor: "{colors.block-navy}"
    textColor: "{colors.inverse-ink}"
    typography: "{typography.subhead}"
    rounded: "{rounded.lg}"
    padding: 48px
  promo-banner-lilac:
    backgroundColor: "{colors.block-lilac}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px 24px
  template-card:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
  feature-illustration-tile:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.md}"
    padding: 24px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 56px
  marquee-strip:
    backgroundColor: "{colors.inverse-canvas}"
    textColor: "{colors.inverse-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 36px
  comparison-checkmark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.semantic-success}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    size: 16px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 64px 32px
---

## Overview

Figma's marketing canvas is, at the system level, an editor-clean black-and-white frame. The chrome — top nav, body type, footer, primary CTA — is monochrome. Headlines are oversized `{typography.display-xl}` set in `figmaSans` with aggressive negative tracking, body copy hovers around weight 320–340 of the same variable family, and small mono `{typography.eyebrow}` and `{typography.caption}` labels (figmaMono, all-caps, positive tracking) act as section markers. Every CTA is a pill — `{rounded.pill}` — and the primary action across the entire site is the same black `{components.button-primary}` paired with the same white `{components.button-secondary}`.

What makes the design unique is what happens **between** those monochrome bookends: the page repeatedly drops into oversized pastel **color-block sections** — lime, lavender, cream, mint, pink, coral, and a deep navy — that span the full content width with `{rounded.lg}` corners and `{spacing.xxl}` interior padding. These blocks are where the storytelling lives. They aren't accents tucked into a card; they take over a whole viewport's worth of vertical space, like a designer arranging giant sticky notes on a clean wall. FigJam is the most pastel-saturated, the home page rotates through the full set, and the pricing page ends with a lime FAQ panel — same vocabulary, different rhythm per route.

This is a system built on contrast: the monochrome chrome makes the color blocks feel intentional rather than decorative, and the color blocks make the monochrome chrome feel like editorial paper rather than enterprise SaaS. Density is generous, line-heights are tight on display sizes, and the interface never reaches for shadows or gradients to do the work that color blocks and confident typography already do.

**Key Characteristics:**
- Monochrome system core: `{colors.primary}` (black) and `{colors.canvas}` (white) carry every CTA, every body line, every footer link.
- Oversized pastel **color-block sections** (`{colors.block-lime}`, `{colors.block-lilac}`, `{colors.block-cream}`, `{colors.block-mint}`, `{colors.block-pink}`, `{colors.block-coral}`, `{colors.block-navy}`) define the narrative rhythm of every long-form page.
- Pill is the only button shape — `{rounded.pill}` for text CTAs, `{rounded.full}` for icon buttons. No square buttons anywhere.
- `figmaSans` variable typeface used at unusually fine weight increments (320, 330, 340, 450, 480, 540) — the type system reads as a single voice that flexes rather than a multi-weight family.
- Tight negative letter-spacing on display sizes (-1.72px at 86px, -0.96px at 64px) creates a confident editorial cadence.
- `figmaMono` reserved for category labels, eyebrows, and captions — always uppercase, positive tracking — to flag taxonomy without competing with display type.
- Color-block page rhythm (home): white hero → marquee strip → white feature → lime systems block → navy ship-products block → coral developer block → white template grid → white footer.

## Known Gaps

- The exact pastel hex values of `{colors.block-*}` are derived from screenshot pixels; the production source likely uses named tokens that aren't exposed via CSS variables. Treat the documented hex values as faithful approximations rather than exact brand specs.
- Dark mode is not documented because the marketing site does not ship a dark theme — the closest analog is the navy color-block (`color-block-section-navy`) and the inverse-canvas footer.
- Form-field error and validation styling is not visible on `/contact/` because no error states render in the static screenshot. Inputs have hairline borders and rounded `{rounded.md}` corners; error treatment is not documented.
- The animated marquee-strip and color-block reveal animations are not documented (per the no-interaction policy).
