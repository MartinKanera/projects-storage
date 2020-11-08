<template lang="pug">
.admin-stats
  slot.placeholder
  div
    span {{ currentCount }}/
    span.max {{ maxCount }}
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

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
  },
});
</script>

<style lang="sass" src="./admin-stats.sass" scoped />
