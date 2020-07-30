<template lang="pug">
  .navbar
    .user-info
      .avatar-wrap
        .avatar
      span Martin Kaněra
      drop-down(:size="32").ml-1.mt-1/


</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';
import dropDown from 'vue-material-design-icons/ChevronDown.vue';

export default defineComponent({
  components: { dropDown },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
