<template lang="pug">
.navbar
  .user
    .user-wrap
      .avatar-wrap(v-if='loggedIn')
        img.avatar(src='https://i0.wp.com/www.hadviser.com/wp-content/uploads/2019/04/24-shaggy-bob-for-square-face-BcKy3nOnaAm.jpg?fit=995%2C995&ssl=1')/
      .user-info
        .user-text(v-if='loggedIn')
          span.user-name Martin Kaněra
          span.user-role admin
        div(v-else)
          ps-btn(text, @click='loginWithMicrosoft')
            template(#default)
              span.microsoft-btn microsoft login
            template(#icon-left)
              microsoft-logo(mr-1)/
      .flex.justify-center.items-center.relative(v-if='loggedIn', v-on-clickaway='closeSettings')
        drop-down.drop(:class='{ "active-drop": displaySettings }', @click='toggleSettings')/
        ps-dropdown(:value='displaySettings')
          nuxt-link(to='/idk')
            ps-btn(block, text) nastavení účtu
              template(#icon-left)
                user/
          ps-btn.text-ps-red(block, text, @click='logOut') Odhlásit
            template(#icon-left)
              logout/
      .flex.justify-center.items-center.relative(v-if='loggedIn', v-on-clickaway='closeNotifications')
        bell.cursor-pointer.ml-1(@click='toggleNotifications')/
        ps-dropdown(:value='displayNotifications')
          span.mx-auto.p-2 Nothing here :-O
  .menu-btn(v-if='!isDesktop', @click='toggleBurger')
    .burger(:class='{ active: burger }')
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watchEffect } from 'nuxt-composition-api';
import axios from 'axios';

import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';
import user from 'vue-material-design-icons/Account.vue';
import logout from 'vue-material-design-icons/Logout.vue';
import microsoftLogo from 'vue-material-design-icons/Microsoft.vue';
import { directive as onClickaway } from 'vue-clickaway';
import { useMainStore } from '@/store';
import * as firebase from 'firebase/app';
// import 'firebase/auth';

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

    const loginWithMicrosoft = async () => {
      await require('firebase/auth');

      try {
        const provider = new firebase.auth.OAuthProvider('microsoft.com');

        const authUser = await firebase.auth().signInWithPopup(provider);

        await axios.request({
          url: '/api/user/create',
          method: 'POST',
          headers: {
            authorization: `Bearer ${await authUser.user?.getIdToken()}`,
          },
        });

        // console.log(idk.user?.uid);
      } catch (e) {}
    };

    const logOut = async () => {
      await require('firebase/auth');

      try {
        await firebase.auth().signOut();
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
      loggedIn: mainStore.isLoggedIn,
      loginWithMicrosoft,
      logOut,
    };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
