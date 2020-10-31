<template lang="pug">
.navbar
  .user
    .user-wrap
      .avatar-wrap(v-if='mainStore.isLoggedIn')
        img.avatar(:src='mainStore.profilePicture')/
      .user-info
        .user-text(v-if='mainStore.isLoggedIn')
          span.user-name {{ mainStore.displayName }}
          span.user-role(v-if='mainStore.isTeacher && !mainStore.isAdmin') Učitel
          span.user-role(v-else-if='mainStore.isAdmin && !mainStore.isTeacher') Admin
          span.user-role(v-else-if='mainStore.isTeacher && mainStore.isAdmin') Admin/Učitel
        div(v-else)
          ps-btn(text, @click='loginWithMicrosoft', :disabled='awaitingLogin')
            template(#default)
              span.microsoft-btn microsoft login
            template(#icon-left)
              microsoft-logo(v-if='!awaitingLogin')/
              ps-microsoft-loader.mt-2(v-else)
      .flex.justify-center.items-center.relative(v-if='mainStore.isLoggedIn', v-on-clickaway='closeSettings')
        drop-down.drop(:class='{ "active-drop": displaySettings }', @click='toggleSettings')/

        ps-dropdown(:value='displaySettings')
          ps-btn.text-ps-red(block, text, @click='logOut') Odhlásit
            template(#icon-left)
              logout/
      .flex.justify-center.items-center.relative(v-if='mainStore.isLoggedIn', v-on-clickaway='closeNotifications')
        bell.cursor-pointer.ml-1(@click='toggleNotifications')/
        ps-dropdown(:value='displayNotifications')
          span.mx-auto.p-2 Nothing here :-O
  .menu-btn(v-if='!isDesktop', @click='toggleBurger')
    .burger(:class='{ active: burger }')
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watchEffect } from 'nuxt-composition-api';

import axios from 'axios';

import { useMainStore } from '@/store';

import dropDown from 'vue-material-design-icons/ChevronDown.vue';

import bell from 'vue-material-design-icons/BellOutline.vue';

import user from 'vue-material-design-icons/Account.vue';

import logout from 'vue-material-design-icons/Logout.vue';

import microsoftLogo from 'vue-material-design-icons/Microsoft.vue';

import { directive as onClickaway } from 'vue-clickaway';

import * as firebase from 'firebase/app';

type Props = {
  value: boolean;
};

export default defineComponent({
  components: {
    dropDown,
    bell,
    user,
    logout,
    microsoftLogo,
  },

  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },

  // @ts-ignore

  directives: { onClickaway },

  setup(props: Props, { emit, root }) {
    const mainStore = useMainStore();

    const burger = ref(false);

    watchEffect(() => {
      burger.value = props.value;
    });

    const toggleBurger = () => {
      burger.value = !burger.value;

      emit('input', burger.value);
    };

    const width = ref(1920);

    const isDesktop = computed(() => width.value >= 768);

    const onResize = () => (width.value = window.innerWidth);

    onMounted(() => {
      root.$nextTick(onResize);

      window.addEventListener('resize', onResize, { passive: true });
    });

    const displaySettings = ref(false);

    const toggleSettings = () => (displaySettings.value = !displaySettings.value);

    const closeSettings = () => (displaySettings.value = false);

    const displayNotifications = ref(false);

    const toggleNotifications = () => (displayNotifications.value = !displayNotifications.value);

    const closeNotifications = () => (displayNotifications.value = false);

    const awaitingLogin = ref(false);

    const loginWithMicrosoft = async () => {
      await require('firebase/auth');

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

    const logOut = async () => {
      await require('firebase/auth');

      try {
        await firebase.auth().signOut();
        await mainStore.reset();
        if (root.$route.path !== '/') root.$router.replace('/');

        closeSettings();
      } catch (e) {}
    };

    return {
      burger,
      toggleBurger,
      displaySettings,
      closeSettings,
      toggleSettings,
      displayNotifications,
      toggleNotifications,
      closeNotifications,
      isDesktop,
      loginWithMicrosoft,
      logOut,
      awaitingLogin,
      mainStore,
    };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
