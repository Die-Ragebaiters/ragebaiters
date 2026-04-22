# die Ragebaiters – Login + Mediathek mit Supabase

Rein statisches Paket, läuft auf **GitHub Pages** (oder jedem anderen Static-Host).
Kein PHP, keine eigene Datenbank. Supabase übernimmt:

- Auth (Login / Registrierung)
- Datenbank (Profile + Fotos + Einladungscodes)
- Dateispeicher (Fotos im Supabase Storage)

---

## Einmaliges Setup (10 Minuten)

### 1. Supabase-Projekt anlegen
1. Auf [supabase.com](https://supabase.com) einen kostenlosen Account erstellen.
2. **New Project** → Name: `ragebaiters`, Region: Frankfurt (EU), Passwort für die DB setzen und merken.
3. Warten, bis das Projekt fertig ist (ca. 1 Minute).

### 2. Schema importieren
1. Im Supabase-Dashboard links auf **SQL Editor** klicken.
2. Inhalt von `supabase_admin_dashboard.sql` komplett einfügen.
3. **Run** drücken.

Dabei werden automatisch angelegt:
- Tabellen `profiles`, `invites`, `photos`
- View `photos_public`
- Rate-Limit-Tabelle `edge_rate_limits`

### 2b. Hinweis zum Security-Setup
Die kritischen Flows laufen jetzt über Supabase Edge Functions mit `service_role`:
- Invite-Prüfung und Registrierungsabschluss
- private Medien-Auslieferung per signed URLs
- sichere Upload-Tickets
- Admin-/Benutzerbild-Löschung

Wichtig:
- Den Bucket `photos` im Supabase-Dashboard auf **privat** stellen.
- Danach die Edge Functions aus `supabase/functions/` deployen.

### 3. API-Keys kopieren
1. Links auf **Project Settings** → **API**.
2. Du brauchst zwei Werte:
   - `Project URL` (z.B. `https://xyzabc.supabase.co`)
   - `anon public` Key (ein langer Token, beginnt mit `eyJ...`)

### 4. config.js füllen
Öffne `config.js` im Paket und trage die beiden Werte ein:
```js
window.SUPABASE_URL      = 'https://DEIN-PROJEKT.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJ...dein-anon-key...';
```

Diese Werte sind **öffentlich** und gehören in den Frontend-Code. Gesperrt wird alles
über Row-Level-Security (RLS) in der Datenbank – niemand kann ohne Berechtigung
schreiben.

Optional:
```js
window.TURNSTILE_SITE_KEY = 'dein-cloudflare-turnstile-site-key';
```
Damit wird auf `register.html` eine zusätzliche Invite-Captcha angezeigt.

### 4b. Edge Functions deployen
1. Supabase CLI installieren und anmelden.
2. Im Projektordner die Functions deployen:
```bash
supabase functions deploy invite-api
supabase functions deploy media-api
```
3. Falls ihr Turnstile nutzen wollt, Secret setzen:
```bash
supabase secrets set TURNSTILE_SECRET_KEY=dein-turnstile-secret
```
4. Empfohlen fuer strenge Origin-Pruefung:
```bash
supabase secrets set ALLOWED_APP_ORIGINS=https://ragebaiters.de,https://www.ragebaiters.de
```

### 5. E-Mail-Bestätigung abschalten (optional, aber bequem)
Im Supabase-Dashboard:
- **Authentication → Sign In / Up → Email → Confirm email** → ausschalten.

Sonst bekommt jedes neue Teammitglied eine Bestätigungs-Mail – auch ok, aber etwas mehr Reibung.

### 6. Upload zu GitHub
Kopiere alle Dateien aus diesem ZIP ins Root-Verzeichnis deines GitHub-Pages-Repos
(zusammen mit dem vorhandenen `images/`-Ordner). Committen, pushen, fertig.

---

## Struktur

```
ragebaiters.de/
├── index.html          Startseite
├── team.html           Einheit
├── impressum.html      Impressum
├── mediathek.html      interne Galerie (Lightbox, Login erforderlich)
├── login.html          Anmeldung
├── register.html       Registrierung mit Invite-Code
├── dashboard.html      interner Bereich: Upload + eigene Bilder
├── styles.css          Haupt-Design
├── impressum.css       Zusatzstyles Impressum
├── app.css             Styles für Login / Upload / Galerie
├── script.js           Team-Modal
├── config.js           ← deine Supabase-Zugangsdaten (du füllst sie aus)
├── auth.js             Supabase-Client + dynamische Nav
├── supabase_admin_dashboard.sql  Schema für Supabase (einmalig importieren)
└── images/             deine bestehenden Logos und Banner
```

---

## Neue Teammitglieder einladen

Jedes neue Mitglied braucht einen **Einladungscode**. So legst du einen an:

1. Supabase-Dashboard → **Table Editor** → Tabelle `invites`.
2. **Insert row** → `code` = z.B. `JASON-2026` → Save.
3. Den Code an das Teammitglied weitergeben.
4. Nach der Registrierung auf `register.html` ist der Code verbraucht.

Fuer das erste Konto:
- zuerst einen Invite manuell in `invites` anlegen
- nach der ersten Registrierung die eigene Rolle in `profiles` einmalig auf `admin` setzen

## Admin-Rechte vergeben

Nach der Registrierung steht dein Account auf `role = 'observer'`, bis der Invite serverseitig abgeschlossen wurde. Ein Admin kann
bisher nichts Besonderes – das Feld ist vorbereitet für spätere Erweiterungen
(z.B. andere Bilder löschen dürfen).
Zum Upgraden: Supabase → Table Editor → `profiles` → deine Zeile → `role` auf `admin` setzen.

---

## Was die Regeln garantieren (RLS-Policies)

- Invite-Prüfung und Registrierungsabschluss laufen serverseitig über Edge Functions.
- Medien werden serverseitig als signed URLs erzeugt und nicht mehr direkt aus dem Browser freigegeben.
- Uploads laufen über serverseitig erzeugte Upload-Tickets.
- Normale Benutzer können nur ihre **eigenen** Bilder löschen.
- Admins können alle Mediathek-Bilder und Benutzerbilder sicher löschen.
- Die SQL-Funktion `consume_rate_limit()` begrenzt sensible Aktionen zusätzlich serverseitig.

---

## Was kostet das?
Der kostenlose Supabase-Plan reicht locker für euch:
- 500 MB Datenbank
- 1 GB Datei-Storage
- 50.000 aktive User / Monat
- 5 GB Traffic / Monat

Für ein Airsoft-Team-Portal ist das völlig ausreichend.
