<template lang="pug">
.reviews-list(v-if='reviews.length > 0')
  span.text-ps-green.text-lg Učitelé
  .my-1.flex.items-center(v-for='(teacher, index) in reviews', :key='index')
    img.profile-picture(:src='teacher.profilePicture', :width='52')
    .teacher-review-info
      .display-name {{ teacher.displayName }}
      a(v-for='review in teacher.reviews', :href='review.publicUrl', target='_blank') {{ review.fileName }}
</template>

<script lang="ts">
import { useMainStore } from '@/store';
import { defineComponent, ref, onMounted } from '@nuxtjs/composition-api';

import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/firestore';

type ReviewRaw = {
  teacherId: string;
  reviews: Array<{
    filePath: String;
    fileName: String;
    publicUrl: String;
  }>;
};

type ReviewDisplay = {
  profilePicture: String;
  displayName: String;
  reviews: Array<ReviewRaw>;
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

        const teachersIds = [...new Set(reviewsRaw.map((review: ReviewRaw) => review.teacherId).filter((teacherId: string) => teacherId !== ''))];

        const teachersDocs = (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', teachersIds).get()).docs;

        // @ts-ignore
        reviews.value = teachersIds.map((teacherId) => {
          const currentReviews: ReviewRaw = reviewsRaw.find((review: ReviewRaw) => review.teacherId === teacherId);
          const teacherDoc = teachersDocs.find((doc) => doc.id === teacherId);

          return {
            displayName: teacherDoc?.data().displayName,
            profilePicture: teacherDoc?.data().profilePicture,
            reviews: currentReviews.reviews,
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
