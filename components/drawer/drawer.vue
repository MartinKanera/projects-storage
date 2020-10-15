<template lang="pug">
transition(name='drawer')
  .drawer(v-if='drawerState || isDesktop')
    transition(name='drawer-content')
      .content
        nuxt-link(v-if='', to='/', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              presentation-icon(:size='32')/
              span.item-title Veřejné projekty
        nuxt-link(v-if='loggedIn && verifiedStudent', to='/myproject')
          .menu-item(@click='closeDrawer')
            .wrap
              strategy-icon(:size='32')/
              span.item-title Můj projekt
        //- TODO Check if has projectId
        nuxt-link(v-if='loggedIn && verifiedStudent && false', to='/proposal', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              book-icon(:size='32')/
              span.item-title Zadání
        nuxt-link(v-if='loggedIn && teacher', to='/students', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              accounts-icon(:size='32')/
              span.item-title Žáci
        nuxt-link(v-if='loggedIn && admin', to='/admin', @click='closeDrawer')
          .menu-item(@click='closeDrawer')
            .wrap
              admin-icon(:size='32')/
              span.item-title Admin
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, onMounted } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

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
      loggedIn: mainStore.isLoggedIn,
      admin: mainStore.isAdmin,
      verifiedStudent: mainStore.isStudent && mainStore.class.value !== '',
      teacher: !mainStore.isStudent,
    };
  },
});
</script>

<style lang="sass" src="./drawer.sass" scoped />
