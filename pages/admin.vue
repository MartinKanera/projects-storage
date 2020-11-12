<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .mb-4.flex.flex-col(class='lg:flex-row')
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentProjects', :maxCount='statistics.currentMaxStudents') Žáci kteří mají zadání
    ps-admin-stats(:loading='statsLoading') Vložené práce
    ps-admin-stats(:loading='statsLoading') Odevzdané posudky
  ps-tabs(:tabs='["aktuální školní rok", "všechny práce"]', :selected='selectedTab', @selected='setTab')
    ps-tab(:active='selectedTab == "aktuální školní rok"')
    ps-tab(:active='selectedTab == "všechny práce"')
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'nuxt-composition-api';
import firebase from 'firebase/app';
import 'firebase/firestore';

export default defineComponent({
  setup() {
    const selectedTab = ref('aktuální školní rok');

    const setTab = (tab: string) => {
      selectedTab.value = tab;
    };

    const statistics = ref({} as firebase.firestore.DocumentData | undefined);
    const statsLoading = ref(true);

    onMounted(async () => {
      try {
        statistics.value = (await firebase.firestore().collection('system').doc('statistics').get()).data();
        statsLoading.value = false;
      } catch (e) {
        console.error(e);
      }
    });

    return {
      selectedTab,
      setTab,
      statistics,
      statsLoading,
    };
  },
});
</script>
