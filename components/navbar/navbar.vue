<template lang="pug">
  .navbar
    .user
      .user-info
        .avatar-wrap
          img(src="https://i0.wp.com/www.hadviser.com/wp-content/uploads/2019/04/24-shaggy-bob-for-square-face-BcKy3nOnaAm.jpg?fit=995%2C995&ssl=1").avatar/
        span.font-extrabold Martin Kaněra
        .flex.justify-center.items-center.relative(v-on-clickaway="closeSettings")
          drop-down.drop(:class="{ 'active-drop': displaySettings }" @click="toggleSettings")/
          ps-dropdown(:value="displaySettings")
            nuxt-link(to="/idk")
              ps-btn(block text) nastavení účtu
                template(#icon-left)
                  user/
            ps-btn.text-ps-red(block text) Odhlásit
              template(#icon-left)
                log-out/
        .flex.justify-center.items-center.relative(v-on-clickaway="closeNotifications")
          bell.cursor-pointer.ml-1(@click="toggleNotifications")/
          ps-dropdown(:value="displayNotifications")
            span.mx-auto.p-2 Nothing here :-O
    .menu-btn(@click="toggleBurger")
      .burger(:class="{ 'active': burger }")
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import dropDown from 'vue-material-design-icons/ChevronDown.vue';
import bell from 'vue-material-design-icons/BellOutline.vue';
import user from 'vue-material-design-icons/Account.vue';
import logOut from 'vue-material-design-icons/LogOut.vue';
import { directive as onClickaway } from 'vue-clickaway';

export default defineComponent({
  components: {
    dropDown,
    bell,
    user,
    logOut,
  },
  directives: { onClickaway },
  setup(_, { emit }) {
    const burger = ref(false);

    const toggleBurger = () => {
      burger.value = !burger.value;
      emit('input', burger.value);
    };

    const displaySettings = ref(false);

    const toggleSettings = () => (displaySettings.value = !displaySettings.value);

    const closeSettings = () => (displaySettings.value = false);

    const displayNotifications = ref(false);

    const toggleNotifications = () => (displayNotifications.value = !displayNotifications.value);

    const closeNotifications = () => (displayNotifications.value = false);

    return {
      burger,
      toggleBurger,
      displaySettings,
      closeSettings,
      toggleSettings,
      displayNotifications,
      toggleNotifications,
      closeNotifications,
    };
  },
});
</script>

<style lang="sass" src="./navbar.sass" scoped />
