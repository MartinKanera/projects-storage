<template lang="pug">
transition(name='dropdown')
  .dropdown(v-if='display')
    .dropdown-content
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
  setup(props, { emit }) {
    const display = ref(false);

    watchEffect(() => {
      display.value = props.value;
      emit('input', display.value);
    });

    return {
      display,
    };
  },
});
</script>

<style lang="sass" src="./dropdown.sass" scoped />
