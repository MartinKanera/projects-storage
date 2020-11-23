<template lang="pug">
.teacher-project
  .flex.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ projectTitle }}
  .actions.justify-self-end
    nuxt-link(to='idk')
      ps-btn.text-ps-white(text) Projekt
        template(#icon-right)
          arrow-right.text-ps-white(:size='32')/
    ps-btn.text-ps-white(text, @click='openModal') Nastavení
      template(#icon-right)
        arrow-right.text-ps-white(:size='32')/
  //- .flex(v-else)
  //-   span.text-ps-white.mr-1 Hodnoceno
  //-   check-icon.text-ps-white/
  ps-modal(v-model='displayModal')
    .flex.flex-col
      span.text-2xl.text-ps-white {{ projectTitle }}
      span.text-lg.text-ps-green {{ displayName }}
      span.mt-4.mb-1.text-ps-white Nahraj posudky
      ps-drag-drop(v-model='reviewsFiles', tile, multiple, accept='.pdf,.xlsx')
      ps-btn.self-end(v-if='reviewsFiles.length > 0', @click='uploadReviews', :disabled='uploading', :loading='uploading') Odeslat posudek
      span.mt-8.text-ps-green Odevzdané posudky:
      .text-ps-white.flex.items-center.justify-between(v-for='review in uploadedReviews')
        .flex
          word-icon(v-if='review.fileType == "docx"')/
          pdf-icon(v-else-if='review.fileType == "pdf"')/
          file-icon(v-else)/
          span {{ review.fileName }}
        ps-btn.justify-self-end(text, @click='removeReview(review.fileUrl)')
          bin-icon(:size='20')
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs } from 'nuxt-composition-api';
import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/auth';
import 'firebase/firestore';

import arrowRight from 'vue-material-design-icons/ChevronRight.vue';
import checkIcon from 'vue-material-design-icons/Check.vue';

import wordIcon from 'vue-material-design-icons/FileWord.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import fileIcon from 'vue-material-design-icons/File.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

type UploadedReview = {
  fileName: string;
  fileUrl: string;
  teacherId: string;
  uploaded: firebase.firestore.Timestamp;
  fileType: string;
};

export default defineComponent({
  props: {
    projectId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    projectTitle: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    reviews: {
      default: () => [],
    },
  },
  components: {
    arrowRight,
    checkIcon,
    wordIcon,
    pdfIcon,
    fileIcon,
    binIcon,
  },
  setup(props) {
    const displayModal = ref(false);
    const openModal = () => {
      displayModal.value = true;
    };

    const reviewsFiles = ref([]);

    watch(displayModal, (displayModal) => {
      if (!displayModal) reviewsFiles.value = [];
    });

    const uploading = ref(false);

    const uploadReviews = async () => {
      try {
        uploading.value = true;

        const files = reviewsFiles.value;

        const fd = new FormData();

        files.forEach((file) => fd.append('files', file));

        await axios.post(`/api/review/upload/${props.projectId}`, fd, {
          headers: {
            Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (e) {
        console.error(e);
      }

      uploading.value = false;
      displayModal.value = false;
    };

    const { reviews } = toRefs(props);

    const uploadedReviews = ref(
      reviews.value.map((uploadedReview: UploadedReview) => {
        const splitted = uploadedReview.fileName?.split('.');

        return {
          ...uploadedReview,
          fileType: splitted[splitted.length - 1],
        };
      }),
    );

    watch(reviews, (reviews) => {
      uploadedReviews.value = reviews.map((uploadedReview: UploadedReview) => {
        const splitted = uploadedReview.fileName?.split('.');

        return {
          ...uploadedReview,
          fileType: splitted[splitted.length - 1],
        };
      });
    });

    const removeReview = async (url: string) => {
      const storage = firebase.app().storage('gs://ps-reviews');
      const fileRef = storage.refFromURL(url);

      try {
        await fileRef.delete();

        const projectRef = firebase.firestore().collection('projects').doc(props.projectId);

        await firebase.firestore().runTransaction(async (transaction) => {
          const sfDoc = await transaction.get(projectRef);

          const reviews = sfDoc.data()?.reviews ?? [];

          const updatedReviews = reviews.filter((review: any) => review.fileUrl !== url);

          transaction.set(
            projectRef,
            {
              reviews: updatedReviews,
            },
            { merge: true },
          );

          return transaction;
        });
      } catch (e) {
        console.error(e);
      }
    };

    return {
      displayModal,
      openModal,
      reviewsFiles,
      uploadReviews,
      uploading,
      uploadedReviews,
      removeReview,
    };
  },
});
</script>

<style lang="sass" src="./teacher-project.sass" scoped />
