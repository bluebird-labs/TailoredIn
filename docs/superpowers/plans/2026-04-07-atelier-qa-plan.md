# Atelier & Generation Settings — QA Plan

You are testing a new feature called "Atelier" in the TailoredIn web application. The Atelier is a three-column resume crafting workspace that lets users configure generation settings, tailor resumes to job descriptions, and preview PDFs.

## App Overview

TailoredIn is a resume tailoring tool. Users have a **profile** (name, contact info), **experiences** (work history with accomplishments), **education**, and **job descriptions** they're applying to. The app generates AI-tailored resumes for specific jobs.

The **Atelier page** (`/atelier`) is the new central workspace with three columns:
- **Left column (~280px)**: Generation Settings — model tier selector, bullet range inputs, prompts accordion
- **Center column (flexible)**: Tailoring workspace — job selector dropdown at top, additional prompt textarea, Generate Resume button, then generated content (headline card, experience cards with bullets, education)
- **Right column (~35%)**: PDF preview — theme dropdown, Generate PDF button, PDF iframe

## App URL

The app will already be running. Navigate to the URL provided to you (likely `http://localhost:<port>`). The landing page may be `/profile` or similar — use the sidebar to navigate.

## Sidebar Navigation

The left sidebar has these sections:
- **Resume**: Profile, Experiences, Education
- **Directory**: Jobs, Companies
- **Atelier**: the new entry (look for a wand or palette icon)

## UI Patterns to Know

- **Segmented control**: a row of buttons where one is selected (highlighted). Click an option to select it.
- **Accordion**: collapsible sections. Click the header (or arrow) to expand/collapse. Only one may be open at a time.
- **Combobox/dropdown**: click to open a list of options, click an option to select.
- **Eye icon toggle**: an eye (👁) icon next to items. Click to toggle visibility. Hidden items appear faded or with strikethrough.
- **Bullet range pill**: a small rounded badge on experience cards showing something like "3–5". If it has an accent/colored border, it's been overridden. If muted/gray, it's using the default. Click it to edit.
- **Regenerate button**: a circular arrow icon (↻ or RotateCw). Clicking it may open a small popover with an optional textarea for one-off instructions, then a confirm button.
- **Save/Discard buttons**: appear at the bottom of the settings column after changes are made. Click Save to persist, Discard to revert.
- **Toast notifications**: brief messages that appear (usually top-right or bottom) confirming actions like "Changes saved".

## Important Timing Notes

- **Resume generation takes 10-30 seconds** (it calls an AI model). Wait for the loading state to resolve before checking results. Look for a spinner or loading indicator.
- **PDF generation takes a few seconds**. Wait for the iframe to load content.
- After clicking Save on settings, wait for any loading/success indicator before refreshing.

---

## Test Sections

Execute each section in order. Mark steps as pass/fail. If a step fails, note what happened and continue to the next step.

### 1. Navigation

1. Look at the sidebar. Verify there is an "Atelier" entry (may have a wand or palette icon).
2. Click "Atelier". Verify a page loads with three columns: settings on the left, a workspace in the center, and a preview area on the right.
3. Click "Jobs" in the sidebar. Click on any job in the list to open its detail page. Verify there is NO "Resume" tab on the job detail page — it should only show an "Overview" tab (or just the job content without tabs).

### 2. Settings — Model Tier

1. Navigate to Atelier (click "Atelier" in sidebar).
2. In the left column, find the Model Tier selector. It should show three options: "Fast", "Balanced", "Best". One should be selected (likely "Balanced" or "Best" as the default).
3. Click "Fast" to select it.
4. Click the "Save" button at the bottom of the left column.
5. Refresh the page (Cmd+R or F5).
6. Verify "Fast" is still selected after refresh.
7. Click "Balanced". Save. Refresh. Verify "Balanced" is selected.

### 3. Settings — Bullet Range

1. In the left column, find the "Default Bullet Range" section with two number inputs labeled "Min" and "Max".
2. Note the default values (should be min=2, max=5).
3. Change min to 3 and max to 4.
4. Click Save. Refresh the page.
5. Verify the inputs show 3 and 4.
6. Try setting min to 5 and max to 3 (min greater than max). Attempt to save. Verify the app shows a validation error or prevents saving.
7. Reset to valid values (e.g., min=3, max=5). Save.

### 4. Settings — Prompts

1. In the left column, find the "Prompts" section. It should be an accordion with 3 collapsible sections: "Resume", "Headline", "Experience".
2. Click "Resume" to expand it. A textarea should appear.
3. Type: "Always use action verbs. Keep bullets concise."
4. Click Save. Refresh the page.
5. Click "Resume" to expand it again. Verify the text "Always use action verbs. Keep bullets concise." is still there.
6. Click "Headline" to expand it. Type: "Emphasize leadership qualities."
7. Click Save. Refresh. Expand "Headline". Verify the text persists.
8. Click "Experience" to expand it. Type: "Quantify impact with metrics."
9. Click Save. Refresh. Expand "Experience". Verify the text persists.
10. Expand "Resume". Clear the text entirely (select all + delete). Click Save. Refresh. Expand "Resume". Verify the textarea is empty.

### 5. Job Selection

1. In the center column, find the job selector (a dropdown/combobox near the top).
2. Click it. Verify a list of job descriptions appears.
3. Select a job from the list.
4. Verify the selected job's title (and possibly company name) appears in the selector.
5. Below the selector, verify you see either:
   - Previously generated resume content (headline + experiences), OR
   - An empty state with a "Generate Resume" button

### 6. Resume Generation — Full

