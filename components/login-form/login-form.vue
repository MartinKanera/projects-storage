<template lang="pug">
.login-form
  span.header Přihlášení
  ps-btn.microsoft-btn(text, @click='loginWithMicrosoft', :disabled='awaitingLogin', :class='{ shrink: awaitingLogin }')
    template(#default)
      span.microsoft-btn microsoft login
    template(#icon-left)
      microsoft-logo(v-if='!awaitingLogin')/
      ps-microsoft-loader.mt-2(v-else)
    template(#icon-right)
      .blank
  span.mt-8.self-center nebo
  ps-text-field.mt-8(v-model='email', label='Email', name='email')
  ps-text-field.mt-8(v-model='password', type='password', label='Heslo', name='password')
  ps-btn.mt-8.self-end(@click='loginWithEmail', :disabled='awaitingLogin', :loading='awaitingLogin') přihlásit
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import firebase from 'firebase/app';
import 'firebase/auth';

import axios from 'axios';
import { useMainStore } from '@/store';

import microsoftLogo from 'vue-material-design-icons/Microsoft.vue';

export default defineComponent({
  components: {
    microsoftLogo,
  },
  setup() {
    const mainStore = useMainStore();

    const awaitingLogin = ref(false);

    const loginWithMicrosoft = async () => {
      try {
        awaitingLogin.value = true;

        const provider = new firebase.auth.OAuthProvider('microsoft.com');

        provider.setCustomParameters({
          prompt: 'select_account',
          tenant: process.env.TENANT,
        });

        const authUser = await firebase.auth().signInWithPopup(provider);

        const userData = (
          await axios.request({
            url: '/api/user/create',
            method: 'POST',
            headers: {
              authorization: `Bearer ${await authUser.user?.getIdToken()}`,
            },

            data: {
              // @ts-ignore
              accessToken: authUser.credential?.toJSON().oauthAccessToken,
            },
          })
        ).data;

        if (userData.user) {
          userData.user.loggedIn = true;

          mainStore.patch(userData);
        }
      } catch (e) {
        // TODO Error handling
        console.error(e);
      }
      awaitingLogin.value = false;
    };

    const email = ref('');
    const password = ref('');

    const loginWithEmail = async () => {
      awaitingLogin.value = true;

      try {
        const authUser = await firebase.auth().signInWithEmailAndPassword(email.value, password.value);

        const userData = (
          await axios.request({
            url: '/api/user/create',
            method: 'POST',
            headers: {
              authorization: `Bearer ${await authUser.user?.getIdToken()}`,
            },
          })
        ).data;

        if (userData.user) {
          userData.user.loggedIn = true;

          mainStore.patch(userData);
        }
      } catch (e) {
        console.error(e);
      }

      awaitingLogin.value = false;
    };

    return {
      loginWithMicrosoft,
      awaitingLogin,
      email,
      password,
      loginWithEmail,
    };
  },
});
</script>

<style lang="sass" src="./login-form.sass" scoped />
