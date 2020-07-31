<template lang="pug">
  transition(name="drawer")
    .drawer(v-if="drawerState")
      transition(name="drawer-content")
        .content.pt-20
          ul
            li test
            li test
            li test
            li test
            li test
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
    const drawerState = ref(false);

    watchEffect(() => {
      drawerState.value = props.value;
    });

    return { drawerState };
  },
});
</script>

<style lang="sass" src="./drawer.sass" scoped />
