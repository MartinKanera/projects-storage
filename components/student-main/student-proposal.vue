<template lang="pug">
.student-proposal
  .flex.idk.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ projectName }}
  .flex.justify-between.mt-5
    ps-btn.text-ps-white.text-sm(error) Zamítnout
      template(#icon-left) 
        closeIcon(:size='20')/
    ps-btn.text-sm Schválit
      template(#icon-right) 
        checkIcon(:size='20')/
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

import checkIcon from 'vue-material-design-icons/Check.vue';
import closeIcon from 'vue-material-design-icons/CloseCircle.vue';

export default defineComponent({
  components: {
    closeIcon,
    checkIcon,
  },
  props: {
    studentId: {
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
  setup() {},
});
</script>

<style lang="sass" src="./student-proposal.sass" scoped />
