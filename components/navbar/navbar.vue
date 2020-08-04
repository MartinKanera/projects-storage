<template lang="pug">
  .navbar
    .user
      .user-info
        .avatar-wrap
          img(src="https://i0.wp.com/www.hadviser.com/wp-content/uploads/2019/04/24-shaggy-bob-for-square-face-BcKy3nOnaAm.jpg?fit=995%2C995&ssl=1").avatar/
        span Martin Kaněra
        div.flex.justify-center.items-center.relative
          drop-down.drop(:class="{ 'active-drop': displaySettings }" @click.self="toggleSettings")/
          ps-dropdown.left(:value="displaySettings")
            a(href="/idk") lelelel
        div.flex.justify-center.items-center.relative
          bell.ml-1(@click="toggleNotifications")/
          ps-dropdown.right(:value="displayNotifications")
    .menu-btn(@click="toggleBurger")
      .burger(:class="{ 'active': burger }")
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'nuxt-composition-api';
import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';

export default defineComponent({
  components: { dropDown, bell },
  setup(_, /* { emit } */ context) {
    const burger = ref(false);

    const toggleBurger = () => {
      burger.value = !burger.value;
      context.emit('input', burger.value);
    };

    const displaySettings = ref(false);

    const toggleSettings = () => {
      displaySettings.value = !displaySettings.value;
      console.log(displaySettings.value);
      if (displaySettings.value) {
        document.addEventListener('mousedown', hideOVerlay);
      } else {
        document.removeEventListener('mousedown', hideOVerlay);
      }
    };

    const displayNotifications = ref(false);

    const toggleNotifications = () => (displayNotifications.value = !displayNotifications.value);

    const hideOVerlay = () => {
      displaySettings.value = false;
      displayNotifications.value = false;
    };

    // watchEffect(() => {
    //   // @ts-ignore
    //   if (process.server) return;
    //   if (displaySettings.value || displayNotifications.value) {
    //     console.log();
    //     document.addEventListener('mousedown', hideOVerlay, true);
    //   }
    // });

    return { burger, toggleBurger, displaySettings, toggleSettings, displayNotifications, toggleNotifications };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
