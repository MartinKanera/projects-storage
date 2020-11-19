<template lang="pug">
.admin-project
  .info.flex-1
    img.profile-picture(:src='profilePicture', width='48')
    .flex.justify-between.flex-1(class='lg:justify-between')
      .flex.flex-col.justify-center
        span.text-ps-green.font-bold.text-lg {{ displayName }}
        span.text-ps-white {{ projectTitle }}
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
  ps-modal(v-model='detailsModal')
    span Detaily hehe
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import firebase from 'firebase/app';

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
    projectTitle: {
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
  },
  setup({ submittedDate }) {
    // @ts-ignore
    const getDate = () => new Date(submittedDate?.toMillis()).toString().substr(4, 11);

    const detailsModal = ref(false);

    return {
      getDate,
      detailsModal,
    };
  },
});
</script>

<style lang="sass" src="./admin-project.sass" scoped />
