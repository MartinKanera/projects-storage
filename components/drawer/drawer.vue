<template lang="pug">
  transition(name="drawer")
    .drawer(v-if="drawerState || isDesktop" @mouseover="drawerState = true")
      transition(name="drawer-content")
        .content
          .menu-item
            .wrap
              presentation-icon(:size="36")
              span.item-title Veřejné projekty
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, onMounted } from 'nuxt-composition-api';
import presentationIcon from 'vue-material-design-icons/Presentation.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    presentationIcon,
  },
  setup(props, { root }) {
    const drawerState = ref(false);

    watchEffect(() => {
      drawerState.value = props.value;
    });

    const width = ref(0);

    const isDesktop = computed(() => width.value >= 768);

    const onResize = () => (width.value = window.innerWidth);

    onMounted(() => {
      root.$nextTick(onResize);
      window.addEventListener('resize', onResize, { passive: true });
    });

    return { drawerState, isDesktop };
  },
});
</script>

<style lang="sass" src="./drawer.sass" scoped />
