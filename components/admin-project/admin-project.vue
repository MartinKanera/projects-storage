<template lang="pug">
.admin-project
  .info.flex-1
    img.profile-picture(:src='profilePicture', width='48')
    .flex.justify-between.flex-1(class='lg:justify-between')
      .flex.flex-col.justify-center
        span.text-ps-green.font-bold.text-lg {{ displayName }}
        span.text-ps-white {{ title }}
      .flex.flex-col.text-ps-white.items-end(class='lg:flex-row lg:mr-4 lg:items-center')
        span(class='lg:mr-4') posudky: {{ reviews.length }}/
          span.text-ps-green 4
        span(v-if='submittedDate') {{ getDate(submittedDate) }}
        span(v-else) není odevzdán
  .actions
    nuxt-link(:to='`/project/${projectId}`')
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
      span.text-ps-green Viditelnost projektu
      ps-select.mb-4(v-model='projectToUpdate.publicProject', :options='projectPublicity')
      span.text-ps-green Vedoucí projektu
      ps-select.mb-4(v-model='projectToUpdate.teacherId', placeholder='Vedoucí projektu', :options='deltaTeachers')
      span.text-ps-green Oponent
      ps-select.mb-4(v-model='projectToUpdate.opponentId', placeholder='Oponent', :options='teachers')
      span.text-ps-green.text-lg Nastavení odevzdání
      ps-select.mb-4(v-model='deadlineSwitch', :options='deadlineOptions')
      ps-text-field.mt-4.text-ps-white(v-if='displayPicker', v-model='projectToUpdate.deadlineDate', type='datetime-local', name='project-deadline', label='Termín odevzdání projektu')
      .flex.flex-col
        span.text-ps-green.text-lg(v-if='reviews.length > 0') Odevzdaná hodnocení
        span(v-for='review in reviewsView') {{ review.displayName }} -
          a.ml-1(:href='review.publicUrl') {{ review.fileName }}
      ps-btn.self-end(@click='updateProject', :loading='btnLoading', :disabled='btnLoading') Uložit změny
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from '@nuxtjs/composition-api';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import detailsIcon from 'vue-material-design-icons/AccountDetails.vue';
import chevronIcon from 'vue-material-design-icons/ChevronRight.vue';

import axios from 'axios';

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
    deadlineDate: {
      type: String || null,
      default: undefined,
    },
  },
  // { projectId, currentYear, opponentId, publicProject, reviews, studentId, submittedDate, teacherId, title, displayName, profilePicture, teachers }
  setup({ projectId, opponentId, publicProject, teacherId, title, teachers, reviews, deadlineDate }) {
    const projectToUpdate = ref({ opponentId, publicProject: publicProject.toString(), teacherId, title, deadlineDate });

    const deadlineSwitch = ref((!(projectToUpdate.value.deadlineDate === `${new Date().getFullYear()}-01-01T12:00`)).toString());
    const displayPicker = computed(() => JSON.parse(deadlineSwitch.value));

    const getDate = (timeStamp: firebase.firestore.Timestamp) => new Date(timeStamp?.toMillis()).toString().substr(4, 11);

    // @ts-ignore
    const deltaTeachers = ref(teachers.filter((teacher) => !teacher.extern));
    const btnLoading = ref(false);

    const updateProject = async () => {
      btnLoading.value = true;

      try {
        await axios.put(
          `/api/project/${projectId}`,
          {
            opponentId: projectToUpdate.value.opponentId,
            public: JSON.parse(projectToUpdate.value.publicProject),
            teacherId: projectToUpdate.value.teacherId,
            title: projectToUpdate.value.title,
            deadlineDate: JSON.parse(deadlineSwitch.value) ? projectToUpdate.value.deadlineDate : null,
          },
          {
            headers: {
              authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );
        detailsModal.value = false;
      } catch (e) {
        console.error(e);
      }

      btnLoading.value = false;
    };

    const detailsModal = ref(false);
    const reviewsView = ref(undefined);

    const openModal = async () => {
      detailsModal.value = true;

      if (reviewsView.value || reviews.length === 0) return;

      const teacherIds = [teacherId];

      if (opponentId !== '') teacherIds.push(opponentId);

      try {
        const teachers = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', teacherIds).get()).docs;

        const reviewsData = (
          await axios.get(`/api/reviews/${projectId}`, {
            headers: {
              authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          })
        ).data;

        // @ts-ignore
        reviewsView.value = reviewsData.map((review) => {
          return {
            ...review,
            // @ts-ignore
            displayName: teachers.find((teacher) => review.teacherId === teacher.id || review.opponentId === teacher.id)?.data()?.displayName,
          };
        });
      } catch (e) {
        console.error(e);
      }
    };

    const projectPublicity = [
      { placeholder: 'Private', value: 'false' },
      { placeholder: 'Veřejný', value: 'true' },
    ];

    const deadlineOptions = [
      { placeholder: 'Řídit se globálním', value: 'false' },
      { placeholder: 'Speciální termín', value: 'true' },
    ];

    return {
      getDate,
      detailsModal,
      updateProject,
      projectToUpdate,
      deltaTeachers,
      openModal,
      reviewsView,
      projectPublicity,
      btnLoading,
      deadlineOptions,
      deadlineSwitch,
      displayPicker,
    };
  },
});
</script>

<style lang="sass" src="./admin-project.sass" scoped />
