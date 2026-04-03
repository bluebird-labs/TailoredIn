# Typst Resume Fonts

Bundled font files for the resume Typst template. These are committed to the repo for reproducible builds — all fonts are licensed under SIL Open Font License 1.1, which permits redistribution.

## Bundled Fonts

### IBM Plex Sans (body + header)

The primary typeface. IBM's corporate geometric sans-serif — clean, engineered, Systems Precision.

| File | Weight | Use |
|------|--------|-----|
| `IBMPlexSans-Light.otf` | Light 300 | Body text, name display |
| `IBMPlexSans-Regular.otf` | Regular 400 | Supplementary text |
| `IBMPlexSans-SemiBold.otf` | SemiBold 600 | Section headings, company names |
| `IBMPlexSans-LightItalic.otf` | Light Italic | Emphasis in body |

### IBM Plex Mono (accent)

Monospaced companion for dates, locations, and tech stack callouts.

| File | Weight | Use |
|------|--------|-----|
| `IBMPlexMono-Light.otf` | Light 300 | Dates, metadata |
| `IBMPlexMono-Regular.otf` | Regular 400 | Tech stack items |

## Adding Other Fonts

To use a different typeface from `docs/resume-fonts.md`:

1. Download OTF/TTF files from the source listed in the doc
2. Place them in this directory
3. Update `metadata.toml` with the font name (e.g., `regular_fonts = ["Inter"]`)
4. The renderer already passes `--font-path ./fonts` — no code change needed

## License

All bundled fonts: SIL Open Font License 1.1  
Source: https://github.com/IBM/plex
