# MoneyPulse Findings

## Initial Decisions
- Use integer minor units for all money fields to avoid floating point errors.
- Store `currency` separately as one of `CNY`, `USD`, `GBP`, `EUR`.
- Keep sensitive values such as `JWT_SECRET` and `SMTP_PASS` in environment variables.
- Use daily digest reminders rather than one email per asset.
- Keep real expenses separate from asset recurring cost settings.
- Use `sql.js` for SQLite file persistence to avoid native addon builds on local Node 26 while still storing an SQLite database file.

## Dependency Install Finding
- `better-sqlite3` failed to install locally because no prebuilt binary was available for Node 26.1.0 and node-gyp failed while downloading Node headers through the current proxy/undici path.
- Replaced native SQLite binding with `sql.js` to keep implementation portable.

## Remote Repository
- Target remote: https://github.com/noaul/moneypulse
- Initial remote check showed an empty repository.
