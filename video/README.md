# Invitation video (experiment – not for merging)

A portrait MP4 recording of the wedding site, made to share on WhatsApp so guests can watch it offline once it's downloaded.

Everything here lives on the branch `ccr-5b7f59c8-94hucw`. **Don't merge this folder into `main`.** The live site (`index.html` at the repo root) is deployed from `main`.

## Files

| File | What it is |
|---|---|
| `wedding-invite.mp4` | The finished video, ready to share |
| `indexVideo.html` | Video-only copy of the site, with the changes listed below |
| `record.js` | Playwright script that records `indexVideo.html` frame by frame |
| `.gitignore` | Ignores `fr/`, the temporary frame folder |

## Requirements (agreed so far)

- **Start on the "You're invited" screen**, so WhatsApp uses it as the thumbnail. The first 2 s of the fade-in are cut.
- **No countdown.** It would show stale numbers once the video is shared.
- **RSVP shows the phone numbers** (larger, darker text) and **hides the Call/WhatsApp buttons**, since nothing can be tapped in a video.
  - The live site does the opposite: it shows the buttons and hides the numbers (`showPhones: false` in `index.html`).
- **No "Replay invitation" button.**
- **Format:** portrait 720×1558, H.264 MP4, 30 fps, about 31 s and 3.4 MB. There's no audio, because the site has no music.
- **Storyboard (times are in the final video):**
  1. 0–1.8 s: "You're invited" with the closed arch doors and the "Open the invitation" button.
  2. 1.8 s: the invitation opens, with petals, names, the couple picture, the date and the venue.
  3. 5.6 s onward: a slow scroll through the invitation text, Baraat, directions and RSVP. Each scroll takes 2.2 s and is followed by a 2.8 s pause.
  4. End: a 2 s scroll to the footer ("With love and duas · Tabeer & Nouman"), held for 3.5 s.

## `indexVideo.html`: keep it in sync with the site

`indexVideo.html` is a copy of the root `index.html`. **When the main site changes (text, dates, contacts, styles), copy the same change into `indexVideo.html`**, then re-render the video.

The differences from `index.html` are:

1. **Asset paths** point one folder up: `../assets/couple.webp` and `../assets/couple.png` (three places: the preload link, `<source>` and `<img>`).
2. **A "Video variant overrides" CSS block** at the end of `<style>`:
   - hides `.countdown` and `#replay` with `display:none !important`
   - makes `.contact .c-phone` 18px and `var(--ink)` coloured
3. **`INVITE` config:** `showPhones: true` and `showActions: false`.
4. **`renderRsvp`:** after the name and number are added, `if (INVITE.showActions === false)` marks the card `solo` and skips building the buttons.

To resync from scratch: copy `index.html` to `video/indexVideo.html` and redo the four changes above. Hide sections with CSS rather than deleting them. The page's JavaScript looks up elements like `#replay` and the countdown by id, and the whole script stops working if they're missing.

## Re-render the video

### Prerequisites (laptop)
- Node 18+ and `npm i playwright` (or install it globally), then `npx playwright install chromium`
- `ffmpeg` (`brew install ffmpeg` on a Mac, `winget install ffmpeg` on Windows)
- Internet access, because the page loads its fonts from Google Fonts

### Steps
Run these from the repo root:

```sh
python3 -m http.server 8765 &            # serve the repo; the page needs ../assets
cd video && mkdir -p fr && node record.js # about 2–3 min, writes ~994 PNG frames to fr/
ffmpeg -y -start_number 60 -framerate 30 -i fr/%05d.png \
  -vf "scale=720:-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 19 -profile:v high -movflags +faststart wedding-invite.mp4
rm -rf fr
```

- `-start_number 60` drops the first 60 frames (2 s), so the video opens on "You're invited".
- `crf 19` keeps text sharp at about 3.4 MB. A higher number gives a smaller file with softer text.
- `+faststart` lets WhatsApp and phones start playback straight away.
- `format=yuv420p` is required, or many phones won't play the file.
- To record another page, set `URL=http://localhost:8765/... node record.js`.

### Check before sharing
Pull a few frames and look at them:
```sh
for t in 0 5 20 30; do ffmpeg -y -loglevel error -ss $t -i wedding-invite.mp4 -frames:v 1 check$t.png; done
```
Check that:
- the first frame is "You're invited"
- the text isn't cut off at the sides
- RSVP shows the numbers and no buttons
- there's no countdown or replay button

## How `record.js` works

It drives a 390×844 phone-sized page at 2× pixel density, and it **controls time itself** instead of recording in real time:

1. It warms the font cache by loading the page once.
2. `page.clock.install()` runs before navigation, so the page's `setTimeout`, `Date`, `requestAnimationFrame` and `performance.now` use a fake clock.
3. After the page and fonts load, `page.clock.pauseAt(now + 20ms)` freezes that clock.
4. For every frame:
   - it runs any planned action (a click or a scroll)
   - it sets the scroll position along an ease-in-out curve
   - it pauses every CSS and Web Animations animation and sets its `currentTime` to the virtual time since it started (`window.__sync`)
   - it takes a PNG screenshot
   - it advances the clock by 1/30 s with `page.clock.runFor`
5. The plan is a simple timeline: click "Open" at 3.8 s, then scroll to `#invitation`, `.event`, `#directions`, `#rsvp` and the end of the page.
   - To change the pacing or add sections, edit the `plan` and the selector list.
   - If you change the 3.8 s click time, the timings in the storyboard above move too.

## What I learned (pitfalls to avoid)

- **Don't use Playwright's `recordVideo` or the CDP `Page.startScreencast`.** Both capture at 1× (390 px wide) even with `deviceScaleFactor: 2`. `recordVideo` at size 780×1688 just puts the 1× image on a grey canvas, and its built-in encoding is low quality. Screenshots taken frame by frame are the only way to get sharp 2× frames.
- **Don't use `page.click('#openBtn')`.** The button is animating, so Playwright waits for it to be "stable" and then scrolls it into view. That scrolled the page **sideways**: the body has `overflow-x: hidden`, but code can still scroll it. Every later frame was shifted left. Use `page.evaluate(() => document.getElementById('openBtn').click())` instead.
- **The fake clock keeps running until you pause it.** `page.clock.install()` alone still moves in real time. Network waits and screenshot time then advanced the page's clock, and the invitation opened itself early: the site auto-opens 5 s after load. Always call `pauseAt` after load.
- **CSS animations don't follow the fake clock.** That's why `__sync` pauses each animation and sets its time by hand. Without it, animations play at real speed while frames are captured slowly.
- **The site auto-opens after 5 s** (`startAuto`). The scripted click at 3.8 s runs before that.
- **The countdown is based on the time of recording**, so it goes stale quickly. That's why it's hidden in the video.
- **Thumbnail:** WhatsApp uses the first frame. The first 2 s are mostly a fade-in from a blank background, which is why they're cut.
- **WhatsApp size:** about 3–4 MB is well within its limits. WhatsApp re-compresses videos anyway, so a bigger file doesn't buy quality.

## Ideas not done yet
- An Urdu version: set the `ur` language before recording, by clicking the `button[data-lang="ur"]` toggle at the start of `record.js`.
- Personalised copies: the site supports `?guest=Name` for the greeting (try `URL=.../indexVideo.html?guest=Ali node record.js`).
- Background music: mix it in with ffmpeg (`-i music.mp3 -shortest -c:a aac`).