1. Make sure settings are configured: model tier = "Best" (or "Balanced"), bullet range min=3 max=5, resume prompt = "Always use action verbs."
2. Select a job in the center column.
3. If there's an "Additional prompt" textarea, optionally type: "Focus on backend experience."
4. Click "Generate Resume".
5. Wait 10-30 seconds for generation to complete (watch for loading indicator).
6. Verify a headline appears in a headline card at the top of the generated content.
7. Verify experience cards appear below with bullet points.
8. Count the bullets on each experience. They should be between 3 and 5 (the configured range).
9. Verify each experience card has a bullet range pill showing "3–5" (or the configured default).

### 7. Headline Regeneration

1. With generated content visible, find the regenerate icon (↻) on the headline card.
2. Click it. If a popover appears with a textarea, type "Make it shorter" and confirm. If no popover, it may regenerate directly.
3. Wait for regeneration to complete.
4. Verify the headline text has changed.
5. Verify all experience cards still show their original bullets (unchanged).

### 8. Experience Regeneration

1. Find the regenerate icon (↻) on one of the experience cards.
2. Click it. If a popover appears, optionally type a prompt and confirm.
3. Wait for regeneration to complete.
4. Verify that experience's bullets have changed.
5. Verify the headline and other experience cards are unchanged.

### 9. Per-Experience Bullet Range Override

1. On an experience card, find the bullet range pill (e.g., "3–5"). It should have a muted/gray appearance (using default).
2. Click the pill. An edit interface should appear (inline inputs or a small popover).
3. Set min=2, max=2.
4. Save/confirm the override.
5. Verify the pill now shows "2–2" with an accent-colored border (indicating it's been overridden).
6. Click the regenerate button on that same experience.
7. Wait for regeneration. Verify exactly 2 bullets are generated.
8. Check another experience card — its bullets should still match the profile default (3–5).
9. Click the overridden pill again. Look for a "Reset to default" option or clear the values. Confirm.
10. Verify the pill reverts to muted style showing the profile default range.

### 10. Bullet Visibility Toggles

1. On an experience card with bullets, find the eye icon (👁) next to a bullet.
2. Click it. Verify the bullet becomes faded, crossed out, or otherwise visually marked as hidden.
3. Click the same eye icon again. Verify the bullet returns to normal (visible).
4. Hide 1-2 bullets by clicking their eye icons.
5. Proceed to generate a PDF (section 12) and verify those hidden bullets do NOT appear in the PDF.

### 11. Education Visibility

1. Scroll down in the center column to find the Education section.
2. Find an education entry with an eye icon.
3. Click the eye icon. Verify the entry becomes visually marked as hidden.
4. When generating a PDF later, verify this hidden education entry does NOT appear.

### 12. PDF Preview

1. In the right column, find the theme selector dropdown. Click it and select a theme.
2. Click "Generate PDF".
3. Wait a few seconds. Verify a PDF appears in the preview iframe.
4. Visually check the PDF contains:
   - The generated headline
   - Only the visible bullets (not the ones hidden in step 10)
   - Only the visible education entries (not hidden ones from step 11)
5. Look for an expand/maximize button. Click it. Verify a larger/fullscreen view of the PDF opens.
6. Close the expanded view.

### 13. Job Switching

1. Note the current headline and bullet content (Job A).
2. Click the job selector and choose a different job (Job B).
3. Verify the center column updates — either shows Job B's existing content or an empty state with Generate button.
4. Switch back to Job A in the selector.
5. Verify Job A's previously generated content reloads correctly (same headline and bullets as before).

### 14. Settings Affect Generation

1. Change model tier to "Fast". Save.
2. Select a job and generate a resume. Verify generation completes successfully (it may be faster or slightly different quality — just verify it doesn't error).
3. Change bullet range to min=5, max=6. Save.
4. Regenerate an experience (one without a per-experience override). Verify the regenerated experience has 5 or 6 bullets.
5. Change the Resume prompt to: "Write everything in French." Save.
6. Generate a full resume for a job. Verify the output is in French (or at least strongly influenced by the prompt).
7. Clean up: reset the Resume prompt to something sensible or clear it. Reset bullet range to min=3, max=5. Set model tier back to "Best". Save.

### 15. Prompt Composition

1. Set Resume prompt: "Always use past tense." Save.
2. Set Experience prompt: "Focus on metrics and quantifiable results." Save.
3. Regenerate a single experience. Verify the bullets:
   - Use past tense (from the Resume base prompt)
   - Emphasize metrics/numbers (from the Experience prompt)
4. Set Headline prompt: "Keep under 10 words." Save.
5. Regenerate the headline. Verify:
   - The headline is concise / under ~10 words (Headline prompt)
   - Uses past tense or past-tense-consistent language (Resume base prompt)

### 16. Persistence Across Sessions

1. Configure distinctive settings: model tier = "Fast", bullet range min=4, max=7, Resume prompt = "Test persistence."
2. Save all settings.
3. Close the browser tab completely.
4. Open a new tab and navigate to the app URL.
5. Click "Atelier" in the sidebar.
6. Verify: model tier shows "Fast", bullet range shows 4 and 7, Resume prompt shows "Test persistence."
7. Reset settings to preferred defaults and save.

### 17. Edge Cases

1. **No experiences**: If possible, test with a profile that has no experiences. Navigate to Atelier, select a job, click Generate. Verify the app handles it gracefully (generates headline only, shows appropriate message, or disables the button).
2. **Long prompt**: Expand a prompt section. Paste a very long text (~500 characters). Save. Refresh. Verify the full text is preserved.
3. **Rapid job switching**: Select Job A, immediately switch to Job B, then back to Job A quickly. Verify no errors appear and the correct content loads.
