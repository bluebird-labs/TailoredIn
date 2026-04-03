#import "@preview/brilliant-cv:3.3.0": cv
#let metadata = toml("./metadata.toml")
#set text(size: 10.5pt)
#set par(leading: 0.75em)
#set page(margin: 1.5cm)
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
