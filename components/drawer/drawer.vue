<template lang="pug">
transition(name='drawer')
  .drawer(v-if='drawerState || isDesktop')
    transition(name='drawer-content')
      .content
        nuxt-link(to='/', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              presentation-icon(:size='32')/
              span.item-title Veřejné projekty
        nuxt-link(v-if='mainStore.state.user.loggedIn && mainStore.state.project.id !== "" && mainStore.state.user.student', to='/myproject')
          .menu-item(@click='closeDrawer')
            .wrap
              strategy-icon(:size='32')/
              span.item-title Můj projekt
        nuxt-link(v-if='mainStore.state.user.loggedIn && mainStore.state.project.id === "" && mainStore.state.user.student', to='/proposal', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              book-icon(:size='32')/
              span.item-title Zadání
        nuxt-link(v-if='mainStore.state.user.loggedIn && mainStore.state.user.teacher', to='/students', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              accounts-icon(:size='32')/
              span.item-title Žáci
        nuxt-link(v-if='mainStore.state.user.loggedIn && mainStore.state.user.admin', to='/admin', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              admin-icon(:size='32')/
              span.item-title Admin
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, onMounted } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';

import presentationIcon from 'vue-material-design-icons/Presentation.vue';
import strategyIcon from 'vue-material-design-icons/Strategy.vue';
import bookIcon from 'vue-material-design-icons/Book.vue';
import accountsIcon from 'vue-material-design-icons/AccountGroup.vue';
import adminIcon from 'vue-material-design-icons/AccountCog.vue';

export default defineComponent({
  components: {
    presentationIcon,
    strategyIcon,
    accountsIcon,
    adminIcon,
    bookIcon,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit, root }) {
    const mainStore = useMainStore();

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
      mainStore,
    };
  },
});
</script>

<style lang="sass" src="./drawer.sass" scoped />
