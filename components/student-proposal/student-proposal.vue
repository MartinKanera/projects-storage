<template lang="pug">
.student-proposal
  .flex.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ projectTitle }}
  .flex.justify-between.mt-5
    ps-btn.text-ps-white.text-sm(error, @click='declineProposal', :loading='declineLoading', :disabled='declineLoading || acceptLoading') Zamítnout
      template(#icon-left) 
        closeIcon(:size='20')/
    ps-btn.text-sm(@click='acceptProposal', :loading='acceptLoading', :disabled='declineLoading || acceptLoading') Schválit
      template(#icon-right) 
        checkIcon(:size='20')/
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api';

import checkIcon from 'vue-material-design-icons/Check.vue';
import closeIcon from 'vue-material-design-icons/CloseCircle.vue';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import axios from 'axios';

export default defineComponent({
  components: {
    closeIcon,
    checkIcon,
  },
  props: {
    studentId: {
      type: String,
      default: '',
      required: true,
    },
    displayName: {
      type: String,
      default: '',
      required: true,
    },
    projectTitle: {
      type: String,
      default: '',
      required: true,
    },
    profilePicture: {
      type: String,
      default: '',
      required: true,
    },
    proposalRef: {
      default: () => {
        return {} as firebase.firestore.DocumentReference;
      },
      required: true,
    },
  },
  setup(props) {
    const proposalRef = props.proposalRef;

    const declineLoading = ref(false);

    const declineProposal = async () => {
      declineLoading.value = true;

      await firebase.firestore().runTransaction(async (transaction) => {
        try {
          const sfDoc = await transaction.get(proposalRef);

          if (sfDoc.data()?.premade) {
            transaction.update(proposalRef, { studentId: null });
          } else {
            transaction.delete(proposalRef);
          }

          return transaction;
        } catch (e) {
          console.error(e);
        }
      });

      declineLoading.value = false;
    };

    const acceptLoading = ref(false);

    const acceptProposal = async () => {
      acceptLoading.value = true;

      try {
        await axios.put(
          `/api/proposal/accept/${proposalRef.id}`,
          {},
          {
            headers: {
              authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );
      } catch (e) {
        console.error(e);
      }

      acceptLoading.value = false;
    };

    return {
      declineProposal,
      acceptProposal,
      declineLoading,
      acceptLoading,
    };
  },
});
</script>

<style lang="sass" src="./student-proposal.sass" scoped />
