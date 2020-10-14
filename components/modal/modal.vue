<template lang="pug">
transition(name='popup')
  .wrapper(v-if='display')
    .modal
      slot
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'nuxt-composition-api';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const display = ref(false);

    watchEffect(() => {
      display.value = props.value;
    });

    watchEffect(() => {
      if (process.client) {
        if (display.value) document.querySelector('html')!.style.overflowY = 'hidden';
        else {
          document.querySelector('html')!.style.overflowY = 'auto';
        }
      }
    });

    return {
      display,
    };
  },
});
</script>

<style lang="sass" src="./modal.sass" scoped />
