<template lang="pug">
.teacher-project
  .flex.items-center.justify-between
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ projectName }}
  ps-btn.text-ps-white(text) odevzdat posudek
    template(#icon-right)
      arrow-right.text-ps-white(:size='32')
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

import arrowRight from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  props: {
    projectId: {
      type: String,
      default: '',
      required: true,
    },
    displayName: {
      type: String,
      default: '',
      required: true,
    },
    projectName: {
      type: String,
      default: '',
      required: true,
    },
    profilePicture: {
      type: String,
      default: '',
      required: true,
    },
  },
  components: {
    arrowRight,
  },
});
</script>

<style lang="sass" src="./teacher-project.sass" scoped />
