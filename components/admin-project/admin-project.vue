<template lang="pug">
.admin-project
  span {{ projectTitle }}
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';
import firebase from 'firebase/app';

export default defineComponent({
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
  setup() {},
});
</script>

<style lang="sass" src="./admin-project.sass" scoped />
