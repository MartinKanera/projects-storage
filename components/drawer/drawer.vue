<template lang="pug">
  //- .drawer(:class="{ 'open': drawerState }")
  transition(name="drawer")
    .drawer(v-if="drawerState")
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
