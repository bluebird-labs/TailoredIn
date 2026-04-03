# Resume Font Guide for Tech Leadership Roles

Typography recommendations for Staff Engineer, Engineering Manager, VP Engineering, and CTO resumes.

## Guiding Principle

At this level, typography is **invisible infrastructure**. The font communicates before the reader reads a word. Geometric, engineered typefaces project the same qualities as the work they describe: systematic thinking, clean architecture, nothing superfluous.

Choose **one family** and use weight, size, and tracking for hierarchy — not multiple typefaces. The goal is a resume that looks effortlessly well-made, not one that looks designed.

The **Systems Precision** direction: clean geometric sans-serifs from engineering-culture organizations (IBM, Vercel, Google, JetBrains). Each family is open-source, available on Google Fonts, and carries associations that align with modern tech leadership.

## Typeface Families

### IBM Plex Sans ⭐

| Role | Variant | Weight | Typst |
|------|---------|--------|-------|
| Name / Display | IBM Plex Sans Light | 300 | Download |
| Body / Bullets | IBM Plex Sans Light | 300 | Download |
| Headings / Labels | IBM Plex Sans SemiBold | 600 | Download |
| Dates / Tech | IBM Plex Mono Regular | 400 | Download |

IBM's corporate typeface, designed by Mike Abbink and Bold Monday. Geometric but not cold — the Light weight has genuine warmth at body sizes while the SemiBold commands authority for headings. The Mono companion creates a complete typographic system without mixing families.

**Download:** https://github.com/IBM/plex/releases/latest · [Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Sans)  
**Bundled in repo:** `infrastructure/typst/fonts/` — ready to use

---

### Inter

| Role | Variant | Weight | Typst |
|------|---------|--------|-------|
| Name / Display | Inter SemiBold | 600 | Download |
| Body / Bullets | Inter Light | 300 | Download |
| Headings / Labels | Inter SemiBold | 600 | Download |
| Dates / Tech | JetBrains Mono Regular | 400 | Download |

Designed by Rasmus Andersson for screen interfaces. The GitHub aesthetic — every modern SaaS product feels built on Inter. If your resume is being read by engineers who live in Linear, Figma, or Notion, this is the font they see every day. Familiarity reads as confidence.

