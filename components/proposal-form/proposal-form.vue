<template lang="pug">
.proposal-form
  span.text-lg.mb-5(v-if='!alreadySubmitted') Vyber si téma maturitního projektu
  span.text-lg.mb-5(v-else) Už máš vybrané téma
  span.self-start.mb-1.text-ps-green Vedoucí projektu
  ps-select.w-full.mb-5(v-model='selectedTeacherId', placeholder='Učitel', :options='teachers', :loading='teachersLoading')
  span.self-start.mb-1.text-ps-green Projekty
  ps-select.w-full.mb-8(v-model='selectedProjectId', placeholder='Projekt', :options='projects', :loading='projectsLoading')
  ps-btn(:disabled='alreadySubmitted') Odeslat
</template>

<script lang="ts">
import { defineComponent, ref, useFetch, watch } from 'nuxt-composition-api';

import { useMainStore } from '@/store';

import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/firestore';

type Project = {
  placeholder: String;
  value: String;
};

export default defineComponent({
  setup(_, ctx) {
    const mainStore = useMainStore();

    const alreadySubmitted = ref(false);

    const teachersLoading = ref(true);
    const teachers = ref([]);

    // useFetch(async () => {
    //   try {
    //     const response = await axios.request({
    //       url: '/api/teachers/list',
    //       headers: {
    //         authorization: mainStore.state.user.id,
    //       },
    //     });

    //     if (response.data.status === 202) {
    //       alreadySubmitted.value = true;
    //     } else {
    //       teachers.value = response.data;
    //     }
    //     teachersLoading.value = false;
    //   } catch (e) {
    //     console.error(e);
    //   }
    // });

    useFetch(async () => {
      try {
        // @ts-ignore
        const response = await ctx.root.$nuxt.$axios.get('/api/teachers/list', {
          headers: {
            authorization: mainStore.state.user.id,
          },
        });

        if (response.data.status === 202) {
          alreadySubmitted.value = true;
        } else {
          teachers.value = response.data;
        }
        teachersLoading.value = false;
      } catch (e) {
        console.error(e);
      }
    });

    const selectedTeacherId = ref('');

    const projects = ref([] as Array<Project>);
    const projectsLoading = ref(false);

    watch(selectedTeacherId, (selectedTeacherId, _) => {
      if (process.client && selectedTeacherId) {
        projectsLoading.value = true;
        try {
          firebase
            .firestore()
            .collection('prepaparedProjects')
            .where('teacherId', '==', selectedTeacherId)
            .where('studentId', '==', null)
            .onSnapshot((snapshot) => {
              projects.value = snapshot.docs.map((projectDoc) => {
                return {
                  placeholder: projectDoc.data().name,
                  value: projectDoc.id,
                };
              });
            });
        } catch (e) {
          console.error(e);
        }
        projectsLoading.value = false;
      }
    });

    const selectedProjectId = ref('');

    return {
      alreadySubmitted,
      teachersLoading,
      teachers,
      selectedTeacherId,
      projectsLoading,
      projects,
      selectedProjectId,
    };
  },
});
</script>

<style lang="sass" src="./proposal-form.sass" scoped />
