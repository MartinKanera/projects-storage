import { NuxtConfig } from '@nuxt/types';
import { env } from './env';

const title = 'Úložiště maturitních projektů';
const description = 'Úložiště maturitních projektů střední školy DELTA';

const config: NuxtConfig = {
  /*
   ** Nuxt target
   ** See https://nuxtjs.org/api/configuration-target
   */
  target: 'server',
  server: {
    port: process.env.PORT || 80,
  },
  /*
   ** Headers of the page
   ** See https://nuxtjs.org/api/configuration-head
   */
  head: {
    htmlAttrs: {
      lang: 'cs',
    },
    title,
    meta: [
      { charset: 'utf-8' },
      { name: 'theme-color', content: '#202020' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: description },
      // { name: 'keywords', content: 'úložiště maturitních projektů, střední škola delta' },
      { hid: 'og:site_name', name: 'og:site_name', content: title },
      { hid: 'og:title', property: 'og:title', content: title },
      { hid: 'og:description', property: 'og:description', content: description },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  serverMiddleware: ['~/server/middleware/index.ts', { path: '/api', handler: '~/server/api/index.ts' }],

  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   ** https://nuxtjs.org/guide/plugins
   */
  plugins: ['@/plugins/firebase.ts'],
  env: {
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG!,
    TENANT: process.env.TENANT!,
  },
  firebase: {
    config: env.firebaseConfig,
  },
  /*
   ** Auto import components
   ** See https://nuxtjs.org/api/configuration-components
   */
  components: [{ path: '@/components', prefix: 'ps' }],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: ['@nuxt/typescript-build', '@nuxtjs/tailwindcss', 'pinia/nuxt', '@/modules/firebase', '@nuxtjs/composition-api', '@nuxtjs/google-analytics'],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
  ],
  pwa: {
    workbox: {
      importScripts: ['/firebase.sw.js'],
      dev: process.env.NODE_ENV === 'development',
    },
  },
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {
    baseURL: process.env.NODE_ENV === 'production' ? process.env.BROWSER_BASE_URL : '',
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  publicRuntimeConfig: {
    googleAnalytics: {
      id: env.firebaseConfig.measurementId,
    },
  },
  build: {},
};

export default config;
