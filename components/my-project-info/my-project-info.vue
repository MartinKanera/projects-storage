<template lang="pug">
.my-project-info
  .title {{ title }}
  ps-text-area.mt-2(placeholder='Popis projektu', name='project-description', v-model='text')
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

export default defineComponent({
  props: {
    title: {
      type: String,
      default: 'Projekt',
    },
  },
  setup() {
    const text = ref('Ahoj');

    return {
      text,
    };
  },
});
</script>

<style lang="sass" src="./my-project-info.sass" scoped />
