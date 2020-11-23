<template lang="pug">
.extern-teacher
  .flex.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    span.ml-2.text-ps-green.font-bold.block {{ displayName }}
  .actions
    //- ps-btn.text-ps-white(text)
    //-   gear-icon(:size='20')/
    ps-btn.text-ps-white(text, @click='removeUser', :disabled='removeLoading', :loading='removeLoading') 
      bin-icon(:size='20')/
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import gearIcon from 'vue-material-design-icons/Cog.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

export default defineComponent({
  props: {
    teacherId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
  },
  components: {
    gearIcon,
    binIcon,
  },
  setup({ teacherId }) {
    const removeLoading = ref(false);

    const removeUser = async () => {
      removeLoading.value = true;
      try {
        await axios.delete(`/api/teacher/delete/${teacherId}`, {
          headers: {
            Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
          },
        });
      } catch (e) {
        console.error(e);
      }
      removeLoading.value = false;
    };

    return {
      removeUser,
      removeLoading,
    };
  },
});
</script>

<style lang="sass" src="./extern-teacher.sass" scoped />
