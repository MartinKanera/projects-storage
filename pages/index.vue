<template lang="pug">
.page
  //- ps-modal(:value='classModal')
  //-   .class-modal
  //-     span.text-ps-white.text-2xl Do jaké patříš třídy?
  //-     .form
  //-       ps-select.flex-grow.md-mr-6(v-model='selectedClass', placeholder='Třída...', :options='classes')
  //-       ps-btn.float-right(@click='') 
  //-         span.px-10 uložit
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';
import { useMainStore } from '@/store';

export default defineComponent({
  setup() {
    const mainStore = useMainStore();

    // Ask for class future feature

    // const classModal = ref(false);

    // watchEffect(() => {
    //   if (mainStore.isLoggedIn.value && mainStore.isStudent.value && mainStore.class.value === '') {
    //     classModal.value = true;
    //   } else {
    //     classModal.value = false;
    //   }
    // });

    // const classes = ref([
    //   { placeholder: '4.A', value: '4.a' },
    //   { placeholder: '4.B', value: '4.b' },
    // ]);

    // const selectedClass = ref('');

    return {
      // classModal,
      // classes,
      // selectedClass,
    };
  },
});
</script>

<style lang="sass" scoped>
.page
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
