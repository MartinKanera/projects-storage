<template lang="pug">
.teacher
  .flex.items-center.flex-1
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .flex.flex-col.ml-2.leading-4
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white(v-if='admin') admin
  .actions(v-if='!(currentUserId === teacherId)')
    ps-btn.text-ps-white(v-if='!extern', text, @click='updateAdmin')
      admin-icon(v-if='!admin', :size='20')/
      teacher-icon(v-else, :size='20')/
    ps-btn.text-ps-white(text, @click='removeUser', :disabled='removeLoading', :loading='removeLoading') 
      bin-icon(:size='20')/
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { useMainStore } from '@/store';

import adminIcon from 'vue-material-design-icons/AccountCog.vue';
import teacherIcon from 'vue-material-design-icons/Account.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

export default defineComponent({
  props: {
    teacherId: {
      type: String,
      required: true,
    },
    extern: {
      type: Boolean,
      default: false,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    binIcon,
    adminIcon,
    teacherIcon,
  },
  setup({ teacherId }) {
    const removeLoading = ref(false);

    const mainStore = useMainStore();

    const removeUser = async () => {
      removeLoading.value = true;
      try {
        await axios.delete(`/api/user/delete/${teacherId}`, {
          headers: {
            Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
          },
        });
      } catch (e) {
        console.error(e);
      }
      removeLoading.value = false;
    };

    const updateAdmin = async () => {
      try {
        const userRef = firebase.firestore().collection('users').doc(teacherId);

        await firebase.firestore().runTransaction(async (transaction) => {
          const sfDoc = await transaction.get(userRef);

          transaction.update(userRef, {
            admin: !sfDoc.data()?.admin,
          });

          return transaction;
        });
      } catch (e) {
        console.error(e);
      }
    };

    return {
      removeUser,
      removeLoading,
      currentUserId: mainStore.state.user.id,
      updateAdmin,
    };
  },
});
</script>

<style lang="sass" src="./teacher.sass" scoped />
