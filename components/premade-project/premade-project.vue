<template lang="pug">
.premade-project
  span {{ projectTitle }}
  ps-btn(text, @click='removePremadeProject(projectId)')
    bin-icon(:size='18')/
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import firebase from 'firebase/app';
import 'firebase/firestore';

import binIcon from 'vue-material-design-icons/Delete.vue';

export default defineComponent({
  props: {
    projectId: {
      type: String,
      required: true,
    },
    projectTitle: {
      type: String,
      required: true,
    },
  },
  components: {
    binIcon,
  },
  setup() {
    const removePremadeProject = async (projectId: string) => {
      try {
        const projectRef = firebase.firestore().collection('proposals').doc(projectId);

        await firebase.firestore().runTransaction(async (transaction) => {
          const sfDoc = await transaction.get(projectRef);

          if (sfDoc.data()?.studentId !== null) throw new Error('proposal/hasStudent');

          transaction.delete(projectRef);

          return transaction;
        });
      } catch (e) {
        console.error(e);
      }
    };

    return {
      removePremadeProject,
    };
  },
});
</script>

<style lang="sass" src="./premade-project.sass" scoped />
