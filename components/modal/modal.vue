<template lang="pug">
transition(name='fade', @before-enter='showContent = true')
  .wrapper(v-if='display', @click.self='closeModal')
    transition(name='popup')
      .modal(v-if='showContent')
        slot
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from '@nuxtjs/composition-api';

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
    const showContent = ref(false);

    watchEffect(() => {
      display.value = props.value;
      showContent.value = props.value;
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
      showContent.value = false;
      emit('input', display.value);
    };

    return {
      display,
      showContent,
      closeModal,
    };
  },
});
</script>

<style lang="sass" src="./modal.sass" scoped />
