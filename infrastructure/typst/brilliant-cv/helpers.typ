#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("#3E6B8A")
#let _section-skip = 4pt

// Custom cv-section: re-implements brilliant-cv's section header with an accent-colored divider line.
// The package's built-in cv-section uses a hardcoded black stroke that does not follow awesome_color.
#let cv-section(title) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", title)
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}
