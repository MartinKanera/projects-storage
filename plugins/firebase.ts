import { Plugin, Context } from '@nuxt/types';
import { onGlobalSetup } from '@nuxtjs/composition-api';

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
      const userData = context.res?.locals;

      if (userData && userData.user) {
        userData.user.loggedIn = true;

        mainStore.patch(userData);
      } else {
        mainStore.reset();
      }
    }

    if (process.client) {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) mainStore.state.user.idToken = await user?.getIdToken();
        else {
          mainStore.reset();
        }
      });
    }
  });
};

export default plugin;
