<template lang="pug">
.h-screen.flex.justify-center.items-center
  ps-proposal-form
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  middleware: ['student', 'proposal'],
});
</script>
