<template lang="pug">
.proposal-form
  span.text-lg.mb-5 Vyber si téma maturitního projektu
  span.self-start.mb-1.text-ps-green Vedoucí projektu
  ps-select.w-full.mb-5(placeholder='Učitel', :options='teachers', :loading='teachersLoading')
  span.self-start.mb-1.text-ps-green Předpřipravené projekty
  ps-select.w-full.mb-8(placeholder='Projekt')
  ps-btn Odeslat
</template>

<script lang="ts">
import { defineComponent, ref } from 'nuxt-composition-api';

import firebase from 'firebase/app';
import 'firebase/firestore';

type Teacher = {
  placeholder: String;
  value: String;
};

export default defineComponent({
  setup() {
    const teachersLoading = ref(true);
    const teachers = ref([] as Array<Teacher>);

    if (process.client) {
      (async () => {
        try {
          const teachersData = (await firebase.firestore().collection('users').where('student', '==', false).get()).docs;
          teachers.value = teachersData.map((teacherDoc) => {
            return {
              placeholder: teacherDoc.data().displayName,
              value: teacherDoc.id,
            };
          });

          teachersLoading.value = false;
        } catch (e) {
          console.error(e);
        }
      })();
    }

    return {
      teachersLoading,
      teachers,
    };
  },
});
</script>

<style lang="sass" src="./proposal-form.sass" scoped />
