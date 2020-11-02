<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .self-start(v-if='proposals.length > 0')
    span.text-2xl.text-ps-white.font-medium Projekty ke schválení
  .flex.flex-col.mt-4.flex-wrap.justify-between(class='md:flex-row md:justify-start')
    ps-student-proposal(
      v-for='proposal in proposals',
      :key='proposal.studentId',
      :studentId='proposal.studentId',
      :displayName='proposal.displayName',
      :projectName='proposal.projectName',
      :profilePicture='proposal.profilePicture'
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
};

export default defineComponent({
  middleware: 'teacher',
  setup() {
    const proposals = ref([] as Array<StudentProposal>);
    const mainStore = useMainStore();

    if (process.client) {
      try {
        firebase
          .firestore()
          .collection('proposals')
          .where('teacherId', '==', mainStore.state.user.id)
          .onSnapshot(async (proposalsSnap) => {
            const studentIds = proposalsSnap.docs.map((proposal) => proposal.data().studentId);

            const studentsColection = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', studentIds).get()).docs;

            proposals.value = studentsColection.map((studentDoc) => {
              return {
                studentId: studentDoc.id,
                displayName: studentDoc.data().displayName,
                projectName: proposalsSnap.docs.find((proposalDoc) => proposalDoc.data().studentId === studentDoc.id)?.data().name,
                profilePicture: studentDoc.data().profilePicture,
              };
            });
          });
      } catch (_) {}
    }

    return {
      proposals,
    };
  },
});
</script>
