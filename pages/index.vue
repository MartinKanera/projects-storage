<template lang="pug">
.idk
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const classModal = ref(false);

    if (mainStore.isStudent && mainStore.class.value === '') {
      classModal.value = true;
    }
  },
});
</script>

<style>
.idk {
  height: 200vh;
}
</style>
