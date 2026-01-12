'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
  keywords?: string[];
}

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://www.sndrush.com/og-image.jpg',
  structuredData,
  keywords = [],
}: SEOHeadProps) {
  const baseUrl = 'https://www.sndrush.com';
  const fullTitle = `${title} | SoundRush Paris - Location Sono Express`;

  useEffect(() => {
    // Mettre à jour le title
    document.title = fullTitle;

    // Mettre à jour ou créer la meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Mettre à jour ou créer les keywords
    if (keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords.join(', '));
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', keywords.join(', '));
        document.head.appendChild(metaKeywords);
      }
    }

    // Mettre à jour ou créer le canonical
    const canonical = canonicalUrl || window.location.href;
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) {
      linkCanonical.setAttribute('href', canonical);
    } else {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      linkCanonical.setAttribute('href', canonical);
      document.head.appendChild(linkCanonical);
    }

    // Mettre à jour ou créer les Open Graph tags
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    updateOrCreateMeta('og:title', fullTitle);
    updateOrCreateMeta('og:description', description);
    updateOrCreateMeta('og:image', ogImage);
    updateOrCreateMeta('og:url', canonical);
    updateOrCreateMeta('og:type', 'website');
    updateOrCreateMeta('og:site_name', 'SoundRush Paris');

    // Mettre à jour ou créer les Twitter Card tags
    const updateOrCreateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    updateOrCreateTwitterMeta('twitter:card', 'summary_large_image');
    updateOrCreateTwitterMeta('twitter:title', fullTitle);
    updateOrCreateTwitterMeta('twitter:description', description);
    updateOrCreateTwitterMeta('twitter:image', ogImage);
  }, [title, description, canonicalUrl, ogImage, keywords, fullTitle]);

  return (
    <>
      {structuredData && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </>
  );
}

