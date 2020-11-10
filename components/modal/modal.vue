<template lang="pug">
transition(name='popup')
  .wrapper(v-if='display', @click.self='closeModal')
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
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
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

    const closeModal = () => {
      if (props.disabled) return;
      display.value = false;
      emit('input', display.value);
    };

    return {
      display,
      closeModal,
    };
  },
});
</script>

<style lang="sass" src="./modal.sass" scoped />
