/*!
 * @rafaelcostapalma/consent — Google Consent Mode (v2) integration.
 *
 * GTM containers usually bundle multiple tags (GA4, Google Ads, Meta Pixel
 * fired via a custom tag, etc.) that can't be told apart from outside the
 * container. Blocking the GTM loader script itself would block all of them
 * together, so instead this pushes Consent Mode signals to the dataLayer —
 * GTM/GA read those signals per-tag if the tags are configured in the GTM
 * UI to require the matching consent type.
 *
 * IMPORTANT — two things this integration does NOT do, that the host app must:
 *  1. Before the GTM snippet loads, push a "default" consent (denied for
 *     everything but necessary) so tags don't fire prior to any decision.
 *     See googleConsentModeBootstrap() in this same file.
 *  2. Inside the GTM container (Tag Manager UI, not code), each tag needs
 *     its "Consent Settings" set to require the matching signal below —
 *     otherwise Consent Mode has nothing to enforce.
 */

export function googleConsentMode(mapping = {}) {
  const map = Object.assign({
    analytics: ['analytics_storage'],
    marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    functional: ['functionality_storage', 'personalization_storage']
  }, mapping);

  function push(consent) {
    if (typeof window.gtag !== 'function') return;
    const update = {};
    Object.keys(map).forEach((categoryId) => {
      const granted = !!consent[categoryId];
      map[categoryId].forEach((signal) => {
        update[signal] = granted ? 'granted' : 'denied';
      });
    });
    window.gtag('consent', 'update', update);
  }

  return {
    onChange: (consent) => push(consent)
  };
}

/**
 * Returns the source of a tiny bootstrap script that must run inline,
 * before the GTM/gtag loader, so consent defaults exist before any tag
 * can fire. Inject it yourself (e.g. via `dangerouslySetInnerHTML` in a
 * Next.js `<Script>`/`<head>`) — it can't be a normal `import`, since it
 * has to execute synchronously ahead of everything else in `<head>`.
 */
export function googleConsentModeBootstrap({ storageKey = 'mkconsent', version = 1 } = {}) {
  return `(function(){
    window.dataLayer=window.dataLayer||[];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag=gtag;
    var granted={analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
    try{
      var stored=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}));
      if(stored&&stored.v===${JSON.stringify(version)}&&stored.categories){
        if(stored.categories.analytics)granted.analytics_storage='granted';
        if(stored.categories.marketing){granted.ad_storage='granted';granted.ad_user_data='granted';granted.ad_personalization='granted';}
      }
    }catch(e){}
    gtag('consent','default',Object.assign({functionality_storage:'granted',security_storage:'granted'},granted));
  })();`;
}
