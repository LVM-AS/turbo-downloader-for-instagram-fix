# Turbo Downloader for Instagram - Profile Fix

AI-Assisted Unpacked Edge / Brave / Chrome extension fork of the "Turbo Downloader for Instagram" extension with a more resilient
Instagram profile-post downloader. It addresses profile fetches that receive
Instagram HTML pages or rate-limit errors where account or post data was expected 
and implements multiple fallback measures to ensure continued functionality.

## What changed in this fork

- The downloader now also retrieves the cover images for any reels in the profile, and will fetch them when missing in previously downloaded accounts. 
*(BETA. It might have issues, or download too many cover images for a given reel, I don't know yet, I haven't checked properly.)*

- Tries the alternate profile feed and GraphQL timeline paths when a feed
  returns HTML or an unexpected response.
- Learns current Instagram request headers and profile-post GraphQL query IDs
  from Instagram requests made in an open tab, with fallback query IDs.
- Can use post timeline data already embedded in the profile page when the
  profile APIs do not provide usable data.
- Disables the bundled Google Analytics and Sentry reporting.
- Removes the page-HTML attachment path so the current Instagram document is
  not collected for error reports.
- Removes the original extension key and Chrome Web Store update URL. This
  fork has its own extension identity and does not update the original listing.

Instagram changes its private web APIs without notice, so this workaround may
need future updates and cannot guarantee access to every account or post.

## Install in Chrome or a Chromium-based browser

1. Git clone this repository or download it as a ZIP and extract it.
2. Open `chrome://extensions` or `brave://extensions/` or `edge://extensions/`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the extracted repository folder
   containing `manifest.json`.
5. Open or reload Instagram, then reload the profile tab before trying a
   profile download.

Because this fork has a different extension identity, it is separate from an
installation of the original extension. It is not an update to the original
Chrome Web Store listing. 

The original extension should not be installed at the same time as this fork.


## Privacy notes

- The extension no longer sends analytics or error reports to Google Analytics
  or Sentry in this fork.
- The profile-request helper observes selected Instagram XHR request headers
  and GraphQL request bodies to discover the current app/header values and
  query IDs. It stores only those selected header values and the reusable
  GraphQL variable template in this browser's extension storage; it does not
  store cookies or the full request body.
- Captured request details remain local to the browser profile. The extension
  uses Instagram endpoints and Instagram media CDNs directly to fetch profile
  and media data; those services will receive the user's normal requests.
- No extension developer-controlled server is used by the profile fix.

## Repository contents

This repository contains the runnable unpacked extension package. The
JavaScript files are the bundled extension scripts; no package manager or
build command is required. Third-party license notices bundled with the
scripts are retained.

No license file is included. Add the license you choose before inviting others
to reuse or redistribute the code.

This is an independent community fork and is not affiliated with or endorsed
by Instagram or Meta.
