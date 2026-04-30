# Eureka — Claude Code Context

## Security — REQUIRED
Canonical standard lives in the Artificer Systems repo at `SECURITY_STANDARD.md`.
Triggered by the PocketOS incident on 2026-04-24 + ticket #1007.

- **No destructive ops without human confirmation.** No `DROP TABLE`,
  no unscoped `DELETE`, no `TRUNCATE`, no Railway volume/service
  deletion, no force-push to `main`, no `git reset --hard` past a
  deployed commit. Propose; the human runs it.
- **Tokens scoped to the minimum.** A Railway token that just needs
  to update a domain shouldn't have volume permissions.
- **Production secrets stay in Railway env vars.** If you find a
  `RAILWAY_TOKEN`/`STRIPE_SECRET_KEY`/`ANTHROPIC_API_KEY` in a
  committed file, flag it — it needs rotation.
- **Read-by-default, write-on-request.** Inspect schemas, read row
  counts, fetch logs freely. Production writes — even single-row —
  get proposed first.
- **Off-platform DB backup required for production.** Railway's own
  backups can be wiped via one API call.

---

This file inherits the Artificer security standard. Expand with
project-specific rules (stack, conventions, gotchas) as the codebase
matures. See `README.md` (if present) for setup.
