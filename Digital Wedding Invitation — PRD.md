# Digital Wedding Invitation — PRD

Nov 12, 2026 · @T

## Overview & goals

A mobile-first, link-shared wedding invitation: tap a wax seal, the envelope opens, and the card reveals event details, RSVP and directions. It is built as a reusable template driven by one config file, so a new invite takes minutes, not a rebuild.

Reference: the Zulfiqar & Afshan invite on GitHub Pages. We keep its look (SVG florals, paper texture, envelope reveal) and fix its gaps: a 6 MB payload, no RSVP form, no countdown or calendar add.

Goals:

- First paint under 1.5 s on 4G; total page under 1 MB.
- Guests RSVP in under 30 seconds, with no login.
- A rich WhatsApp preview card on every share.
- A new invite needs only a config edit and a deploy.

## Users & core flow

| User | Need |
| --- | --- |
| Guest (mostly phone, often 50+) | Read the details, RSVP, get directions, add to calendar |
| Host (the couple / family) | Share one common link, or optional personal links per guest, see who's coming |
| Builder (you) | Spin up a new invite from config, deploy in one step |

Guest flow:

1. Guest taps the WhatsApp link and sees a preview card. By default it's one shared link with no guest name, in English. Optional params can set both, e.g. `/?guest=Ahmed+Family&lang=ur`.
2. The envelope shows with a breathing wax seal. A greeting such as "Dear Ahmed Family" appears only when the link has the optional `?guest=` param.
3. Tap, or a 3 s auto-open: the seal fades, the flap flips, and the card rises out.
4. Music starts (the tap unlocks audio), and a mute toggle floats in a corner.
5. The guest scrolls: hero, countdown, event cards, map, RSVP.
6. They submit the RSVP and see a confirmation, plus "Add to calendar". The name field starts empty, and is prefilled only when `?guest=` is set.

## Features

| Feature | Detail | Phase |
| --- | --- | --- |
| Envelope reveal | CSS 3D flap flip, a wax seal with the couple's initials, auto-open fallback | MVP |
| Personal greeting | `?guest=` param, off by default. When set, it shows on the envelope and prefills the RSVP name; when absent, there is no greeting and the name field is empty | MVP |
| Hero card | Bismillah (optional), names in script, date block, venue | MVP |
| Multiple events | Mehndi, Nikah, Walima cards, each with time, venue and dress code | MVP |
| Countdown | Days, hours and minutes to the main event | MVP |
| RSVP form | Name, attending yes/no, guest count, side (bride/groom), note | MVP |
| Add to calendar | `.ics` download plus a Google Calendar link per event | MVP |
| Map | Static map image plus "Open in Google Maps" (no heavy iframe) | MVP |
| OG / share card | 1200×630 image, title and date for WhatsApp | MVP |
| Theme palettes | 4 presets via CSS variables, swapped in config | MVP |
| Background music | Lazy-loaded, compressed (\~1 MB), starts on open, mute toggle | v1.1 |
| Language toggle | English / Urdu / Arabic with RTL layout. Defaults to English; an optional `?lang=ur` or `?lang=ar` in the link opens in that language. The toggle stays available either way | MVP |
| Host dashboard | Password-gated RSVP list, headcount by event, CSV export | v1.1 |
| Gallery / our story | Photo carousel, short timeline | Later |
| Gift / digital envelope | Bank details or a payment link, behind a tap | Later |
| Guest-list sender | Generate per-guest links from a CSV | Later |

Out of scope: guest accounts, payments, and a drag-and-drop editor.

## Non-functional & stack

| Area | Requirement |
| --- | --- |
| Performance | Under 1 MB total; Latin-only font subsets; WebP images; music lazy-loaded after open |
| Mobile | Designed at 375 px first; tap targets of 44 px or more; safe-area insets |
| Accessibility | `prefers-reduced-motion` skips the animation; a "Skip to invitation" link; AA contrast |
| Compatibility | iOS Safari 15+, Android Chrome, the WhatsApp in-app browser |
| Privacy | RSVP data visible only to the host; `noindex` meta; no analytics cookies |
| SEO / share | Static OG tags per invite; the preview is checked in WhatsApp before sending |

Stack:

- Next.js (static export) + TypeScript + Tailwind.
- Framer Motion for the reveal; SVG `<defs>` and `<use>` for the florals, as in the reference.
- RSVP through a Supabase table (insert-only RLS for guests) or a Google Apps Script → Sheet.
- Hosted on Vercel or GitHub Pages; CI with GitHub Actions (lint, build, Lighthouse budget check).

## Config, metrics, risks & milestones

One `invite.config.ts` per invite drives everything:

```
{ couple: { a, b, initials }, palette, bismillah: true,
  events: [{ name, date, time, venue, address, mapsUrl, dressCode }],
  rsvp: { deadline, contacts: [{ name, phone }] },
  music?: { src, title }, ogImage, locales: ['en','ur'] }
```

RSVP record: `id, invite_id, guest_name, attending, count, side, events[], note, created_at`.

Success metrics: an RSVP rate of 70% or more of opened links; a Lighthouse mobile score of 90+; under 5% of guests calling to ask for details.

| Risk | Mitigation |
| --- | --- |
| Audio autoplay blocked | Start only on the envelope tap; show a mute/play toggle |
| The WhatsApp browser caches an old OG image | Version the image URL (`share.jpg?v=2`) |
| RSVP spam | A honeypot field + rate limit; keep the dashboard behind a password |
| Urdu/Arabic fonts heavy | Subset to used glyphs; load only when that locale is active |

Milestones:

1. Envelope reveal + hero card + config wiring.
2. Events, countdown, map, `.ics`, OG card, language toggle with RTL.
3. RSVP form + backend + confirmation.
4. Music, host dashboard (v1.1).
