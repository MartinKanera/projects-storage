<template lang="pug">
.h-auto.m-4
  .flex.flex-col.justify-between.items-stretch(class='lg:flex-row-reverse md:m-12 lg:items-start')
    .my-project-user
      .user-info
        img.profile-picture(:src='profilePicture', width='52')
        .flex.flex-col
          .display-name {{ displayName }}
          .text-ps-green.text-sm {{ year }}
      ps-project-links(v-model='linksRef')
      ps-reviews-list.mt-2(:projectId='projectId')
    .my-project-info
      .title {{ titleRef }}
      ps-text-area.mt-2(v-model='descriptionRef', placeholder='Popis projektu', name='project-description')
      span.mt-6.text-ps-green Povinné soubory
      span.mb-1.text-ps-white.text-sm Dokumentace (docx, PDF), Projekt (zip/rar)
      ps-drag-drop(v-model='mandatoryFilesUpload', tile, multiple, accept='.pdf,.docx,.zip,.rar')
      span.text-ps-green Soubory navíc
      ps-drag-drop#optionalSelect(v-model='optionalFilesUpload', tile, multiple)
  .mt-8.w-full.flex.flex.justify-center
    ps-btn.mr-4(@click='saveChanges', :disabled='awaiting', :loading='awaiting') Uložit
    ps-btn.ml-4(:disabled='awaiting', :loading='awaiting') Odevzdat
      template(#icon-right)
        chevron-right/
</template>

<script lang="ts">
import { defineComponent, ref, useFetch, watchEffect } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';
import axios from 'axios';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  components: {
    chevronRight,
  },
  setup(_, { root }) {
    const mainStore = useMainStore();

    const awaiting = ref(false);

    const titleRef = ref('');
    const descriptionRef = ref('');
    const linksRef = ref([]);
    const mandatoryFilesRef = ref([]);
    const optionalFilesRef = ref([]);

    const mandatoryFilesUpload = ref([]);
    const optionalFilesUpload = ref([]);

    const { fetch } = useFetch(async () => {
      try {
        // @ts-ignore
        const response = await root.$nuxt.$axios.get(`/api/project/${mainStore.state.project.id}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        const { title, description, links, mandatoryFiles, optionalFiles } = response.data;

        titleRef.value = title;
        descriptionRef.value = description;
        linksRef.value = links;
        mandatoryFilesRef.value = mandatoryFiles;
        optionalFilesRef.value = optionalFiles;
      } catch (e) {
        console.error(e);
      }
    });

    const saveChanges = async () => {
      awaiting.value = true;

      const fd = new FormData();

      mandatoryFilesUpload.value.forEach((file: File) => fd.append('mandatory', file));
      optionalFilesUpload.value.forEach((file: File) => fd.append('optional', file));

      fd.append(
        'projectData',
        JSON.stringify({
          description: descriptionRef.value,
          links: linksRef.value,
        }),
      );

      try {
        await axios.put(`/api/student-project/${mainStore.state.project.id}`, fd, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        await fetch;
      } catch (e) {
        console.error(e);
      }

      awaiting.value = false;
    };

    return {
      displayName: mainStore.state.user.displayName,
      profilePicture: mainStore.state.user.profilePicture,
      // @ts-ignore
      year: new Date(mainStore.state.user.currentYear._seconds * 1000).getFullYear(),
      projectId: mainStore.state.project.id,
      titleRef,
      descriptionRef,
      linksRef,
      mandatoryFilesRef,
      optionalFilesRef,
      mandatoryFilesUpload,
      optionalFilesUpload,
      saveChanges,
      awaiting,
    };
  },
});
</script>

<style lang="sass" src="./my-project.sass" scoped />
