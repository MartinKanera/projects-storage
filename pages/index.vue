<template lang="pug">
.page
  ps-modal(:value='yearModalDisplay', :disabled='true')
    span.text-ps-white.text-2xl Kdy maturuješ?
    .form.mt-4
      ps-select.flex-grow.md-mr-6(v-model='currentYear', placeholder='Rok maturity', :options='graduationYears')
      ps-btn.mt-4.float-right(:disabled='btnLoading', :loading='btnLoading', @click='sumbitSchoolYear') 
        span.px-10 uložit
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import axios from 'axios';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const graduationYears = ref([] as Array<{ placeholder: String; value: String }>);

    const yearModalDisplay = computed(() => mainStore.state.user.currentYear === null && mainStore.isLoggedIn && mainStore.isStudent);

    for (let i = 1; i < 5; i++) {
      const year = (new Date().getFullYear() + i).toString();

      graduationYears.value.push({
        placeholder: year,
        value: year,
      });
    }

    const currentYear = ref('');

    const btnDisabled = ref(false);
    const btnLoading = ref(false);

    watchEffect(() => {
      btnDisabled.value = !graduationYears.value.some((year) => Number(year.value) === Number(currentYear.value));
    });

    const sumbitSchoolYear = async () => {
      if (!graduationYears.value.some((year) => Number(year.value) === Number(currentYear.value))) return;

      btnLoading.value = true;

      try {
        const setTimestamp = (
          await axios.put(
            '/api/user/year',
            { year: currentYear.value },
            {
              headers: {
                Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
              },
            },
          )
        ).data;

        await mainStore.patch({ user: { currentYear: setTimestamp } });
      } catch (_) {}

      btnLoading.value = false;
    };

    return {
      yearModalDisplay,
      currentYear,
      graduationYears,
      btnDisabled,
      sumbitSchoolYear,
      btnLoading,
    };
  },
});
</script>
