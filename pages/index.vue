<template lang="pug">
.page
  .public-projects
    ps-public-project(
      v-for='project in publicProjects',
      :key='project.id',
      :id='project.id',
      :title='project.title',
      :description='project.description',
      :displayName='project.displayName',
      :profilePicture='project.profilePicture',
      :year='project.year',
      :url='project.url'
    )
  ps-modal(:value='yearModalDisplay', :disabled='true')
    span.text-ps-white.text-2xl Kdy maturuješ?
    .form.mt-4
      ps-select.flex-grow.md-mr-6(v-model='currentYear', placeholder='Rok maturity', :options='graduationYears')
      ps-btn.mt-4.float-right(:disabled='btnLoading', :loading='btnLoading', @click='sumbitSchoolYear') 
        span.px-10 uložit
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, computed, useContext, useFetch, onMounted } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import axios from 'axios';

type PublicProject = {
  id: string;
  title: string;
  description: string;
  displayName: string;
  profilePicture: string;
  year: number;
  url: string;
};

export default defineComponent({
  setup() {
    const ctx = useContext();
    const mainStore = useMainStore();

    const graduationYears = ref([] as Array<{ placeholder: String; value: String }>);

    const yearModalDisplay = computed(() => mainStore.state.user.currentYear === null && mainStore.isLoggedIn && mainStore.isStudent);

    for (let i = 0; i < 5; i++) {
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

        mainStore.patch({ user: { currentYear: setTimestamp } });
      } catch (_) {}

      btnLoading.value = false;
    };

    const lastProjectId = ref('');
    const publicProjects = ref([] as Array<PublicProject>);

    const { fetch } = useFetch(async () => {
      try {
        const response = await ctx.app.$axios.get(`/api/public-projects`, {
          params: {
            lastProjectId: lastProjectId.value,
          },
        });

        const projects: Array<PublicProject> = response.data;

        lastProjectId.value = projects[projects.length - 1]?.id;
        publicProjects.value.push(...projects);
      } catch (e) {
        console.error(e);
      }
    });

    // infinity scroll
    onMounted(() => {
      window.onscroll = lazyLoad;
    });

    const lazyLoad = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastProjectId.value) return;

      fetch();
    };

    return {
      yearModalDisplay,
      currentYear,
      graduationYears,
      btnDisabled,
      sumbitSchoolYear,
      btnLoading,
      publicProjects,
    };
  },
});
</script>

<style lang="sass">
.page
  @apply min-h-screen

  .public-projects
    @apply w-full
    @apply grid grid-cols-1
    @apply p-1

    @screen lg
      @apply grid-cols-2
      @apply p-10
</style>
