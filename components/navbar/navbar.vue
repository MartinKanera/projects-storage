<template lang="pug">
  .navbar
    .user
      .user-info
        .avatar-wrap
          img(src="https://i0.wp.com/www.hadviser.com/wp-content/uploads/2019/04/24-shaggy-bob-for-square-face-BcKy3nOnaAm.jpg?fit=995%2C995&ssl=1").avatar/
        span Martin Kaněra
        drop-down(:size="28").ml-1.mt-1/
      bell
    .menu-btn(@click="burger = !burger")
      .burger(:class="{ 'active': burger }")
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';

export default defineComponent({
  components: { dropDown, bell },
  setup() {
    const burger = ref(false);

    return { burger };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
