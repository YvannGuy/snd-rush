'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Vérifier le consentement des cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent === 'accepted') {
      setShouldLoad(true);
    } else {
      // Écouter les changements de consentement
      const handleStorageChange = () => {
        const updatedConsent = localStorage.getItem('cookieConsent');
        if (updatedConsent === 'accepted') {
          setShouldLoad(true);
        }
      };

      // Écouter les événements de stockage (pour les changements dans d'autres onglets)
      window.addEventListener('storage', handleStorageChange);

      // Écouter les événements personnalisés (pour les changements dans le même onglet)
      window.addEventListener('cookieConsentChanged', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('cookieConsentChanged', handleStorageChange);
      };
    }
  }, [mounted]);

  if (!mounted || !shouldLoad) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-PGDMSHYT2H"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-PGDMSHYT2H');
        `}
      </Script>
      {/* Google Ads Conversion Tracking */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17395859907"
        strategy="afterInteractive"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17395859907');
        `}
      </Script>
      {/* LinkedIn Insight Tag */}
      <Script id="linkedin-insight" strategy="afterInteractive">
        {`
          _linkedin_partner_id = "8409106";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        `}
      </Script>
      <Script id="linkedin-insight-loader" strategy="afterInteractive">
        {`
          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `}
      </Script>
      <noscript>
        <img height="1" width="1" style={{display:'none'}} alt="" src="https://px.ads.linkedin.com/collect/?pid=8409106&fmt=gif" />
      </noscript>
    </>
  );
}

