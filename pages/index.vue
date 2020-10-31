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

export default defineComponent({
  setup() {},
});
</script>
