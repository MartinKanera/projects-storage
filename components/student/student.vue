<template lang="pug">
.student
  .flex.items-center.flex-1
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .flex.flex-col.ml-2.leading-4
      span.text-ps-green.font-bold.block {{ displayName }}
  .actions
    ps-btn.text-ps-white(text, @click='settingsModal = !settingsModal')
      settings-icon(:size='20')/
    //- ps-btn.text-ps-white(text) 
    //-   bin-icon(:size='20')/
  ps-modal(v-model='settingsModal')
    span.text-ps-green.text-lg {{ studentToUpdate.displayName }}
    ps-text-field.mt-8.mb-4(v-model='studentToUpdate.displayName', name='displayName', label='Jméno')
    span.text-sm.mt-10.text-ps-green Rok maturity
    ps-select(v-model='studentToUpdate.year', placeholder='Rok maturity', :options='graduationYears')
    ps-btn.ml-auto.mt-6(@click='updateStudent') Aktualizovat
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';
import settingsIcon from 'vue-material-design-icons/Cog.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

import firebase from 'firebase/app';
import 'firebase/auth';

import axios from 'axios';

export default defineComponent({
  props: {
    studentId: {
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
    currentYear: {
      type: firebase.firestore.Timestamp,
      required: true,
    },
  },
  components: {
    settingsIcon,
    binIcon,
  },
  setup({ studentId, displayName, currentYear }) {
    const studentToUpdate = ref({ displayName, year: currentYear.toDate().getFullYear().toString() });

    const graduationYears = ref([] as Array<any>);

    const yearNow = new Date().getFullYear();

    for (let i = yearNow; i < yearNow + 4; i++) {
      graduationYears.value.push({
        value: i.toString(),
        placeholder: i.toString(),
      });
    }

    const settingsModal = ref(false);

    const updateStudent = async () => {
      try {
        await axios.put(
          `/api/student/update/${studentId}`,
          {
            displayName: studentToUpdate.value.displayName,
            year: JSON.parse(studentToUpdate.value.year),
          },
          {
            headers: {
              Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );

        settingsModal.value = false;
      } catch (e) {
        console.error(e);
      }
    };

    return {
      studentToUpdate,
      settingsModal,
      updateStudent,
      graduationYears,
    };
  },
});
</script>

<style lang="sass" src="./student.sass" scoped />
