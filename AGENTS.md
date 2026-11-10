# Skillbox (Fork)

Wenn diese Datei und der bestehende Code oder Deploy sich widersprechen, folge dem Code und melde den Widerspruch, statt die Anweisung blind auszuführen.

## Live (geprüft 10.11.2026)

- Live läuft nicht dieser Fork: `/opt/skillbox` auf `reha-hetzner-main` folgt direkt Upstream `kitze/skillbox` (Stand `9b70d6b`), dieser Fork steht auf `f95b2c2`.
- Compose in `/opt/skillbox`: `compose.yml` + automatisch geladenes, ungetracktes `compose.override.yml` (Logging für `app` und `db`). Nie `-f compose.yml` allein verwenden; vor Compose-Befehlen die Labels `com.docker.compose.project.config_files` prüfen.
- `app` (Image `skillbox:local`) bindet nur `127.0.0.1:4791`. Betrieb, Backup und Rollback: `docs/deployment.md`.
- Kein automatischer Deploy. Upgrades nur auf ausdrücklichen Auftrag; vorher Datenbank sichern (`bash scripts/backup.sh`).
