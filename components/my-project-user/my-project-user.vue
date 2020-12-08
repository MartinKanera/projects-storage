<template lang="pug">
.my-project-user
  .user-info
    img.profile-picture(:src='profilePicture', width='52')
    .flex.flex-col
      .display-name {{ displayName }}
      .text-ps-green.text-sm {{ year }}
  ps-project-links(v-model='projectLinks')
  ps-reviews-list.mt-2(:projectId='projectId')
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const projectLinks = ref([
      { url: 'https://tailwindcss.com/docs/animation', placeholder: 'TailWind.js' },
      { url: 'https://music.youtube.com/', placeholder: 'YouTube Music' },
    ]);

    return {
      displayName: mainStore.state.user.displayName,
      profilePicture: mainStore.state.user.profilePicture,
      // @ts-ignore
      year: new Date(mainStore.state.user.currentYear._seconds * 1000).getFullYear(),
      projectLinks,
      projectId: mainStore.state.project.id,
    };
  },
});
</script>

<style lang="sass" src="./my-project-user.sass" scoped />
