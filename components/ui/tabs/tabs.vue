<template lang="pug">
.tabs
  .nav
    .tab-link(v-ripple, v-for='(tab, index) in tabs', :key='index', @click='setTab(tab)', :class='{ active: tab === selected }') {{ tab }}
  slot
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import ripple from '@/directives/ripple';

export default defineComponent({
  props: {
    tabs: {
      type: Array,
      required: true,
    },
    selected: {
      type: String,
      required: true,
    },
  },
  directives: {
    ripple,
  },
  setup(_, { emit }) {
    const setTab = (tab: string) => {
      emit('selected', tab);
    };

    return {
      setTab,
    };
  },
});
</script>

<style lang="sass" src="./tabs.sass" scoped />
