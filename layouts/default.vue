<template lang="pug">
.wrapper
  ps-navbar.top-0(v-model='isOpen')/
  ps-drawer.top-0(v-model='isOpen')/
  nuxt.layout.pt-20.pl-0/
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from '@nuxtjs/composition-api';

export default defineComponent({
  setup() {
    const isOpen = ref(false);

    watchEffect(() => {
      if (process.client) {
        if (isOpen.value) document.querySelector('html')!.style.overflowY = 'hidden';
        else {
          document.querySelector('html')!.style.overflowY = 'auto';
        }
      }
    });

    return { isOpen };
  },
});
</script>

<style lang="sass" scoped>
.layout
  @screen md
    @apply pt-32 pl-28
</style>
