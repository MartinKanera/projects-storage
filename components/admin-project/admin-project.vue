<template lang="pug"></template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

export default defineComponent({
  props: {
    studentId: {
      type: String,
      required: true,
    },
    projectId: {
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
    projectTitle: {
      type: String,
      required: true,
    },
    submittedDate: {
      type: Date || undefined,
      required: true,
    },
    publicProject: {
      type: Boolean,
      required: true,
    },
  },
});
</script>
