<template lang="pug">
.tab(v-if='active')
  slot
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

export default defineComponent({
  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },
});
</script>
