<template lang="pug">
.navbar
  .user
    .user-wrap
      .avatar-wrap(v-if='mainStore.isLoggedIn', @click='pictureModal = !pictureModal', @mouseover='pictureHover = true', @mouseleave='pictureHover = false')
        img.avatar(:src='mainStore.profilePicture')/
        .change-wrap(v-if='pictureHover')
          edit-icon.icon
      .user-info.flex(@click='toggleSettings', v-on-clickaway='closeSettings')
        .user-text(v-if='mainStore.isLoggedIn')
          span.user-name {{ mainStore.displayName }}
          span.user-role(v-if='mainStore.isTeacher && !mainStore.isAdmin') Učitel
          span.user-role(v-else-if='mainStore.isAdmin && !mainStore.isTeacher') Admin
          span.user-role(v-else-if='mainStore.isTeacher && mainStore.isAdmin') Admin/Učitel
        .flex.items-center(v-else)
          ps-btn(text, @click='loginModal = true') Přihlášení
            template(#icon-right)
              arrow-right/
        .flex.justify-center.items-center.relative(v-if='mainStore.isLoggedIn')
          drop-down.drop(:class='{ "active-drop": displaySettings }')/
          ps-dropdown(:value='displaySettings')
            ps-btn.text-ps-red(block, text, @click='logOut') Odhlásit
              template(#icon-left)
                logout/
      .flex.justify-center.items-center.relative(v-if='mainStore.isLoggedIn', v-on-clickaway='closeNotifications')
        .notifications-number(v-if='notificationsLength > 0', @click='toggleNotifications')
          span {{ notificationsLength }}
        bell.cursor-pointer.ml-1(@click='toggleNotifications')/
        ps-dropdown(:value='displayNotifications')
          ps-notifications-list(@update-notifications='updateNotifications', v-show='notificationsLength > 0')
  .menu-btn(v-if='!isDesktop', @click='toggleBurger')
    .burger(:class='{ active: burger }')
  ps-modal(v-model='loginModal')
    .flex.justify-center
      ps-login-form(@login-complete='toggleLoginModal')
  ps-modal(v-model='pictureModal')
    .picture-modal-wrapper
      span.title Změna profilového obrázku
      .placeholder
        img(:src='placeholderImage')
      ps-drag-drop.mb-4(tile, :draggable='false', accept='.jpg,.jpeg,.gif,.png', v-model='selectedPicture', @input='changePlaceholder', :disabled='uploading')
      .actions
        ps-btn(@click='uploadPicture', :disabled='uploading', :loading='uploading') nahrát
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watchEffect, unref } from '@nuxtjs/composition-api';

import { useMainStore } from '@/store';

import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';
import user from 'vue-material-design-icons/Account.vue';
import logout from 'vue-material-design-icons/Logout.vue';
import microsoftLogo from 'vue-material-design-icons/Microsoft.vue';
import arrowRight from 'vue-material-design-icons/ChevronRight.vue';
import editIcon from 'vue-material-design-icons/ImageEdit.vue';

import { directive as onClickaway } from 'vue-clickaway';

import firebase from 'firebase/app';
import 'firebase/auth';
import axios from 'axios';

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
    arrowRight,
    editIcon,
  },

  // @ts-ignore

  directives: { onClickaway },

  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },

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

    const logOut = async () => {
      try {
        await firebase.auth().signOut();
        mainStore.reset();

        if (root.$route.path !== '/') root.$router.replace('/');

        closeSettings();
      } catch (e) {}
    };

    const loginModal = ref(false);

    const toggleLoginModal = (loginComplete: boolean) => {
      loginModal.value = !loginComplete;
    };

    const notificationsLength = ref(0);
    const updateNotifications = (length: number) => {
      notificationsLength.value = length;
    };

    const pictureHover = ref(false);
    const pictureModal = ref(false);
    const selectedPicture = ref([]);

    const placeholderImage = ref(unref(mainStore.state.user.profilePicture));
    const uploading = ref(false);

    const uploadPicture = async () => {
      uploading.value = true;
      const fd = new FormData();

      fd.append('avatar', selectedPicture.value[0]);

      try {
        const response = await axios.patch('/api/user/picture', fd, {
          headers: {
            authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
          },
        });

        mainStore.patch({ user: { profilePicture: response.data } });
      } catch (e) {
        console.error(e);
      }

      uploading.value = false;
      pictureModal.value = false;
    };

    const changePlaceholder = () => {
      if (!selectedPicture.value.length) {
        placeholderImage.value = unref(mainStore.state.user.profilePicture);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        // @ts-ignore
        placeholderImage.value = e.target?.result;
      };

      reader.readAsDataURL(selectedPicture.value[0]);
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
      logOut,
      mainStore,
      loginModal,
      updateNotifications,
      notificationsLength,
      toggleLoginModal,
      pictureModal,
      uploadPicture,
      pictureHover,
      selectedPicture,
      changePlaceholder,
      placeholderImage,
      uploading,
    };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
