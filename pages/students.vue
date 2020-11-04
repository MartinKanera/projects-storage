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
      :projectName='proposal.projectName',
      :profilePicture='proposal.profilePicture',
      :proposalRef='proposal.proposalRef'
    )
  span.text-2xl.text-ps-white.font-medium(v-if='projects.length > 0') Moji studenti
  .flex.flex-col.mt-4(class='lg:flex-row')
    ps-teacher-project(
      v-for='project in projects',
      :key='project.projectId',
      :projectId='project.projectId',
      :projectName='project.projectName',
      :displayName='project.displayName',
      :profilePicture='project.profilePicture'
    )
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import { useMainStore } from '@/store';
import firebase from 'firebase/app';
import 'firebase/firestore';

type StudentProposal = {
  studentId: String;
  displayName: String;
  projectName: String;
  profilePicture: String;
  proposalRef: firebase.firestore.DocumentReference;
};

type Project = {
  projectId: String;
  projectName: String;
  displayName: String;
  profilePicture: String;
};

export default defineComponent({
  middleware: 'teacher',
  setup() {
    const proposals = ref([] as Array<StudentProposal>);

    const projects = ref([] as Array<Project>);

    const mainStore = useMainStore();

    if (process.client) {
      try {
        firebase
          .firestore()
          .collection('proposals')
          .where('teacherId', '==', mainStore.state.user.id)
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

            const studentsColection = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', studentIds).get()).docs;

            proposals.value = studentsColection.map((studentDoc) => {
              return {
                studentId: studentDoc.id,
                displayName: studentDoc.data().displayName,
                projectName: proposalsSnap.docs.find((proposalDoc) => proposalDoc.data().studentId === studentDoc.id)?.data().name,
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
          .where('teacherId', '==', mainStore.state.user.id)
          .where('year', '==', new Date().getFullYear())
          .onSnapshot(async (projectSnap) => {
            const studentIds = projectSnap.docs.map((projectDoc) => projectDoc.data().studentId);

            if (!studentIds.length) {
              projects.value = [];
              return;
            }

            const studentsColection = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', studentIds).get()).docs;

            projects.value = projectSnap.docs.map((projectDoc) => {
              const currentStudent = studentsColection.find((studentDoc) => studentDoc.id === projectDoc.data().studentId);

              return {
                projectId: projectDoc.id,
                projectName: projectDoc.data().name,
                displayName: currentStudent?.data().displayName,
                profilePicture: currentStudent?.data().profilePicture,
              };
            });
          });
      } catch (e) {
        console.error(e);
      }
    }

    return {
      proposals,
      projects,
    };
  },
});
</script>
