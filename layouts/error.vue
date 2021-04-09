<template lang="pug">
div {{ error.statusCode }}
</template>

<script lang="ts">
import { defineComponent, PropType } from '@nuxtjs/composition-api';
import { NuxtError } from '@nuxt/types';

export default defineComponent({
  layout: 'error-layout',
  props: {
    error: {
      type: Object as PropType<NuxtError>,
      required: true,
    },
  },
});
</script>
