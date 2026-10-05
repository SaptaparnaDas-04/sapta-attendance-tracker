# Attendance Tracker

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sapta-attendance-tracker.vercel.app/)
[![Hosted on Vercel](https://img.shields.io/badge/hosted%20on-Vercel-black)](https://vercel.com/)
[![Backend: Supabase](https://img.shields.io/badge/backend-Supabase-3ecf8e)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](#progressive-web-app)
[![Build](https://img.shields.io/badge/build-none%20required-blue)](#getting-started)

A lightweight, cloud-synced web application for tracking class attendance. Students define their subjects and weekly timetable, record each class as present, absent or cancelled, and see in real time how their attendance compares with a target, including how many classes they can still afford to miss.

**Live application:** <https://sapta-attendance-tracker.vercel.app/>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Attendance Calculation](#attendance-calculation)
4. [AI Assistant](#ai-assistant)
5. [Technology Stack](#technology-stack)
6. [Architecture](#architecture)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Deployment](#deployment)
10. [Usage Guide](#usage-guide)
11. [Security](#security)
12. [Known Limitations](#known-limitations)
13. [Roadmap](#roadmap)
14. [Contributing](#contributing)
15. [License](#license)

---

## Overview

Most institutions require a minimum attendance percentage, yet students rarely have an accurate, up-to-date picture of where they stand. Attendance Tracker addresses this by providing:

- A per-subject and overall view of attendance against a configurable target.
- Forward-looking guidance: classes that can safely be skipped, or must be attended to reach the target.
- A local-first experience that is fast and works on any device, with automatic cloud synchronisation across devices.

The application is a static site with no build step. Authentication and storage are delegated to Supabase.

---

## Features

| Area | Description |
|---|---|
| Dashboard | Overall percentage, present / absent / total counts, today's classes, and an editable attendance target (default 75%). |
| Subjects | Create, edit and remove subjects, and assign each to the weekdays on which it is held (weekly timetable). |
| Calendar | Monthly view with colour-coded indicators for present, absent, partial and cancelled days, alongside holidays and Sundays. Selecting a date opens its attendance page. |
| Attendance marking | Per-subject **Present**, **Absent**, **Cancelled** and **Remove Marking** actions, plus a **Cancel all classes** shortcut for a day. |
| Reports | Per-subject percentages with progress indicators, and weekly and monthly trend charts. |
| Holidays | Bundled official holiday data for 2026 to 2030, custom holidays, and automatic handling of Sundays. |
| AI Assistant | Built-in conversational assistant that answers questions about the user's own attendance data. See [AI Assistant](#ai-assistant). |
| Themes | Blue, green, purple and dark themes. |
| Data export | Download attendance data as CSV, or a full JSON backup. |
| Notifications | Optional browser reminders to record attendance. |
| Cloud sync | One account, available on every device. |
| Progressive Web App | Installable on mobile and desktop. |

---

## Attendance Calculation

Each class is recorded with one of three statuses:

| Status | Counted in percentage |
|---|---|
| `present` | Yes (numerator and denominator) |
| `absent` | Yes (denominator only) |
| `cancelled` | No |

```
Attendance % = Present / (Present + Absent) x 100
```

Cancelled classes are stored so the calendar and history remain accurate, but they are excluded from every calculation, because the class did not take place.

**Classes that can still be missed** while remaining at or above target `T`, with `P` present and `N` total counted classes:

```
max_skippable = floor( (P x 100) / T - N )
```

**Consecutive classes required** to reach target `T` when currently below it:

```
required = ceil( (T x N - 100 x P) / (100 - T) )
```

---

## AI Assistant

The assistant is accessible from the chat button at the bottom right of every page. It runs entirely in the browser: no external API, no API key, and no attendance data is transmitted for processing.

**Capabilities**

- Tolerates spelling errors and informal phrasing (for example, "bunk" is understood as "skip").
- Recognises subject names, abbreviations and initials.
- Resolves relative dates such as *today*, *tomorrow* and weekday names.
- Retains conversational context, so follow-ups such as "what about physics?" work.
- Performs the calculations above, per subject and overall.

**Example queries**

| Query | Result |
|---|---|
| How am I doing? | Overall status, safe-to-skip count, subjects below target, unmarked classes |
| Can I skip a class? | Safe limit overall and per subject |
| Can I skip maths tomorrow? | Projected effect of missing that day's scheduled classes |
| How many classes do I need to reach 85%? | Consecutive classes required, with an estimated number of weeks |
| What if I miss 3 classes? | Projected percentage against target |
| Which subjects are at risk? | Subjects below target or with no remaining margin |
| What classes do I have tomorrow? | Scheduled subjects and their marking status |
| Any unmarked days? | Unrecorded classes from the last two weeks, with direct links |
| Upcoming holidays | Next holidays and days remaining |
| Am I improving? | Comparison of the last 7 days with the preceding 7 |
| Set my target to 80% | Updates the attendance target |

The assistant additionally reports streaks, best and worst day or subject, and cancelled-class history.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (no framework, no bundler) |
| Authentication and database | [Supabase](https://supabase.com/) (Auth and PostgreSQL with Row Level Security) |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Hosting | [Vercel](https://vercel.com/) (static) |
| Offline and installation | Service Worker and Web App Manifest |

---

## Architecture

```
 Browser (UI + logic)
   |
   |-- localStorage  <-- primary, immediate read/write
   |
   '-- auth.js (sync layer)
         |  on change of a synced key  -> debounce -> upsert
         |  on returning to the app    -> pull latest
         v
   Supabase
     |-- Auth        (username + password)
     '-- user_data   (one JSON row per user, protected by RLS)
```

**Synchronised keys:** `subjects`, `attendanceRecords`, `holidays`, `attendanceTarget`, `weeklySchedule`.

**Attendance record format**

```json
{ "date": "2026-10-05", "subjectId": "1791225003729", "status": "present" }
```

**Authentication.** Users sign in with a username and password. Internally, the username is mapped to the address `<username>@attendance.com` for Supabase Auth.

---

## Project Structure

```
my_attendence_record/
|-- index.html              Dashboard
|-- subjects.html           Subjects and weekly timetable
|-- calendar.html           Monthly calendar
|-- attendance.html         Mark attendance for a date
|-- report.html             Reports and charts
|-- holidays.html           Official and custom holidays
|-- login.html              Sign in
|-- signup.html             Account creation
|-- manifest.json           PWA manifest
|-- SUPABASE_SETUP.sql      Database schema and security policies
|-- icon-192.png
|-- icon-512.png
|-- css/
|   '-- style.css           Styles, themes and dark mode
'-- js/
    |-- app.js              Dashboard logic, target, shared data accessors
    |-- attendance.js       Marking, statistics, cancel-all
    |-- subjects.js         Subjects and weekly schedule
    |-- calendar.js         Calendar rendering
    |-- holidays.js         Holiday data (2026-2030) and management
    |-- report.js           Per-subject report cards
    |-- ai_assistant.js     Assistant engine, themes, export, notifications
    |-- auth.js             Authentication and cloud synchronisation
    |-- login.js            Sign-in form handling
    |-- supabase.js         Supabase client configuration
    '-- service_worker.js   Offline caching
```

---

## Getting Started

### Prerequisites

- A free [Supabase](https://supabase.com/) project
- Any static file server (Python, Node.js, or the VS Code Live Server extension)

### 1. Obtain the source

```bash
git clone <repository-url>
cd my_attendence_record
```

### 2. Configure Supabase

1. Create a Supabase project.
2. In **SQL Editor**, run the contents of [`SUPABASE_SETUP.sql`](./SUPABASE_SETUP.sql) once. This creates the `user_data` table and its Row Level Security policies.
3. In **Authentication > Providers > Email**, disable **Confirm email**. Usernames are mapped to placeholder addresses that cannot receive mail, so confirmation must be off.
4. In **Project Settings > API**, copy the project URL and the **anon public** key into `js/supabase.js`:

```js
const SUPABASE_URL = "https://<your-project>.supabase.co";
const SUPABASE_KEY = "<your-anon-public-key>";
```

### 3. Run locally

```bash
# Python
python -m http.server 5501

# Node.js
npx serve .
```

Open `http://localhost:5501/login.html`. If you use VS Code Live Server, port 5501 is already configured in `.vscode/settings.json`.

---

## Deployment

The application is a static site and deploys to Vercel without configuration.

1. Push the repository to GitHub.
2. Import it in Vercel.
3. Set **Framework Preset** to *Other*. Leave the build command empty and the output directory as the project root.
4. Deploy.

Any static host (Netlify, GitHub Pages, Cloudflare Pages) works equally well.

---

## Usage Guide

1. **Create an account** on the sign-up page.
2. **Add subjects** and select the weekdays each is held on.
3. **Review holidays.** Official holidays are preloaded; add custom ones as needed.
4. **Record attendance** from the calendar. Use *Cancelled* when a class does not take place.
5. **Monitor progress** on the dashboard and reports, or ask the assistant.
6. **Adjust preferences** (theme, export, notifications) from the settings button at the bottom left.

---

## Security

- Data access is restricted by PostgreSQL **Row Level Security**: each user may select, insert and update only their own `user_data` row.
- The Supabase **anon** key included in client code is designed to be public. Never place the `service_role` key in this project.
- The assistant processes data locally; no attendance information is sent to a third-party service.
- If a legacy `users` table with plain-text passwords exists from an earlier version, drop it once the current setup is verified (see the note in `SUPABASE_SETUP.sql`).

---

## Known Limitations

- **No password recovery.** Because accounts use placeholder email addresses, there is no reset-by-email flow.
- **Service worker registration.** `app.js` registers `/service_worker.js`, whereas the file resides at `/js/service_worker.js`. Offline mode and installation may be affected until the path is corrected.
- **Incomplete offline cache.** The service worker cache list does not include `ai_assistant.js` or `supabase.js`.
- **Concurrent edits.** Synchronisation is last-write-wins; simultaneous edits on two devices may overwrite one another.
- **Holiday coverage.** Official holidays are bundled for 2026 to 2030; other years fall back to fixed national holidays.

---

## Roadmap

- Correct the service worker path and cache manifest for full offline support
- Email-based accounts and password recovery
- Per-subject attendance targets
- Class timings with per-class reminders
- Import from JSON backup
- Optional LLM-backed assistant via a serverless function

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch.
2. Make your changes. There is no build step, so edit files directly and refresh the browser.
3. Verify the affected pages manually, including dark mode and a mobile viewport.
4. Open a pull request describing the change and its motivation.

---

## License

No license has been specified. Add a `LICENSE` file (for example, MIT) before distributing or accepting external contributions.
