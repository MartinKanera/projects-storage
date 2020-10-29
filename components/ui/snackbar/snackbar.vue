<template lang="pug">
transition(name='slide')
  .snackbar(v-if='displayValue')
    slot
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'nuxt-composition-api';

export default defineComponent({
  props: {
    display: {
      default: true,
      type: Boolean,
    },
    delay: {
      type: Number,
      default: 2000,
    },
  },
  setup(props) {
    const displayValue = ref(props.display);

    watch(props, (props) => {
      displayValue.value = props.display;

      if (displayValue.value) {
        setTimeout(() => {
          displayValue.value = false;
        }, props.delay);
      }
    });

    return { displayValue };
  },
});
</script>

<style lang="sass" src="./snackbar.sass" scoped />
