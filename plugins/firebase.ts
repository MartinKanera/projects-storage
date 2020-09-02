import { Plugin } from '@nuxt/types';
import { onGlobalSetup } from 'nuxt-composition-api';
import firebase from 'firebase/app';
import 'firebase/auth';
import { env } from '@/env';
import { useMainStore } from '@/store';

const plugin: Plugin = () => {
  onGlobalSetup(() => {
    if (!process.server && !firebase.apps.length) firebase.initializeApp(env.firebaseConfig);
    const mainStore = useMainStore();

    if (!process.server) {
      mainStore.state.loggedIn = !!firebase.auth().currentUser;

      firebase.auth().onAuthStateChanged((user) => {
        mainStore.state.loggedIn = !!user;
      });
    }
  });
};

export default plugin;
