<template lang="pug">
.admin-project
  .info.flex-1
    img.profile-picture(:src='profilePicture', width='48')
    .flex.justify-between.flex-1(class='lg:justify-between')
      .flex.flex-col.justify-center
        span.text-ps-green.font-bold.text-lg {{ project.displayName }}
        span.text-ps-white {{ project.title }}
      .flex.flex-col.text-ps-white.items-end(class='lg:flex-row lg:mr-4 lg:items-center')
        span(class='lg:mr-4') posudky: {{ reviews.length }}/
          span.text-ps-green 4
        span(v-if='submittedDate') {{ getDate() }}
        span(v-else) není odevzdán
  .actions
    nuxt-link(to='idk')
      ps-btn.self-start(text) projekt
        template(#icon-right)
          chevron-icon(:size='18')/
    ps-btn.self-start(text, @click='detailsModal = !detailsModal') detail
      template(#icon-right)
        details-icon(:size='18')/
  ps-modal.text-ps-white.leading-6(v-model='detailsModal')
    .flex.flex-col
      span.text-ps-green.text-2xl {{ projectToUpdate.title }}
      span.mb-8 {{ projectToUpdate.displayName }}
      ps-text-field.mb-8(v-model='projectToUpdate.title', name='projectTitle', label='Název projektu')
      ps-text-field.mb-8(v-model='projectToUpdate.displayName', name='displayName', label='Jméno studenta')
      ps-select.mb-6
      ps-btn.self-end(@click='updateProject') Uložit změny
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import firebase from 'firebase/app';
import 'firebase/firestore';

import detailsIcon from 'vue-material-design-icons/AccountDetails.vue';
import chevronIcon from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  components: {
    detailsIcon,
    chevronIcon,
  },
  props: {
    projectId: {
      type: String,
      required: true,
    },
    currentYear: {
      type: firebase.firestore.Timestamp,
      required: true,
    },
    opponentId: {
      type: String,
      required: true,
    },
    publicProject: {
      type: Boolean,
      required: true,
    },
    reviews: {
      type: Array,
      default: () => [],
    },
    studentId: {
      type: String,
      required: true,
    },
    submittedDate: {
      type: firebase.firestore.Timestamp || null,
      default: null,
    },
    teacherId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    teachers: {
      type: Array,
    },
  },
  // { projectId, currentYear, opponentId, publicProject, reviews, studentId, submittedDate, teacherId, title, displayName, profilePicture, teachers }
  setup({ projectId, studentId, submittedDate, currentYear, opponentId, publicProject, teacherId, title, displayName }) {
    const project = ref({ currentYear, opponentId, publicProject, teacherId, title, displayName });
    const projectToUpdate = ref({ ...project.value });

    console.log(project.value);

    // @ts-ignore
    const getDate = () => new Date(submittedDate?.toMillis()).toString().substr(4, 11);

    const detailsModal = ref(false);

    const updateProject = async () => {
      const projectRef = firebase.firestore().collection('projects').doc(projectId);
      const userRef = firebase.firestore().collection('users').doc(studentId);

      try {
        // eslint-disable-next-line require-await
        await firebase.firestore().runTransaction(async (transaction) => {
          transaction.update(projectRef, {
            currentYear: projectToUpdate.value.currentYear,
            opponentId: projectToUpdate.value.opponentId,
            public: projectToUpdate.value.publicProject,
            teacherId: projectToUpdate.value.teacherId,
            title: projectToUpdate.value.title,
          });

          transaction.update(userRef, {
            displayName: projectToUpdate.value.displayName,
          });

          return transaction;
        });

        project.value = { ...projectToUpdate.value };
        detailsModal.value = false;
      } catch (e) {
        console.error(e);
      }
    };

    return {
      getDate,
      detailsModal,
      updateProject,
      project,
      projectToUpdate,
    };
  },
});
</script>

<style lang="sass" src="./admin-project.sass" scoped />
