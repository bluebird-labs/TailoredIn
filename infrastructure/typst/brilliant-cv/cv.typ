#import "@preview/brilliant-cv:3.3.0": cv
#import "./config.typ": cfg-body-font-size, cfg-leading, cfg-margin, cfg-header-font-size
#let metadata = toml("./metadata.toml")
#set text(size: cfg-body-font-size)
#set par(leading: cfg-leading)
#set page(margin: cfg-margin)
// Bump job-title smallcaps from package default 8pt to 9pt for readability
#show smallcaps: it => text(size: 9pt, it)
// Override personal info icons to use text labels instead of Font Awesome
#let custom-icons = (
  github: box(width: 8pt, align(center, text(size: 7pt, "GH"))),
  email: box(width: 8pt, align(center, text(size: 7pt, "✉"))),
  linkedin: box(width: 8pt, align(center, text(size: 7pt, "in"))),
  phone: box(width: 8pt, align(center, text(size: 7pt, "☎"))),
  location: box(width: 8pt, align(center, text(size: 7pt, "⌂"))),
)
// Override the package's hardcoded 32pt name size with our configured value
#show text.where(size: 32pt): set text(size: cfg-header-font-size)
#show: cv.with(metadata, custom-icons: custom-icons)

#include "modules_en/professional.typ"
#include "modules_en/skills.typ"
#include "modules_en/education.typ"
