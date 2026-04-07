#import "@preview/brilliant-cv:3.3.0": cv-metadata, cv-entry, cv-skill, cv-section, h-bar, overwrite-fonts
#import "@preview/fontawesome:0.6.0": fa-phone, fa-envelope, fa-linkedin, fa-square-github, fa-location-dot
#import "./config.typ": cfg-body-font-size, cfg-leading, cfg-margin, cfg-header-font-size
#let metadata = toml("./metadata.toml")

// --- Custom icons (Font Awesome) ---
#let custom-icons = (
  github: fa-square-github(),
  email: fa-envelope(),
  linkedin: fa-linkedin(),
  phone: fa-phone(),
  location: fa-location-dot(),
)

// --- Colors (replicated from package since they are private) ---
#let regular-colors = (
  subtlegray: rgb("#ededee"),
  lightgray: rgb("#343a40"),
  darkgray: rgb("#212529"),
)
#let accent-color = rgb(metadata.layout.awesome_color)

// --- Font setup ---
#let font-config = overwrite-fonts(metadata, ("Source Sans 3",), "Roboto")
#let fonts = font-config.regular-fonts
#let header-font = font-config.header-font

// --- Page & text setup (inlined from package cv() — using our margins) ---
#set text(font: fonts, weight: "regular", size: cfg-body-font-size, fill: regular-colors.lightgray)
#set par(leading: cfg-leading)
#set align(left)
#set page(
  paper: metadata.layout.at("paper_size", default: "a4"),
  margin: cfg-margin,
)

// Update package state so cv-entry, cv-section etc. work
#cv-metadata.update(metadata)

// Bump job-title smallcaps from package default 8pt to 9pt for readability
#show smallcaps: it => text(size: 9pt, it)

// Prevent experience entries from splitting across pages
#set block(breakable: false)

// --- Header (inlined from package _cv-header) ---
#let header-info-font-size = eval(metadata.layout.header.at("info_font_size", default: "10pt"))
#let personal-info = metadata.personal.info
#let first-name = metadata.personal.first_name
#let last-name = metadata.personal.last_name
#let header-quote = metadata.lang.at(metadata.language).at("header_quote", default: none)

#let make-header-info(personal-info) = {
  // Collect only non-empty entries so h-bar separators are placed correctly
  let entries = personal-info.pairs().filter(pair => pair.at(1) != "")
  let n = 1
  for (k, v) in entries {
    let icon = custom-icons.at(k, default: none)
    box({
      if icon != none { icon; h(5pt) }
      if k == "email" { link("mailto:" + v)[#v] }
      else if k == "linkedin" { link("https://www.linkedin.com/in/" + v)[#v] }
      else if k == "github" { link("https://github.com/" + v)[#v] }
      else if k == "phone" { link("tel:" + v.replace(" ", ""))[#v] }
      else { v }
    })
    if n != entries.len() { h-bar() }
    n = n + 1
  }
}

#table(
  columns: 1fr,
  inset: 0pt,
  stroke: none,
  row-gutter: 6mm,
  [#text(font: header-font, size: cfg-header-font-size, weight: "light", fill: regular-colors.darkgray, first-name) #h(5pt) #text(font: header-font, size: cfg-header-font-size, weight: "bold", last-name)],
  [#text(size: header-info-font-size, fill: accent-color, make-header-info(personal-info))],
  .. if header-quote != none { ([#text(size: 10pt, weight: "medium", style: "italic", fill: accent-color, header-quote)],) },
)

// --- Body ---
#include "modules_en/professional.typ"
#include "modules_en/skills.typ"
#include "modules_en/education.typ"
