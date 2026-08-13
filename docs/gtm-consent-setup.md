# Making GTM tags respect Consent Mode

This library sends the right signals to `dataLayer` (`consent default` before
GTM loads, `consent update` when the visitor decides) — but that's only half
of it. **Each tag inside the GTM container has to be told to check those
signals.** Without this step, GA4/Ads/Meta Pixel tags fire regardless of what
the visitor chose; the banner just becomes cosmetic.

Do this once per GTM container (e.g. `GTM-MKC6933W`), for every tag that
collects data.

## 1. Confirm the signals are actually arriving

Before touching tag settings, confirm the bootstrap is working:

1. Open the site, open DevTools → Console.
2. Run `dataLayer.filter(e => e[0] === 'consent')`.
3. You should see one `default` entry (pushed before GTM loaded) and one
   `update` entry per decision the visitor makes (accept/reject/customize).

If nothing shows up, the bootstrap script isn't running before the GTM
loader — check that `googleConsentModeBootstrap()`'s output is inlined as
the very first thing in `<head>`, ahead of the GTM snippet.

## 2. Built-in Google tags (GA4 Configuration, Google Ads)

These already understand Consent Mode natively — GTM shows a
**"This tag fires based on Consent Mode"** hint automatically. You still need
to confirm it's checking the right signal:

1. Tag Manager → your container → open the GA4 Configuration tag (or Ads tag).
2. **Advanced Settings → Consent Settings.**
3. Under **Additional Consent Checks**, make sure `analytics_storage` is
   listed for GA4, or `ad_storage` (and `ad_user_data`/`ad_personalization`
   for the newer requirement) for Ads.
4. Save.

## 3. Custom HTML tags (Meta Pixel, chat widgets, anything pasted as a script)

GTM has no idea what a Custom HTML tag does, so **nothing is checked by
default** — this is the tag type most likely to be leaking data today if
your Meta Pixel is set up this way.

1. Open the Custom HTML tag.
2. **Advanced Settings → Consent Settings → toggle "Require additional
   consent for tag to fire."**
3. Add `ad_storage` (and `ad_user_data`, `ad_personalization` if you want the
   stricter check) for Meta Pixel / ad tags.
4. Save.

## 4. Test before publishing

1. Tag Manager → **Preview** → open the site in the preview session.
2. In the banner, click **"Rejeitar não essenciais."** Confirm the GA4/Ads/
   Pixel tags show as **"Tag did not fire"** with a consent reason in the
   GTM debug panel.
3. Reload, click **"Aceitar todos."** Confirm the same tags now fire.
4. Only after this passes: **Submit → Publish** the container version.

Until you publish, none of this applies in production — the banner keeps
sending the right signals, but the currently-live container version doesn't
check them yet.
