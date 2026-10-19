---
name: where-are-we
description: Report where the Livenotes project stands right now - Done / Doing / Next / Planned, plus blockers and loose ends - by reading git branches, the GitHub board, milestones, issues and PRs, the epic docs and the strategy/ADRs. Read only. Use when the user asks "where are we", "status", "what's next", "what's in progress", or wants a project catch-up.
---

# Where are we

Build a short, factual status report of Livenotes. **Read only**: never commit, push, edit issues or write files unless the user asks afterwards.

## 1. Gather (run independent commands in parallel)

Repo: `/opt/projects/livenotes-app`. GitHub writes/reads use the `PhilipGazagnes` account (`gh auth switch --user PhilipGazagnes` if a call returns 404). Use `rtk proxy` when a command's output looks truncated.

**Git**
- `git fetch --all --prune -q` then `git branch -a --sort=-committerdate --format='%(refname:short) %(committerdate:short) %(subject)'`
- Ahead/behind for each local and remote branch vs `main` and `develop`: `git rev-list --left-right --count main...<branch>`
- `git log --oneline -20 develop` and `git log --oneline main..develop` (on develop, not yet in prod)
- `git status --short` (uncommitted / untracked work) and `git stash list`
- Branches already merged into main (`git branch --merged main`) = cleanup candidates

**GitHub**
- Board (project 1): `gh project item-list 1 --owner PhilipGazagnes --format json --limit 200` → group by `status` (Todo / In Progress / Done), note `milestone`, `priority`, `size`, labels
- Milestones: `gh api repos/PhilipGazagnes/livenotes-app/milestones?state=all --jq '.[]|"\(.number) \(.title) \(.state) open=\(.open_issues) closed=\(.closed_issues) due=\(.due_on)"'`
- Open PRs: `gh pr list --state open --json number,title,headRefName,isDraft,updatedAt`
- Recently closed issues (last ~14 days): `gh issue list --state closed --limit 20 --json number,title,closedAt,milestone`

**Docs**
- Epics: `docs/epics/*.md` → read the `**Branch:**` and `**Status:**` header lines of each
- `docs/TECHNICAL_DEBT.md` (headings only, unless relevant)
- Plan: `../livenotes-documentation/app/strategy-2026.md` (phases and their order); ADR titles in `../livenotes-documentation/app/decisions/` (only the newest few matter)

## 2. Classify

- **Done**: closed milestones/issues, board "Done", epics marked Done, commits on `main` in the last ~2 weeks (or since the last finished epic).
- **Doing**: board "In Progress", open PRs, branches with commits not in `develop`, `main..develop` (merged but not deployed), uncommitted work.
- **Next**: Todo items in the current (lowest-numbered open) phase milestone, by priority (P0 → P2); the next step named in strategy-2026.md.
- **Planned**: later phase milestones and Backlog, one line per milestone with its count, not every issue.

Cross-check sources and flag mismatches (e.g. issue closed but board still "In Progress", epic says Done but branch unmerged, branch with no issue, milestone with all issues closed but still open).

## 3. Report (in the terminal: dashboard first, details underneath)

Start with a heading and one sentence (current phase and overall state), then **one fenced code block** holding the at-a-glance dashboard below. Then the detail sections.

### Dashboard (inside a ``` block, monospace)

Four panels, separated by a blank line. Fill them with the real data; this is an example:

```
PHASES                                           closed/total
  0  Monorepo        ██████████  7/7    ✓
  1  Offline         ██████████  11/11  ✓
  1b Local-first     ██████████  11/11  ✓
  2  Cleanup         ███░░░░░░░  2/6    ◀ now
  3  Musician        ░░░░░░░░░░  0/3
  4  Mobile MVP      ░░░░░░░░░░  0/1
     Backlog         · 5 open

BOARD
  ┌─ Done (2 wk) ─┬─ Doing ───────┬─ Next ────────┬─ Planned ─────┐
  │ 33 issues     │ 0             │ #48 creds     │ Phase 3   · 3 │
  │ last: #43     │               │ #44 npm audit │ Phase 4   · 1 │
  │ 2026-10-11    │               │ #46 Ionic     │ Backlog   · 5 │
  │               │               │ #47 errors    │               │
  └───────────────┴───────────────┴───────────────┴───────────────┘

BRANCHES                               vs main    vs develop
  main      ●── 22064cf  (prod)         —          0↑ 0↓
  develop   ●── 22064cf                 0↑ 0↓      —
  feat/x    ●── 22064cf  ✓ merged → delete?

HEALTH
  ⚠ 2 loose ends   ✎ 2 uncommitted   ☰ 4 stashes   ⇄ 0 open PRs
```

Drawing rules:
- Progress bars: 10 cells, `█` per closed tenth (round down, but full only when all closed), `░` for the rest. `✓` when the milestone is closed, `◀ now` on the current phase.
- Board columns: at most 5 rows each. Next = issue number + 1–2 word label (+ priority if set); overflow becomes `+N more`. Keep the box widths aligned.
- Branches: `n↑` = commits ahead, `n↓` = behind. Mark `(prod)` on main, `✓ merged → delete?` for branches fully merged into main, `⚠ stale` for no commit in 30+ days. List only local branches plus remote-only ones.
- Health: one line of counters. Omit a counter when it is 0, except open PRs.
- Keep the dashboard under ~30 lines, and no wider than ~80 columns.

### Details (normal markdown, under the dashboard)

```
## Done (last ~2 weeks)
## Doing
## Next
## Planned
## Loose ends   (mismatches, stale/merged branches, uncommitted files, blockers)
```

Rules: bullets, one line each, with `#issue` numbers and branch names. Don't repeat what the dashboard already shows: add the detail it can't (titles, why, links between items). Facts only, no guessing — say "unknown" when a source is missing. Keep the details under ~30 lines. End with at most 1-2 suggested next actions.
