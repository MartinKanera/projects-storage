<template lang="pug">
.page
  ps-modal(:value='yearModalDisplay && !closeModal', :disabled='true')
    span.text-ps-white.text-2xl Kdy maturuješ?
    .form.mt-4
      ps-select.flex-grow.md-mr-6(v-model='currentYear', placeholder='Rok maturity', :options='graduationYears')
      ps-btn.mt-4.float-right(:disabled='btnLoading', :loading='btnLoading', @click='sumbitSchoolYear') 
        span.px-10 uložit
  ps-search-bar(v-model='kekw')
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import axios from 'axios';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const graduationYears = ref([] as Array<{ placeholder: Number; value: Number }>);

    const yearModalDisplay = computed(() => mainStore.state.user.currentYear === null && mainStore.isLoggedIn && mainStore.isStudent);

    for (let i = 1; i < 5; i++) {
      const year = new Date().getFullYear() + i;

      graduationYears.value.push({
        placeholder: year,
        value: year,
      });
    }

    const currentYear = ref(0);

    const btnDisabled = ref(false);
    const btnLoading = ref(false);

    watchEffect(() => {
      btnDisabled.value = !graduationYears.value.some((year) => Number(year.value) === Number(currentYear.value));
    });

    const closeModal = ref(false);

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

        closeModal.value = true;
      } catch (_) {}

      btnLoading.value = false;
    };

    const kekw = ref('');

    watchEffect(() => console.log(kekw.value));

    return {
      yearModalDisplay: yearModalDisplay.value,
      currentYear,
      graduationYears,
      btnDisabled,
      sumbitSchoolYear,
      btnLoading,
      closeModal,
      kekw,
    };
  },
});
</script>
