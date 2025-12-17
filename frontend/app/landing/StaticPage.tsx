'use client';

import { useEffect, useRef } from 'react';

interface StaticPageProps {
  htmlPath: string;
  cssPath: string;
  jsPath: string;
}

export default function StaticPage({ htmlPath, cssPath, jsPath }: StaticPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        fetch(htmlPath)
          .then(res => res.text())
          .then(html => {
            const modifiedHTML = html
              .replace(/href="about\.html"/g, 'href="/landing/about"')
              .replace(/href="\.\.\/index\/index\.html"/g, 'href="/landing"')
              .replace(/href="index\.html"/g, 'href="/landing"')
              .replace(/href="\.\.\/about\/about\.html"/g, 'href="/landing/about"')
              .replace(/href="\.\.\/contacts\/contacts\.html"/g, 'href="/landing/contacts"')
              .replace(/href="\.\.\/privacy\/privacy\.html"/g, 'href="/landing/privacy"')
              .replace(/href="about\.css"/g, `href="${cssPath}"`)
              .replace(/href="contacts\.css"/g, `href="${cssPath}"`)
              .replace(/href="privacy\.css"/g, `href="${cssPath}"`)
              .replace(/src="about\.js"/g, `src="${jsPath}"`)
              .replace(/src="contacts\.js"/g, `src="${jsPath}"`)
              .replace(/src="privacy\.js"/g, `src="${jsPath}"`)
              .replace(/window\.location\.href = 'main\.html#login'/g, "window.parent.location.href = '/login'")
              .replace(/window\.location\.href = 'main\.html#register'/g, "window.parent.location.href = '/register'");

            iframeDoc.open();
            iframeDoc.write(modifiedHTML);
            iframeDoc.close();
          });
      }
    }
  }, [htmlPath, cssPath, jsPath]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      title="Static Page"
    />
  );
}
