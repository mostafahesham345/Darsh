# brand/

Marketing assets that are NOT served by the website.

`public/` is the only directory Express serves, so nothing here is reachable over
HTTP — these are files you upload somewhere else by hand.

- `google-business-cover.png` — 1024×576 cover photo for the Google Business
  Profile. Built from the real client screenshots in `public/images/work-*.webp`
  (Yafa, Infinite Comfort, Yasin Studios), so it stays honest: every site shown
  is one we actually shipped. Regenerate it if those screenshots are recaptured.
