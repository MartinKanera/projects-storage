<template lang="pug">
  .navbar
    .user
      .user-info
        .avatar-wrap
          img(src="https://i0.wp.com/www.hadviser.com/wp-content/uploads/2019/04/24-shaggy-bob-for-square-face-BcKy3nOnaAm.jpg?fit=995%2C995&ssl=1").avatar/
        span Martin Kaněra
        drop-down(:size="28").ml-1/
        bell(:size="22").ml-1/
    .menu-btn(@click="toggleBurger")
      .burger(:class="{ 'active': burger }")
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'nuxt-composition-api';
import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';

export default defineComponent({
  components: { dropDown, bell },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const burger = ref(false);

    const toggleBurger = () => {
      burger.value = !burger.value;
      emit('input', burger.value);
    };

    watchEffect(() => {
      burger.value = props.value;
    });

    return { burger, toggleBurger };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
