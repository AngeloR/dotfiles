# Worked profile: a scheduled workflow in an iframe-hosted enterprise embed, recorded live

Distilled from a real one-take recording (5:13, cut 3:46) of a React embed hosted inside a partner portal inside an ERP, driven end to end through the real UI on a sandbox account. Use it as the pattern for an authenticated, iframe-hosted, real-environment demo.

## Authentication off camera

The ERP required a one-time code. A separate login driver waited for the code in a file, then logged in end to end and saved `storage-state.json`; the recording context loaded that state and never showed a login. The 2FA page expired if left open, so the login only started once the code had arrived. Sessions lasted about 50 minutes: probe and record inside one session, and have the driver write a sentinel file and stop cleanly if it lands on the login page mid-take.

## Frames and navigation in a hosted embed

The embed frame was found with `page.frames().find(f => /launcher/i.test(f.name()) || /portal-host/i.test(f.url()))` and every locator ran against it; captions went to the top document. The portal's own menu item was clicked for the first entry, because that is what a user does. Re-clicking that item while already on the route did not navigate the embed back, so the driver used the host's documented navigation contract (a global the host sets plus a `handleNavigation()` call, routing through another page because the container only reacts to a change) for that one hop, and disclosed it in the README.

## The one substitution

One operation on the portal's authentication endpoint was owned by another team and not deployed yet. The driver routed exactly that URL pattern and fulfilled it with a credential minted moments earlier by a real OAuth authorization-code + PKCE grant in a second headless Chromium, launched with `--host-resolver-rules=MAP <redirect-host> 127.0.0.1` so the authorization code could be read from the 302 `Location` header without ever being delivered. The hit counter confirmed it fired once. A caption titled "the ONE substitution in this recording" and the README's real-vs-substituted table named it. Everything downstream (mutation, encrypted store, scheduler, dispatcher, workflow, review card, approval, write, audit trail) was the deployed stack.

## Letting the product wait on camera

The schedule was created two minutes ahead in the pinned browser zone. The camera stayed on the board with a countdown caption refreshed every 5 s while the driver watched for `[data-testid^="working-"]` / `[data-testid^="review-"]` tiles to appear through the app's own 20 s reconciliation pull. No reload. The app's GraphQL API (endpoint and auth header captured from its own traffic with `page.on('request')`) was used only to poll state for the log and to copy the audit trail into the README, never to drive the UI.

## What the README carried

Timeline table with UTC timestamps per beat; the ids created (schedule, run, batch); a per-beat real vs substituted column; the two products of the cut (full take, and the 4× idle range with its exact timestamps); known limitations of the feature as built and their follow-up tickets; what could not be shown and why (the record form hid the field that was written, so the audit row was the evidence); UI defects noticed while recording, filed as tickets.
