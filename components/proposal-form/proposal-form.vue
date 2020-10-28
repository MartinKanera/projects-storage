<template lang="pug">
.proposal-form
  span.text-lg.mb-5(v-if='!submitted') Vyber si téma maturitního projektu
  span.text-2xl.mb-5(v-else) Už máš vybrané téma
  span.self-start.mb-1.text-ps-green Vedoucí projektu
  ps-select.w-full.mb-5(v-model='selectedTeacherId', placeholder='Učitel', :options='teachers', :loading='teachersLoading')
  span.self-start.mb-1.text-ps-green Projekty
  ps-select.w-full.mb-8(v-model='selectedProjectId', placeholder='Projekt', :options='projects', :loading='projectsLoading')
  ps-btn(:disabled='submitted || loadingBtn || disabledBtn', :loading='loadingBtn', @click='submitProposal') Odeslat
</template>

<script lang="ts">
import { defineComponent, ref, useFetch, watch } from 'nuxt-composition-api';

import { useMainStore } from '@/store';

import firebase from 'firebase/app';
import 'firebase/firestore';

type Project = {
  placeholder: String;
  value: String;
};

export default defineComponent({
  setup(_, ctx) {
    const mainStore = useMainStore();

    const submitted = ref(false);

    const teachersLoading = ref(true);
    const teachers = ref([]);

    useFetch(async () => {
      try {
        // @ts-ignore
        const response = await ctx.root.$nuxt.$axios.get('/api/teachers/list', {
          headers: {
            authorization: mainStore.state.user.id,
          },
        });

        if (response.data.status === 202) {
          submitted.value = true;
        } else {
          teachers.value = response.data;
        }
        teachersLoading.value = false;
      } catch (e) {
        console.error(e);
      }
    });

    const selectedTeacherId = ref('');
    const selectedProjectId = ref('');

    const projects = ref([] as Array<Project>);
    const projectsLoading = ref(false);

    watch(selectedTeacherId, (selectedTeacherId) => {
      if (process.client && selectedTeacherId) {
        projectsLoading.value = true;
        const oldSelectedProjectId = selectedProjectId.value;

        try {
          firebase
            .firestore()
            .collection('proposals')
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

          if (projects.value.some((project) => project.value !== oldSelectedProjectId)) {
            selectedProjectId.value = '';
          }
        } catch (e) {
          console.error(e);
        }
        projectsLoading.value = false;
      }
    });

    watch(projects, (_) => {
      if (!projects.value.length) {
        selectedProjectId.value = '';
      }
    });

    const loadingBtn = ref(false);
    const disabledBtn = ref(true);

    watch(selectedProjectId, (selectedProjectId) => (disabledBtn.value = selectedProjectId === ''));

    const submitProposal = async () => {
      if (!disabledBtn.value) {
        loadingBtn.value = true;
        try {
          await firebase.firestore().collection('proposals').doc(selectedProjectId.value).set(
            {
              studentId: mainStore.state.user.id,
            },
            { merge: true },
          );
        } catch (e) {
          console.error(e);
        }

        loadingBtn.value = false;
      }
    };

    return {
      submitted,
      teachersLoading,
      teachers,
      selectedTeacherId,
      projectsLoading,
      projects,
      selectedProjectId,
      loadingBtn,
      submitProposal,
      disabledBtn,
    };
  },
});
</script>

<style lang="sass" src="./proposal-form.sass" scoped />
