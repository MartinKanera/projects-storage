<template lang="pug">
.tab(v-show='active')
  slot
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    active: {
      type: Boolean,
      default: true,
    },
  },
});
</script>
