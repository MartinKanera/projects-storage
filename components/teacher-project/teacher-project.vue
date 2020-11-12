<template lang="pug">
.teacher-project
  .flex.items-center
    img.border-2.border-solid.border-ps-green.rounded-full(:src='profilePicture', width='48')
    .ml-2
      span.text-ps-green.font-bold.block {{ displayName }}
      span.text-ps-white {{ ptojectTitle }}
  ps-btn.text-ps-white(v-if='!reviewed', text, @click='openModal') odevzdat posudek
    template(#icon-right)
      arrow-right.text-ps-white(:size='32')/
  .flex(v-else)
    span.text-ps-white.mr-1 Hodnoceno
    check-icon.text-ps-white/
  ps-modal(v-model='displayModal')
    .flex.flex-col
      ps-drag-drop(v-model='reviews', tile)
      ps-btn.self-end(v-if='reviews.length > 0', @click='uploadReviews', :disabled='uploading', :loading='uploading') Odeslat posudek
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'nuxt-composition-api';
import { useMainStore } from '@/store';
import axios from 'axios';

import arrowRight from 'vue-material-design-icons/ChevronRight.vue';
import checkIcon from 'vue-material-design-icons/Check.vue';

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
    ptojectTitle: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    reviewed: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    arrowRight,
    checkIcon,
  },
  setup(props) {
    const displayModal = ref(false);
    const openModal = () => {
      displayModal.value = true;
    };
    const mainStore = useMainStore();

    const reviews = ref([]);

    watch(displayModal, (displayModal) => {
      if (!displayModal) reviews.value = [];
    });

    const uploading = ref(false);

    const uploadReviews = async () => {
      try {
        uploading.value = true;

        const file = reviews.value[0];

        const fd = new FormData();
        fd.append('file', file);
        fd.append('projectId', props.projectId);

        await axios.post('/api/review/upload', fd, {
          headers: {
            Authorization: `Bearer ${mainStore.state.user.id}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (e) {
        console.error(e);
      }

      uploading.value = false;
      displayModal.value = false;
    };

    return {
      displayModal,
      openModal,
      reviews,
      uploadReviews,
      uploading,
    };
  },
});
</script>

<style lang="sass" src="./teacher-project.sass" scoped />
