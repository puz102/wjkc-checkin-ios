# KS Auto Checkin Template (Public)

This template supports:
- One-click / native subscription import
- Auto token capture after web login
- Auto checkin via Shadowrocket / Surge / Quantumult X / Loon

## Supported domains (pre-filled)
- `wj-kc.com`
- `84.wj-kc.com`
- `ks.wjkc.xyz`

## Workflow
1. User logs in on website.
2. App intercepts login response on same domain.
3. App extracts `token` cookie and saves it locally.
4. Scheduled checkin script uses saved token only.

## Public-safe placeholders
Replace only the sensitive parts in config/script files:
- `YOUR_TOKEN_STORAGE_KEY`
- `YOUR_LAST_ACTIVE_DOMAIN_KEY`
- `OWNER/REPO`

## Security
- Do NOT commit real token.
- Do NOT commit password.
- Token is stored inside the app local storage only.

## Quick Steps
1. Fork or download this template.
2. Replace `YOUR_PRIMARY_DOMAIN` / `YOUR_BACKUP_DOMAIN` / `OWNER/REPO`.
3. Import module/plugin into target app.
4. Login on website once.
5. Let module capture token automatically.
6. Wait for scheduled checkin.

## Suggested cron
```text
0 8,12,21 * * *
```