Note: the Google Fonts version has some OpenType features stripped. Download directly from [rsms.me/inter](https://rsms.me/inter/) for the complete feature set.

**Download:** https://github.com/rsms/inter/releases/latest · [Google Fonts](https://fonts.google.com/specimen/Inter)

---

### Geist Sans

| Role | Variant | Weight | Typst |
|------|---------|--------|-------|
| Name / Display | Geist Regular | 400 | Download |
| Body / Bullets | Geist Light | 300 | Download |
| Headings / Labels | Geist SemiBold | 600 | Download |
| Dates / Tech | Geist Mono Regular | 400 | Download |

Vercel's type system, released open-source in 2023. The newest family on this list and the most distinctively 2020s tech aesthetic — a shade more neutral than IBM Plex, a shade sharper than Inter. Strong signal for product-engineering and platform roles, especially at companies in the Vercel ecosystem (Next.js, Turborepo, etc.).

**Download:** https://github.com/vercel/geist-font/releases/latest · [Google Fonts](https://fonts.google.com/specimen/Geist)

---

### DM Sans

| Role | Variant | Weight | Typst |
|------|---------|--------|-------|
| Name / Display | DM Sans SemiBold | 600 | Download |
| Body / Bullets | DM Sans Light | 300 | Download |
| Headings / Labels | DM Sans SemiBold | 600 | Download |
| Dates / Tech | DM Mono Regular | 400 | Download |

Designed for DeepMind by Colophon Foundry. Low contrast, open apertures, slightly more humanist than the others — the only family here with a hint of warmth. Best choice when the role leans toward leadership and communication over pure platform/systems work. Reads as "grounded senior leader" rather than "infrastructure nerd."

**Download:** https://github.com/googlefonts/dm-fonts · [Google Fonts](https://fonts.google.com/specimen/DM+Sans)

---

### Source Sans 3

| Role | Variant | Weight | Typst |
|------|---------|--------|-------|
| Name / Display | Source Sans 3 SemiBold | 600 | Download |
| Body / Bullets | Source Sans 3 Light | 300 | Download |
| Headings / Labels | Source Sans 3 SemiBold | 600 | Download |
| Dates / Tech | IBM Plex Mono Regular | 400 | Download |

Adobe's open-source humanist sans (2012). The current default in this template. Battle-tested at resume sizes and proven to compile cleanly in Typst. Familiar enough that it doesn't distract, refined enough that it doesn't disappoint. The lowest-risk choice. Use as the baseline when you need zero surprises.

**Download:** https://github.com/adobe-fonts/source-sans · [Google Fonts](https://fonts.google.com/specimen/Source+Sans+3)

---

## Universal Type Scale

Applies to any family above. These specs match the current Typst template layout constants and are calibrated for single-page US Letter at 1.5cm margins.

| Role | Size | Weight | Tracking | Leading | Notes |
|------|------|--------|----------|---------|-------|
| Name (H1) | 30pt | Light 300 | −0.01em | — | Display use only |
| Subtitle / contact line | 10pt | Regular 400 | 0.10em | — | All-caps recommended |
| Section heading | 10pt | SemiBold 600 | 0.08em | — | All-caps + thin rule |
| Company / institution | 10.5pt | SemiBold 600 | 0em | — | |
| Role / degree | 10.5pt | Light 300 | 0em | — | |
| Body / bullets | 10.5pt | Light 300 | 0em | 0.75em | Workhorse size |
| Dates / location | 9.5pt | Light 300 | 0.02em | — | Mono optional |
| Tech stack accent | 9pt | Regular 400 | 0em | — | Monospace only |

## Weight Usage

Three weights are sufficient for the full typographic hierarchy:

| Weight | Value | Apply to |
|--------|-------|----------|
| Light | 300 | Name, body text, bullets, dates, role titles |
| Regular | 400 | Supplementary info, monospace accent text |
| SemiBold | 600 | Section headings, company names, institutions |

**Avoid Bold (700+)** — too heavy for resume text density. At 10–10.5pt with Light body, SemiBold headings already create a sharp, confident contrast.

## Where to Apply Typography

- **Name** at top: display size (30pt), Light weight — the only place size does the work
- **Section headings**: SemiBold + tracking + optional all-caps — hierarchy through weight, not size
- **Company / school names**: SemiBold, same size as body — authority without size increase
- **Body / bullets**: Light weight, 10.5pt — the majority of the resume lives here
- **Dates and locations**: slightly smaller (9.5pt), same Light weight, optional mono treatment
- **Tech stack items**: monospace companion at 9pt — signals technical specificity

Never use italic for emphasis in resume body. Use weight.

## Fonts to Avoid

| Font | Why |
|------|-----|
| Helvetica Neue / Arial | Blank corporate — signals no decision was made |
| Roboto | Android/Material Design association — reads as Google product, not executive |
| Calibri / Cambria | Microsoft Word defaults — signals the resume was made in Word |
| Times New Roman / Georgia | Academic register — mismatches tech leadership context |
| Open Sans | Overused, slightly cheap — the Roboto of the previous decade |
| Any font with fewer than 3 weights | Insufficient range for name → heading → body hierarchy |
| Variable-weight-only fonts | Typst requires static weight files (`.otf` / `.ttf`) |

## Recommended Pairings

| System | Header | Body | Mono accent | Personality |
|--------|--------|------|-------------|-------------|
| **Precision Flagship** ⭐ | IBM Plex Sans Light | IBM Plex Sans Light | IBM Plex Mono Regular | Full IBM ecosystem — coherent, engineered, complete |
| **Silicon Valley Standard** | Inter SemiBold | Inter Light | JetBrains Mono Regular | The GitHub/Linear aesthetic — instantly familiar to engineers |
| **Vercel Edge** | Geist Regular | Geist Light | Geist Mono Regular | Most distinctively 2020s tech — strong platform/infra signal |
| **Warm Systems** | DM Sans SemiBold | DM Sans Light | DM Mono Regular | Slightly more approachable — leadership-forward rather than IC-forward |
| **Legacy Proven** | Source Sans 3 SemiBold | Source Sans 3 Light | IBM Plex Mono Regular | Minimal change from current template, zero Typst surprises |

## Typst Setup

None of the recommended fonts are bundled with Typst. The Typst CLI only includes Libertinus Serif, New Computer Modern, and DejaVu Sans Mono — none appropriate for this direction.

**To use a font from this guide:**

```bash
# 1. Download font files into the fonts directory
# infrastructure/typst/fonts/ is already in .gitignore-adjacent — commit OTF/TTF files directly

# 2. Update metadata.toml (handled by TypstFileGenerator.ts)
regular_fonts = ["IBM Plex Sans"]
header_font = "IBM Plex Sans"

# 3. Compile (--font-path is now passed automatically by TypstResumeRenderer.ts)
typst compile --font-path ./fonts cv.typ output.pdf
```

The IBM Plex Sans family (Precision Flagship pairing) is **pre-bundled** in `infrastructure/typst/fonts/` and is the current default. No setup required.

To switch families: download OTF files from the source listed above, place in `fonts/`, and update `metadata.toml`.

## Sources

- [IBM Plex typeface](https://www.ibm.com/plex/) · [GitHub](https://github.com/IBM/plex)
- [Inter — Rasmus Andersson](https://rsms.me/inter/)
- [Geist — Vercel](https://vercel.com/font) · [GitHub](https://github.com/vercel/geist-font)
- [DM Sans — Google Fonts](https://fonts.google.com/specimen/DM+Sans) · [GitHub](https://github.com/googlefonts/dm-fonts)
- [Source Sans 3 — Adobe](https://fonts.adobe.com/fonts/source-sans-3) · [GitHub](https://github.com/adobe-fonts/source-sans)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) · [GitHub](https://github.com/JetBrains/JetBrainsMono)
- [Typst font loading documentation](https://typst.app/docs/reference/text/text/)
- [Which fonts are bundled with Typst CLI](https://forum.typst.app/t/which-fonts-are-included-in-the-compiler/1510)
