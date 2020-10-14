<template lang="pug">
.idk
  ps-modal(:value='classModal')
    .class-modal
      span.text-ps-white.text-2xl Do jaké patříš třídy?
      .form
        select.flex-grow.md-mr-6
          option 4.A
          option 4.B
        ps-btn.float-right(@click='') 
          span.px-10 uložit
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    const classModal = ref(false);

    if (mainStore.isStudent && mainStore.class.value === '') {
      classModal.value = true;
    }

    return {
      classModal,
    };
  },
});
</script>

<style lang="sass" scoped>
.idk
  height: 200vh

.class-modal
  @apply flex flex-col w-full h-full text-center

  .form
    @apply flex flex-col mt-4

    @screen md
      @apply flex-row justify-between items-center

    select
      @apply h-auto

    .btn
      @apply m-0 mt-3

      @screen md
        @apply m-0 ml-5
</style>
