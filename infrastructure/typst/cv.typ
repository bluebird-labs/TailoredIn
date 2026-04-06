#import "@preview/brilliant-cv:3.3.0": cv
#import "./config.typ": cfg-body-font-size, cfg-leading, cfg-margin
#let metadata = toml("./metadata.toml")
#set text(size: cfg-body-font-size)
#set par(leading: cfg-leading)
#set page(margin: cfg-margin)
// Override personal info icons to use text labels instead of Font Awesome
#let custom-icons = (
  github: box(width: 10pt, align(center, text(size: 8pt, "GH"))),
  email: box(width: 10pt, align(center, text(size: 8pt, "✉"))),
  linkedin: box(width: 10pt, align(center, text(size: 8pt, "in"))),
  phone: box(width: 10pt, align(center, text(size: 8pt, "☎"))),
  location: box(width: 10pt, align(center, text(size: 8pt, "⌂"))),
)
#show: cv.with(metadata, custom-icons: custom-icons)

#include "modules_en/professional.typ"
#include "modules_en/skills.typ"
#include "modules_en/education.typ"
