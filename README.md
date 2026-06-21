# World Cup 2026 — Bracket & Standings Simulator

Standalone, zero-build HTML tools for understanding and simulating the 2026 FIFA World Cup
(the first 48-team, 12-group, Round-of-32 format). Open any file directly in a browser.

## Files

| File | What it is |
|------|------------|
| `worldcup-2026-standings.html` | Editable group-standings simulator. Match results are the source of truth; standings snapshots are computed from them. A single **"Reset to…"** control jumps to a blank slate, the current results, any **dated snapshot**, or a **saved scenario** (Save/label your own). Edit `Pld / W / D / L / GF / GA`; `GD` and `Pts` auto-compute and groups re-sort live. Hands the live table to the bracket. |
| `worldcup-2026-bracket.html` | Round-of-32 → Final bracket with connector arrows, the 3rd-place **eligibility matrix**, and a solver that ranks the 12 third-placed teams, takes the best 8, and slots them into the eight group-winner matches (FIFA Annex-C style). Populates real team names when launched from the standings page. |
| `worldcup-2026-bracket.mmd` | Mermaid source of the bracket, for rendering in Mermaid-aware tooling. |

## How the two pages connect

The standings page's **"→ open bracket with these standings"** button encodes the current
table into the bracket URL (`#data=…`); the bracket recomputes winners, runners-up, and the
8 qualifying third-placed teams from it. Open the bracket on its own and it falls back to
generic slot labels.

## Data

Real results, group stage starting 2026-06-11. Standings are derived from dated match events,
so every snapshot is internally consistent (goal totals balance, equal games played).

## Notes

- No build step, no dependencies — just open the HTML.
- The 3rd-place slotting is *a* valid Annex-C-style matching (respects the eligibility matrix
  and avoids group rematches); for a given set of qualifiers it may differ from FIFA's exact
  published row.
