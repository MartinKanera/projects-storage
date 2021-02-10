<template lang="pug">
.teacher-project
  .flex.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ projectTitle }}
  .actions.justify-self-end
    nuxt-link(:to='`/project/${url}`')
      ps-btn.text-ps-white(text) Projekt
        template(#icon-right)
          arrow-right.text-ps-white(:size='32')/
    ps-btn.text-ps-red(v-if='unreviewed && pastDeadline && submitted', text) Po termínu
      template(#icon-right)
        cross-icon/
    ps-btn.text-ps-white(v-else-if='unreviewed && submitted', text, @click='openModal') Nastavení
      template(#icon-right)
        arrow-right(:size='32')/
    ps-btn.text-ps-green(v-else-if='submitted', text, @click='openModal') Hodnoceno
      template(#icon-right)
        check-icon/
  ps-modal(v-model='displayModal')
    .flex.flex-col
      span.text-2xl.text-ps-white {{ projectTitle }}
      span.text-lg.text-ps-green {{ displayName }}
      span.mt-4.mb-1.text-ps-white Nahraj posudky
      ps-drag-drop(v-model='reviewsFiles', tile, multiple, accept='.pdf,.xlsx', :disabled='pastDeadline || !unreviewed', :draggable='false')
      ps-btn.self-end(v-if='reviewsFiles.length > 0', @click='uploadReviews', :disabled='uploading', :loading='uploading') Odeslat posudek
      span.mt-8.text-ps-green Odevzdané posudky:
      .text-ps-white.flex.items-center.justify-between(v-for='review in uploadedReviews')
        .flex
          word-icon(v-if='review.fileType == "docx"')/
          pdf-icon(v-else-if='review.fileType == "pdf"')/
          file-icon(v-else)/
          span {{ review.fileName }}
        ps-btn.justify-self-end(v-if='!pastDeadline', text, @click='removeReview(review.filePath)', :loading='reviewDelete', :disabled='reviewDelete')
          bin-icon(:size='20')
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs, computed } from '@nuxtjs/composition-api';
import axios from 'axios';

import { useMainStore } from '@/store';

import firebase from 'firebase/app';
import 'firebase/storage';
import 'firebase/auth';
import 'firebase/firestore';

import arrowRight from 'vue-material-design-icons/ChevronRight.vue';
import checkIcon from 'vue-material-design-icons/Check.vue';
import crossIcon from 'vue-material-design-icons/Close.vue';

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
  components: {
    arrowRight,
    checkIcon,
    wordIcon,
    pdfIcon,
    fileIcon,
    binIcon,
    crossIcon,
  },
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
    pastDeadline: {
      type: Boolean,
      required: true,
    },
    teacher: {
      type: Boolean,
      required: true,
    },
    opponent: {
      type: Boolean,
      required: true,
    },
    submitted: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const mainStore = useMainStore();

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

    const reviewDelete = ref(false);

    const removeReview = async (filePath: string) => {
      reviewDelete.value = true;

      try {
        await axios.post(
          `/api/review/delete/${filePath}`,
          {
            projectId: props.projectId,
          },
          {
            headers: {
              Authorization: `Bearer ${mainStore.state.user.idToken}`,
            },
          },
        );
      } catch (e) {
        console.error(e);
      }

      reviewDelete.value = false;
    };

    const unreviewed = computed(() => (props.teacher && props.opponent && props.reviews.length < 4) || ((props.teacher || props.opponent) && props.reviews.length < 2));

    return {
      displayModal,
      openModal,
      reviewsFiles,
      uploadReviews,
      uploading,
      uploadedReviews,
      removeReview,
      reviewDelete,
      userId: mainStore.state.user.id,
      unreviewed,
    };
  },
});
</script>

<style lang="sass" src="./teacher-project.sass" scoped />
