import { NuxtConfig } from '@nuxt/types';
import { env } from './env';

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
    title: 'DELTA - Úložiště maturitních projektů',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
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
    SERVICE_ACCOUNT: process.env.SERVICE_ACCOUNT!,
    STORAGE_SERVICE_ACCOUNT: process.env.STORAGE_SERVICE_ACCOUNT!,
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
  buildModules: ['@nuxt/typescript-build', '@nuxtjs/tailwindcss', 'nuxt-composition-api', 'pinia/nuxt', '@/modules/firebase'],
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
    baseURL: process.env.BROWSER_BASE_URL,
  },
  /*
   ** Build configuration
   ** See https://nuxtjs.org/api/configuration-build/
   */
  build: {},
};

export default config;
