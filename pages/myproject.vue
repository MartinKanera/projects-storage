<template lang="pug">
.h-auto.m-4.flex.flex-col.justify-between.items-stretch(class='lg:flex-row-reverse md:m-12 lg:items-start')
  ps-my-project-user
  ps-my-project-info
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

export default defineComponent({
  middleware: 'my-project',
  setup() {
    const project = ref({});

    return {
      project,
    };
  },
});
</script>
