<template lang="pug">
.my-project-user
  .user-info
    img.profile-picture(:src='profilePicture', width='52')
    .flex.flex-col
      .display-name {{ displayName }}
      .text-ps-green.text-sm {{ year }}
  ps-project-links(v-model='projectLinks')
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const projectLinks = ref([
      { url: 'https://tailwindcss.com/docs/animation', placeholder: 'TailWind.js' },
      { url: 'https://music.youtube.com/', placeholder: 'YouTube Music' },
    ]);

    onMounted(async () => {
      try {
        const response = await axios.get(`/api/reviews/${mainStore.state.project.id}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        console.log(response.data);
      } catch (e) {
        console.error(e);
      }
    });

    return {
      displayName: mainStore.state.user.displayName,
      profilePicture: mainStore.state.user.profilePicture,
      // @ts-ignore
      year: new Date(mainStore.state.user.currentYear._seconds * 1000).getFullYear(),
      projectLinks,
    };
  },
});
</script>

<style lang="sass" src="./my-project-user.sass" scoped />
