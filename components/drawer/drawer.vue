<template lang="pug">
transition(name='drawer')
  .drawer(v-if='drawerState || isDesktop')
    transition(name='drawer-content')
      .content
        nuxt-link(to='/', @click='closeDrawer')
          .menu-item
            .wrap
              presentation-icon(:size='32')/
              span.item-title Veřejné projekty
        nuxt-link(to='/myproject', @click='closeDrawer')
          .menu-item
            .wrap
              strategy-icon(:size='32')/
              span.item-title Můj projekt
        nuxt-link(to='/proposal', @click='closeDrawer')
          .menu-item
            .wrap
              book-icon(:size='32')/
              span.item-title Zadání
        nuxt-link(to='/students', @click='closeDrawer')
          .menu-item
            .wrap
              accounts-icon(:size='32')/
              span.item-title Žáci
        nuxt-link(to='/admin', @click='closeDrawer')
          .menu-item
            .wrap
              admin-icon(:size='32')/
              span.item-title Admin
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, onMounted } from 'nuxt-composition-api';
import presentationIcon from 'vue-material-design-icons/Presentation.vue';
import strategyIcon from 'vue-material-design-icons/Strategy.vue';
import bookIcon from 'vue-material-design-icons/Book.vue';
import accountsIcon from 'vue-material-design-icons/AccountGroup.vue';
import adminIcon from 'vue-material-design-icons/AccountCog.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    presentationIcon,
    strategyIcon,
    accountsIcon,
    adminIcon,
    bookIcon,
  },
  setup(props, { emit, root }) {
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

    const closeDrawer = () => {
      drawerState.value = false;
      emit('input', drawerState.value);
    };

    return {
      drawerState,
      isDesktop,
      closeDrawer,
    };
  },
});
</script>

<style lang="sass" src="./drawer.sass" scoped />
