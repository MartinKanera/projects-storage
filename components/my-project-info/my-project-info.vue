<template lang="pug">
.my-project-info
  .title {{ title }}
  ps-text-area.mt-2(placeholder='Popis projektu', name='project-description', v-model='text')
  span.mt-6.text-ps-green Povinné soubory
  span.mb-1.text-ps-white.text-sm Dokumentace (docx, PDF), Projekt (zip/rar)
  ps-drag-drop(tile, multiple, accept='.pdf,.docx,.zip,.rar')
  span.text-ps-green Soubory navíc
  ps-drag-drop#optionalSelect(tile, multiple)
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
