import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import htmlConfig from 'vite-plugin-html-config';
import pkg from './package.json';

const CARD_IMAGE_PATH = '/assets/card-image.png';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const DOMAIN = mode === 'production' ? pkg.homepage : 'http://localhost:3000';
  const getURL = (path = '') => new URL(path, DOMAIN).toString();
  const cacheBreak = Date.now();

  const htmlPluginOpt = {
    headScripts: mode === 'production' ? [
      {
        async: true,
        src: 'https://www.googletagmanager.com/gtag/js?id=G-EN3MB859BW',
      },
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-EN3MB859BW');
      `,
    ] : [],

    metas: [
      {
        name: 'og:url',
        content: getURL(),
      },
      {
        name: 'og:type',
        content: 'website',
      },
      {
        name: 'og:title',
        content: pkg.displayName,
      },
      {
        name: 'og:description',
        content: pkg.description,
      },
      {
        name: 'og:image',
        content: `${getURL(CARD_IMAGE_PATH)}?${cacheBreak}`,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:domain',
        content: new URL(DOMAIN).hostname,
      },
      {
        name: 'twitter:url',
        content: getURL(),
      },
      {
        name: 'twitter:title',
        content: pkg.displayName,
      },
      {
        name: 'twitter:description',
        content: pkg.description,
      },
      {
        name: 'twitter:image',
        content: `${getURL(CARD_IMAGE_PATH)}?${cacheBreak}`,
      },
      {
        name: 'twitter:creator',
        content: '@Skakruk',
      },
      {
        name: 'robots',
        content:
          mode === 'production'
            ? 'index, follow'
            : 'noindex, nofollow',
      },
    ],
  };

  return {
    build: {
      emptyOutDir: true,
    },
    plugins: [htmlConfig(htmlPluginOpt), react()]
  }
});
