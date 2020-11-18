<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .self-start(v-if='proposals.length > 0')
    span.text-2xl.text-ps-white.font-medium Projekty ke schválení
  .flex.flex-col.mt-4.mb-8.flex-wrap.justify-between(v-if='proposals.length > 0', class='md:flex-row md:justify-start')
    ps-student-proposal(
      v-for='proposal in proposals',
      :key='proposal.studentId',
      :studentId='proposal.studentId',
      :displayName='proposal.displayName',
      :projectTitle='proposal.projectTitle',
      :profilePicture='proposal.profilePicture',
      :proposalRef='proposal.proposalRef'
    )
  ps-tabs(:tabs='["studenti", "předpřipravené zadání"]', :selected='selectedTab', @selected='setTab')
    ps-tab(:active='selectedTab == "studenti"')
      .flex.justify-between
        span.text-2xl.text-ps-white.font-medium Moji studenti
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-teacher-project(
          v-for='project in projects',
          :key='project.projectId',
          :projectId='project.projectId',
          :projectTitle='project.projectTitle',
          :displayName='project.displayName',
          :profilePicture='project.profilePicture',
          :reviews='project.reviews'
        )
    ps-tab(:active='selectedTab == "předpřipravené zadání"')
      .flex.flex-col.justify-between(class='md:flex-row')
        span.text-2xl.text-ps-white.font-medium Předpřipravené projekty
        ps-btn.self-start(@click='projectModal', class='md:self-center') Přidat zadání
          template(#icon-right)
            plus-icon/
        ps-modal(v-model='projectModalDisplay')
          span.text-2xl.text-ps-white.font-medium Přidat zadání projektu
          ps-text-field.my-8(name='project-name', label='Název projektu', v-model='projectTitle')
          ps-btn.ml-auto(@click='addProject', :disabled='submitting || disabledBtn', :loading='submitting') Přidat projekt
      .flex.flex-col.mt-4.flex-wrap.justify-between(class='lg:flex-row')
        ps-premade-project(v-for='project in premadeProjects', :key='project.projectId', :projectId='project.projectId', :projectTitle='project.projectTitle')
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'nuxt-composition-api';

import { useMainStore } from '@/store';
import firebase from 'firebase/app';
import 'firebase/firestore';

import plusIcon from 'vue-material-design-icons/Plus.vue';

type StudentProposal = {
  studentId: String;
  displayName: String;
  projectTitle: String;
  profilePicture: String;
  proposalRef: firebase.firestore.DocumentReference;
};

type Project = {
  projectId: String;
  projectTitle: String;
  displayName: String;
  profilePicture: String;
  reviews: [];
};

type PremadeProject = {
  projectId: String;
  projectTitle: String;
};

export default defineComponent({
  middleware: 'teacher',
  components: {
    plusIcon,
  },
  setup() {
    const selectedTab = ref('studenti');

    const setTab = (tab: string) => {
      selectedTab.value = tab;
    };

    const proposals = ref([] as Array<StudentProposal>);
    const projects = ref([] as Array<Project>);
    const premadeProjects = ref([] as Array<PremadeProject>);

    const mainStore = useMainStore();

    if (process.client) {
      try {
        firebase
          .firestore()
          .collection('proposals')
          .where('teacherId', '==', mainStore.state.user.id)
          .where('studentId', '!=', null)
          .onSnapshot(async (proposalsSnap) => {
            const studentIds = proposalsSnap.docs.map((proposal) => proposal.data().studentId);
            const proposalsRefs = proposalsSnap.docs.map((proposal) => {
              return {
                studentId: proposal.data().studentId,
                ref: proposal.ref,
              };
            });

            if (!studentIds.length) {
              proposals.value = [];
              return;
            }

            const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

            proposals.value = studentsColection.map((studentDoc) => {
              return {
                studentId: studentDoc.id,
                displayName: studentDoc.data().displayName,
                projectTitle: proposalsSnap.docs.find((proposalDoc) => proposalDoc.data().studentId === studentDoc.id)?.data().title,
                profilePicture: studentDoc.data().profilePicture,
                proposalRef: proposalsRefs.find((proposalRef) => proposalRef.studentId === studentDoc.id)!.ref,
              };
            });
          });
      } catch (_) {}

      try {
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '>=', new firebase.firestore.Timestamp(new Date().getSeconds(), 0))
          .where('teacherId', '==', mainStore.state.user.id)
          .onSnapshot(async (projectSnap) => {
            const studentIds = projectSnap.docs.map((projectDoc) => projectDoc.data().studentId);

            if (!studentIds.length) {
              projects.value = [];
              return;
            }

            const studentsColection = await inArray(firebase.firestore().collection('users'), studentIds);

            projects.value = projectSnap.docs.map((projectDoc) => {
              const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

              return {
                projectId: projectDoc.id,
                projectTitle: projectDoc.data().title,
                displayName: currentStudent?.data().displayName,
                profilePicture: currentStudent?.data().profilePicture,
                reviews: (projectDoc.data()?.reviews ?? []).filter((review: any) => review.teacherId === mainStore.state.user.id),
              };
            });
          });
      } catch (e) {
        console.error(e);
      }

      try {
        firebase
          .firestore()
          .collection('proposals')
          .where('teacherId', '==', mainStore.state.user.id)
          .where('studentId', '==', null)
          .where('premade', '==', true)
          .onSnapshot((premadeSnap) => {
            premadeProjects.value = premadeSnap.docs.map((premadeDoc) => {
              return {
                projectId: premadeDoc.id,
                projectTitle: premadeDoc.data()?.title,
              };
            });
          });
      } catch (_) {}
    }

    const inArray = async (colRef: firebase.firestore.CollectionReference, inputArray: Array<String>) => {
      const perCall = 10;

      if (inputArray.length <= perCall) return (await colRef.where(firebase.firestore.FieldPath.documentId(), 'in', inputArray).get()).docs;

      const chunks: Array<Array<String>> = [];

      inputArray.forEach((element, i) => {
        const chunkIndex = Math.floor(i / perCall);

        if (!chunks[chunkIndex]) chunks[chunkIndex] = [];

        chunks[chunkIndex].push(element);
      });

      let resultArray: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[] = [];

      chunks.forEach(async (array) => {
        resultArray = [...resultArray, ...(await colRef.where(firebase.firestore.FieldPath.documentId(), 'in', array).get()).docs];
      });

      return resultArray;
    };

    const projectModalDisplay = ref(false);

    const projectModal = () => {
      projectModalDisplay.value = !projectModalDisplay.value;
    };

    const projectTitle = ref('');

    const submitting = ref(false);
    const disabledBtn = ref(true);

    watchEffect(() => {
      disabledBtn.value = projectTitle.value === '';
    });

    const addProject = async () => {
      submitting.value = true;
      const docRef = firebase.firestore().collection('proposals').doc();

      try {
        await docRef.set({
          premade: true,
          title: projectTitle.value,
          teacherId: mainStore.state.user.id,
          studentId: null,
        });
      } catch (e) {
        console.error(e);
      }

      submitting.value = false;
      projectModal();
    };

    return {
      selectedTab,
      setTab,
      proposals,
      projects,
      projectModal,
      projectModalDisplay,
      projectTitle,
      addProject,
      submitting,
      disabledBtn,
      premadeProjects,
    };
  },
});
</script>
