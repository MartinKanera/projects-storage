<template lang="pug">
transition(name='slide')
  .snackbar(v-if='displayValue')
    slot
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: {
      default: false,
      type: Boolean,
    },
    delay: {
      type: Number,
      default: 2000,
    },
  },
  setup(props, { emit }) {
    const displayValue = ref(props.value);

    watch(props, (props) => {
      displayValue.value = props.value;

      if (displayValue.value) {
        setTimeout(() => {
          displayValue.value = false;
          emit('input', displayValue.value);
        }, props.delay);
      }
    });

    return { displayValue };
  },
});
</script>

<style lang="sass" src="./snackbar.sass" scoped />
