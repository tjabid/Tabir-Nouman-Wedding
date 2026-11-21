# Invitation video (experiment – not for merging)

A portrait MP4 recording of the site, made to share on WhatsApp so guests can watch it offline.

## Requirements
- Start on the "You're invited" screen so WhatsApp uses it as the thumbnail (the first 2 s of the intro are cut).
- Hide the countdown section (it would show stale numbers once the video is shared).
- RSVP shows the phone numbers (larger, darker text) and hides the Call/WhatsApp buttons, since nothing can be tapped in a video.
- No "Replay invitation" button.
- Portrait 720×1558, H.264 MP4, about 31 s and 3.5 MB.
- Storyboard: "You're invited" → open the invitation (petals, names, couple, date) → slow scroll through the invitation, Baraat, directions and RSVP → closing line.

## The video page: `indexVideo.html`
`video/indexVideo.html` is a copy of the site's `index.html` with the video changes above. When the main site changes, copy the change over too. The differences from `index.html` are:
- asset paths point to `../assets/`
- a "Video variant overrides" CSS block at the end of `<style>` hides `.countdown` and `#replay` and enlarges `.c-phone`
- `showPhones: true` and `showActions: false` in the `INVITE` config, plus the `showActions` check in `renderRsvp`

## Re-render
From the repo root:

```sh
python3 -m http.server 8765 &
cd video && mkdir -p fr && node record.js     # needs Playwright + Chromium
ffmpeg -y -start_number 60 -framerate 30 -i fr/%05d.png \
  -vf "scale=720:-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 19 -movflags +faststart wedding-invite.mp4
rm -rf fr
```

`record.js` freezes the page clock and captures one 2× screenshot per 1/30 s, so animations are smooth and sharp.
`-start_number 60` drops the first 2 s.
