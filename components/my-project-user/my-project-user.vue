<template lang="pug">
.my-project-user
  .user-info
    img.profile-picture(:src='profilePicture', width='52')
    .flex.flex-col
      .display-name {{ displayName }}
      .text-ps-green.text-sm {{ year }}
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    return {
      displayName: mainStore.state.user.displayName,
      profilePicture: mainStore.state.user.profilePicture,
      // @ts-ignore
      year: new Date(mainStore.state.user.currentYear._seconds * 1000).getFullYear(),
    };
  },
});
</script>

<style lang="sass" src="./my-project-user.sass" scoped />
