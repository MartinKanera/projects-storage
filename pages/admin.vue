<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .mb-4.flex.flex-col(class='lg:flex-row')
    ps-admin-stats Žáci kteří mají zadání
    ps-admin-stats Vložené práce
    ps-admin-stats Odevzdané posudky
  ps-tabs(:tabs='["aktuální školní rok", "všechny práce"]', :selected='selectedTab', @selected='setTab')
    ps-tab(:active='selectedTab == "aktuální školní rok"')
    ps-tab(:active='selectedTab == "všechny práce"')
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

export default defineComponent({
  setup() {
    const selectedTab = ref('aktuální školní rok');

    const setTab = (tab: string) => {
      selectedTab.value = tab;
    };

    return {
      selectedTab,
      setTab,
    };
  },
});
</script>
