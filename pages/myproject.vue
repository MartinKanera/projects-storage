<template lang="pug">
.h-auto.m-4
  ps-my-project
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  middleware: 'my-project',
});
</script>
