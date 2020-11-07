<template lang="pug">
.proposal-form
  span.text-lg.mb-5(v-if='!submitted') Vyber si téma maturitního projektu
  span.text-2xl.mb-5(v-else) Už máš vybrané téma
  span.self-start.mb-1.text-ps-green.text-sm Vedoucí projektu
  ps-select.w-full.mb-5(v-model='selectedTeacherId', placeholder='Učitel', :options='teachers', :loading='teachersLoading')
  span.self-start.mb-1.text-ps-green.text-sm Projekty
  ps-select.w-full.mb-10(v-model='selectedProjectId', placeholder='Projekt', :options='projects', :loading='projectsLoading')
  ps-text-field.w-full.mb-8(v-model='studentsProjectName', v-if='displayTextField', type='text', label='Tvé vlastní téma', name='theme')
  ps-btn(:disabled='submitted || loadingBtn || disabledBtn', :loading='loadingBtn', @click='submitProposal') Odeslat
  ps-snackbar(:display='displaySnack', :delay='9000') Zadání odesláno, počkej na schválení učitelem
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

    watch(selectedTeacherId, (_) => proposalsListener());

    let activeListener = () => {};

    const proposalsListener = () => {
      if (process.client && selectedTeacherId.value) {
        activeListener();

        projectsLoading.value = true;
        selectedProjectId.value = '';

        activeListener = firebase
          .firestore()
          .collection('proposals')
          .where('teacherId', '==', selectedTeacherId.value)
          .where('studentId', '==', null)
          .onSnapshot((snapshot) => {
            projects.value = snapshot.docs.map((projectDoc) => {
              return {
                placeholder: projectDoc.data().name,
                value: projectDoc.id,
              };
            });
            projects.value.push({ placeholder: 'Tvé téma', value: 'studentTheme' });
          });

        projectsLoading.value = false;
      }
    };

    const loadingBtn = ref(false);
    const disabledBtn = ref(true);
    const displaySnack = ref(false);

    const studentsProjectName = ref('');
    const displayTextField = ref(false);

    watch(selectedProjectId, (selectedProjectId) => {
      displayTextField.value = selectedProjectId === 'studentTheme';
      disabledBtn.value = selectedProjectId === '' || displayTextField.value;
    });

    watch(studentsProjectName, (_) => {
      if (selectedProjectId.value === 'studentTheme') disabledBtn.value = !(studentsProjectName.value.length > 0);
      else studentsProjectName.value = '';
    });

    const submitProposal = async () => {
      if (!disabledBtn.value) {
        loadingBtn.value = true;
        try {
          let proposal = {
            studentId: mainStore.state.user.id,
            teacherId: selectedTeacherId.value,
          };

          console.log(proposal);

          if (studentsProjectName.value !== '') proposal = { ...proposal, ...{ name: studentsProjectName.value } };

          const collectionRef = firebase.firestore().collection('proposals');
          const docRef = selectedProjectId.value === 'studentTheme' ? collectionRef.doc() : collectionRef.doc(selectedProjectId.value);

          await docRef.set(proposal, { merge: true });

          submitted.value = true;
          displaySnack.value = true;
          activeListener();

          teachers.value = [];
          projects.value = [];
          displayTextField.value = false;
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
      displaySnack,
      studentsProjectName,
      displayTextField,
    };
  },
});
</script>

<style lang="sass" src="./proposal-form.sass" scoped />
