<template lang="pug">
.h-auto.m-4
  .flex.flex-col.justify-between.items-stretch(class='lg:flex-row-reverse md:m-12 lg:items-start')
    ps-my-project-user
    ps-my-project-info
  .mt-8.w-full.flex.flex.justify-center
    ps-btn.mr-4 Uložit
    ps-btn.ml-4 Odevzdat
      template(#icon-right)
        chevron-right/
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  components: {
    chevronRight,
  },
  middleware: 'my-project',
  setup() {
    const project = ref({});

    return {
      project,
    };
  },
});
</script>
