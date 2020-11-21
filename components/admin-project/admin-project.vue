<template lang="pug">
.admin-project
  .info.flex-1
    img.profile-picture(:src='profilePicture', width='48')
    .flex.justify-between.flex-1(class='lg:justify-between')
      .flex.flex-col.justify-center
        span.text-ps-green.font-bold.text-lg {{ displayName }}
        span.text-ps-white {{ project.title }}
      .flex.flex-col.text-ps-white.items-end(class='lg:flex-row lg:mr-4 lg:items-center')
        span(class='lg:mr-4') posudky: {{ reviews.length }}/
          span.text-ps-green 4
        span(v-if='submittedDate') {{ getDate(submittedDate) }}
        span(v-else) není odevzdán
  .actions
    nuxt-link(to='idk')
      ps-btn.self-start(text) projekt
        template(#icon-right)
          chevron-icon(:size='18')/
    ps-btn.self-start(text, @click='openModal') detail
      template(#icon-right)
        details-icon(:size='18')/
  ps-modal.text-ps-white.leading-6(v-model='detailsModal')
    .flex.flex-col
      span.text-ps-green.text-2xl {{ projectToUpdate.title }}
      span.mb-8 {{ displayName }}
      ps-text-field.mb-4(v-model='projectToUpdate.title', name='projectTitle', label='Název projektu')
      span.text-ps-green Vedoucí projektu
      ps-select.mb-4(v-model='projectToUpdate.teacherId', placeholder='Vedoucí projektu', :options='deltaTeachers')
      span.text-ps-green Oponent
      ps-select.mb-4(v-model='projectToUpdate.opponentId', placeholder='Oponent', :options='teachers')
      .flex.flex-col
        span.text-ps-green.text-lg(v-if='reviews.length > 0') Odevzdaná hodnocení
        span(v-for='review in reviewsView') {{ review.displayName }} - {{ review.fileName }}
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
      default: () => [],
    },
  },
  // { projectId, currentYear, opponentId, publicProject, reviews, studentId, submittedDate, teacherId, title, displayName, profilePicture, teachers }
  setup({ projectId, currentYear, opponentId, publicProject, teacherId, title, teachers, reviews }) {
    const project = ref({ currentYear, opponentId, publicProject, teacherId, title });
    const projectToUpdate = ref({ ...project.value });

    // @ts-ignore
    const getDate = (timeStamp: firebase.firestore.Timestamp) => new Date(timeStamp?.toMillis()).toString().substr(4, 11);

    // @ts-ignore
    const deltaTeachers = ref(teachers.filter((teacher) => !teacher.extern));

    const updateProject = async () => {
      const projectRef = firebase.firestore().collection('projects').doc(projectId);

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

          return transaction;
        });

        project.value = { ...projectToUpdate.value };
        detailsModal.value = false;
      } catch (e) {
        console.error(e);
      }
    };

    const detailsModal = ref(false);
    const reviewsView = ref(undefined);

    const openModal = async () => {
      detailsModal.value = true;

      if (reviewsView.value || reviews.length === 0) return;

      try {
        const teachers = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', [teacherId, opponentId]).get()).docs;

        // @ts-ignore
        reviewsView.value = reviews.map((review) => {
          return {
            // @ts-ignore
            ...review,
            displayName: teachers.find((teacher) => review.teacherId === teacher.id || review.opponentId === teacher.id)?.data()?.displayName,
          };
        });
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
      deltaTeachers,
      openModal,
      reviewsView,
    };
  },
});
</script>

<style lang="sass" src="./admin-project.sass" scoped />
