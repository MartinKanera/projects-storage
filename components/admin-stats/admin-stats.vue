<template lang="pug">
.admin-stats
  slot.placeholder
  .spinner(v-if='loading')
    img.animate-spin.mx-auto(src='/loader.svg', width='36')
  div(v-else)
    span {{ currentCount }}/
    span.max {{ maxCount }}
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    currentCount: {
      type: Number,
      default: 0,
    },
    maxCount: {
      type: Number,
      default: 0,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="sass" src="./admin-stats.sass" scoped />
