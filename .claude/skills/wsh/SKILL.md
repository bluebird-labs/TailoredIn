---
name: wsh
description: Use when the user asks to open files, directories, or URLs in Wave Terminal using the wsh command line tool, or when invoked via /wsh slash command
---

# wsh — Open files and URLs in Wave Terminal

## Usage

When invoked, open each target in a new Wave Terminal block:

- **Files and directories:** `wsh view <absolute-path>`
- **URLs:** `wsh web open <url>`

## Arguments

The user may pass explicit paths/URLs as arguments. If none are provided, look for contextual files that are relevant to the current conversation:

- Active plan files (specs, design docs under `docs/`)
- Log files mentioned in conversation
- Any file currently being discussed

Open each target with a separate `wsh` command. Use absolute paths.

## Examples

```bash
# Open a file
wsh view /Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/plans/my-plan.md

# Open a URL
wsh web open https://github.com/anthropics/claude-code/issues/100

# Open a directory
wsh view /Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities
```
