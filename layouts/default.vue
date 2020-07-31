<template lang="pug">
  div
    ps-navbar(v-model="isOpen")
    ps-drawer(v-model="isOpen")
    nuxt/
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

export default defineComponent({
  setup() {
    const isOpen = ref(false);

    return { isOpen };
  },
});
</script>
