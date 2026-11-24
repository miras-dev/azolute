# Azolute: project notes for Claude

Before starting any task, read `docs/START-HERE.md`. It says where the
business plan, the 2026–2028 market research, the n8n automations and the
app.azolute.one build stand, and what comes next.

- A push to `main` deploys the website (`.github/workflows/deploy.yml`).
  `docs/` and `.claude/` are not uploaded; any `.html` change goes live.
- Several chats often work at once: before merging to `main`, check other
  `claude/...` branches for newer versions of the same files.
- Never commit `research_notes/`, `reports/`, secrets or client deal terms.
- After a session's work, add a change log in `docs/changes/` and update
  `docs/START-HERE.md`.
