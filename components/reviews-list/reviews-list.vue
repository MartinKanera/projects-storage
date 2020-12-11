<template lang="pug">
.reviews-list(v-if='reviews.length > 0')
  span.text-ps-green.text-lg Posudky
  .mt-1.flex.items-center(v-for='(review, index) in reviews', :key='index')
    img.profile-picture(:src='review.profilePicture', :width='52')
    .teacher-review-info
      .display-name {{ review.displayName }}
      a(:href='review.publicUrl', target='_blank') {{ review.fileName }}
</template>

<script lang="ts">
import { useMainStore } from '@/store';
import { defineComponent, ref, onMounted } from '@nuxtjs/composition-api';

import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/firestore';

type ReviewRaw = {
  filePath: String;
  fileName: String;
  publicUrl: String;
  teacherId: String;
};

type ReviewDisplay = {
  profilePicture: String;
  displayName: String;
  publicUrl: String;
  fileName: String;
};

export default defineComponent({
  props: {
    projectId: {
      type: String,
      required: true,
    },
  },
  setup({ projectId }) {
    const mainStore = useMainStore();

    const reviews = ref([] as Array<ReviewDisplay>);

    onMounted(async () => {
      try {
        const response = await axios.get(`/api/reviews/${projectId}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        const reviewsRaw = response.data;

        if (reviewsRaw === []) return;

        const teachersIds = reviewsRaw.map((review: ReviewRaw) => review.teacherId);
        const teachersDocs = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', teachersIds).get()).docs;

        reviews.value = teachersDocs.map((teacher) => {
          const currentReview: ReviewRaw = reviewsRaw.find((review: ReviewRaw) => review.teacherId === teacher.id);

          return {
            displayName: teacher.data()?.displayName,
            profilePicture: teacher.data()?.profilePicture,
            publicUrl: currentReview.publicUrl,
            fileName: currentReview.fileName,
          };
        });
      } catch (e) {
        console.error(e);
      }
    });

    return {
      reviews,
    };
  },
});
</script>

<style lang="sass" src="./reviews-list.sass" scoped />
