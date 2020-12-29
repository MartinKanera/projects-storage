<template lang="pug">
.loader-wrap(v-if='value')
  .loader
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: true,
    },
  },
});
</script>

<style lang="sass" src="./loader.sass" scoped />
