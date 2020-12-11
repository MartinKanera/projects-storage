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
      ps-drag-drop(tile, multiple, accept='.pdf,.docx,.zip,.rar')
      span.text-ps-green Soubory navíc
      ps-drag-drop#optionalSelect(tile, multiple)
  .mt-8.w-full.flex.flex.justify-center
    ps-btn.mr-4 Uložit
    ps-btn.ml-4(@click='fetch') Odevzdat
      template(#icon-right)
        chevron-right/
</template>

<script lang="ts">
import { useMainStore } from '@/store';

import { defineComponent, ref, useFetch } from '@nuxtjs/composition-api';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  components: {
    chevronRight,
  },
  setup(_, { root }) {
    const mainStore = useMainStore();

    const titleRef = ref('');
    const descriptionRef = ref('');
    const linksRef = ref([]);
    const mandatoryFilesRef = ref([]);
    const optionalFilesRef = ref([]);

    const { fetch } = useFetch(async () => {
      linksRef.value = [];
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
        linksRef.value.push(...(links as []));
        mandatoryFilesRef.value = mandatoryFiles;
        optionalFilesRef.value = optionalFiles;
      } catch (e) {
        console.error(e);
      }
    });

    return {
      displayName: mainStore.state.user.displayName,
      profilePicture: mainStore.state.user.profilePicture,
      // @ts-ignore
      year: new Date(mainStore.state.user.currentYear._seconds * 1000).getFullYear(),
      projectId: mainStore.state.project.id,
      titleRef,
      descriptionRef,
      linksRef,
      fetch,
    };
  },
});
</script>

<style lang="sass" src="./my-project.sass" scoped />
