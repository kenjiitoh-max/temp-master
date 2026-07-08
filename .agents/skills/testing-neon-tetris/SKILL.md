---
name: testing-neon-tetris
description: Test the Neon Tetris game (tetris/index.html) end-to-end. Use when verifying Tetris gameplay, rotation/wall-kick, hold, hard-drop, line-clear, or pause UI changes.
---

# Testing Neon Tetris (`tetris/index.html`)

Self-contained static HTML/Canvas/JS game. No backend, no build, no login, no secrets.

## Devin Secrets Needed
- None.

## How to run
Open the file directly in Chrome. On Windows the address bar mangles `file:///C:/...`
paths (autocompletes into a Google search), so open it via the shell instead:

```powershell
Start-Process chrome "file:///C:/Users/Administrator/repos/temp-master/tetris/index.html"
```

Click the **START** button (roughly center of the board overlay) to begin.

## Controls
← → move · ↑ / X rotate · Z rotate left · ↓ soft drop · Space hard drop · C hold · P pause.

## Golden-path checks
1. Start — overlay disappears, falling piece + ghost + NEXT queue appear.
2. Move/rotate — arrows move (blocked at walls), ↑ rotates, ghost tracks landing spot.
3. Hold (C) — active piece moves to Hold box, new piece spawns.
4. Hard drop (Space) — piece locks instantly, NEXT advances, new piece spawns.
5. Line clear — a full row flashes, disappears; Lines +1 and Score increases.
6. Pause (P) — "PAUSED" overlay with 再開 button; P again resumes.

## Line-clear testing is the hard part — use a deterministic test setup
Manually stacking pieces to complete a row via the slow computer-use tool is extremely
error-prone: pieces keep falling under real-time gravity and the game ends before you
finish, and reading exact column positions from Canvas screenshots is unreliable
(easy to be off-by-one on which column is the gap; rotation wall-kicks near walls
fight you). Rather than fight it, temporarily edit `reset()` in `tetris/index.html`:

- Disable gravity: set `dropInterval` very large (e.g. `100000000`).
- Pre-fill the bottom row leaving the I-piece's spawn columns (cols 3–6) empty:
  `for (let x=0;x<COLS;x++){ if (x<3||x>6) grid[ROWS-1][x] = 'I'; }`
  (placed right after `grid = Array.from(...)`).
- Force the first piece to an I: `current = spawn('I');`

Then one hard-drop (Space) fills cols 3–6 and clears the line — Lines 0→1, Score jumps.

**Gotcha:** the grid stores the piece *type letter* (e.g. `'I'`), NOT a color. Draw does
`COLORS[grid[y][x]]`, and a bad value (e.g. a hex color string) makes `addColorStop`
throw and blanks the whole board. Always pre-fill with a valid type letter.

**Always revert these edits after testing** and confirm `git diff tetris/index.html`
is empty — they are test-only and must not be committed.

## Notes
- Wall-kick offsets use a Y-down coordinate system (a past bug had the JLSTZ Y-sign flipped).
- Record browser interactions and annotate with `annotate_recording`; verify the
  PAUSED overlay and post-clear HUD (Lines/Score) as evidence.
