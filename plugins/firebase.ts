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

    // @ts-ignore
    if (process.server) {
      // @ts-ignore
      let userData = context.res.locals.user;
      if (userData) {
        userData = { userData, ...{ loggedIn: true } };
      }
      mainStore.patch(userData);
    }

    // if (!process.server) {
    //   mainStore.state.loggedIn = !!firebase.auth().currentUser;

    //   firebase.auth().onAuthStateChanged((user) => {
    //     console.log(user);

    //     mainStore.state.loggedIn = !!user;
    //   });
    // }
  });
};

export default plugin;