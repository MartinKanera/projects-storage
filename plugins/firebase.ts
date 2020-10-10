import { Plugin, Context } from '@nuxt/types';
import { onGlobalSetup } from 'nuxt-composition-api';

import firebase from 'firebase/app';
import 'firebase/auth';

import { env } from '@/env';
import { useMainStore } from '@/store';

const plugin: Plugin = (context: Context) => {
  onGlobalSetup(() => {
    if (!process.server && !firebase.apps.length) firebase.initializeApp(env.firebaseConfig);
    const mainStore = useMainStore();

    if (process.server) {
      // @ts-ignore
      const userData = context.res?.locals?.user;

      if (userData) {
        mainStore.patch({ loggedIn: true });
        mainStore.patch(userData);
      }
    }
  });
};

export default plugin;
