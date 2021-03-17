<template lang="pug">
.h-auto.m-4(class='md:m-12')
  ps-loader(:value='loading')
  .flex.flex-col.justify-between.items-stretch(class='lg:flex-row-reverse lg:items-start')
    .my-project-user
      .user-info
        img.profile-picture(:src='project.studentProfilePicture', width='52')
        .flex.flex-col
          .display-name {{ project.studentDisplayName }}
          .text-ps-green.text-sm {{ project.currentYear }}
      ps-reviews-list.mt-2(v-if='!loading', :projectId='project.id')
    .my-project-info
      .title {{ project.title }}
      ps-text-area.mt-2(v-model='project.description', placeholder='Popis projektu', name='project-description', :readonly='true')
      ps-project-links.mt-2(v-model='project.links', :editable='false')
      .subtitle.mt-2(v-if='!!project.mandatoryFiles.length') Povinné soubory
      .row(v-for='file in project.mandatoryFiles')
        a.flex.items-center(:href='file.url', target='_blank') 
          word-icon(v-if='file.extension == "docx"')
          pdf-icon(v-else-if='file.extension == "pdf"')
          zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
          file-icon(v-else)
          .ml-2.underline {{ file.fileName }}
      .subtitle.mt-2(v-if='!!project.optionalFiles.length') Další soubory
      .row(v-for='file in project.optionalFiles')
        a.flex.items-center(:href='file.url', target='_blank')
          word-icon(v-if='file.extension == "docx"')
          pdf-icon(v-else-if='file.extension == "pdf"')
          zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
          image-icon(v-else-if='file.extension == "jpg" || file.extension == "jpeg" || file.extension == "png" || file.extension == "gif"')
          file-icon(v-else)
          .ml-2.underline {{ file.fileName }}
      ps-chips.mt-2(v-model='project.keywords', :edittable='false', placeholder='Klíčová slova')
</template>

<script lang="ts">
import { defineComponent, useContext, ref, useMeta, useFetch, ssrRef } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';

import firebase from 'firebase/app';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';
import wordIcon from 'vue-material-design-icons/FileWord.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import zipIcon from 'vue-material-design-icons/ZipBox.vue';
import imageIcon from 'vue-material-design-icons/Image.vue';
import fileIcon from 'vue-material-design-icons/File.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

type File = {
  url: String;
  fileName: String;
  extension: String;
};

export default defineComponent({
  components: {
    chevronRight,
    wordIcon,
    zipIcon,
    pdfIcon,
    imageIcon,
    fileIcon,
    binIcon,
  },
  validate: async (ctx) => {
    const store = useMainStore();

    try {
      await ctx.app.$axios.get(`/api/project/${ctx.params.url}`, {
        headers: {
          Authorization: `Bearer ${store.state.user.idToken}`,
        },
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  setup() {
    const mainStore = useMainStore();
    const ctx = useContext();
    const meta = useMeta();

    const loading = ref(true);

    const getExtensions = (files: Array<any>) => {
      if (!files) return [];

      return files.map((file) => {
        const splittedName = file.fileName.split('.');

        return {
          ...file,
          extension: splittedName[splittedName.length - 1].toLowerCase(),
        };
      });
    };

    const project = ssrRef({
      id: '',
      title: '',
      description: '',
      links: [],
      currentYear: 0,
      mandatoryFiles: [] as Array<File>,
      optionalFiles: [] as Array<File>,
      studentProfilePicture: '',
      studentDisplayName: '',
      keywords: [],
    });

    const setMeta = () => {
      meta.title.value = `Projekt - ${project.value.title}`;
      meta.meta.value = [
        {
          hid: 'title',
          property: 'title',
          content: project.value.title,
        },
        {
          hid: 'description',
          property: 'description',
          content: project.value.description,
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: project.value.title,
        },
        {
          hid: 'og:description',
          property: 'og:description',
          content: project.value.description,
        },
        {
          hid: 'keywords',
          property: 'keywords',
          content: project.value.keywords.join(', '),
        },
      ];
    };

    useFetch(async () => {
      try {
        const response = await ctx.app.$axios.get(`/api/project/${ctx.params.value.url}`, {
          headers: {
            Authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        const { id, title, description, links, currentYear, mandatoryFiles, optionalFiles, studentProfilePicture, studentDisplayName, keywords } = response.data;

        project.value.id = id;
        project.value.title = title;
        project.value.description = description;
        project.value.links = links;
        project.value.currentYear = new firebase.firestore.Timestamp(currentYear._seconds, 0).toDate().getFullYear();
        project.value.mandatoryFiles = getExtensions(mandatoryFiles);
        project.value.optionalFiles = getExtensions(optionalFiles);
        project.value.studentProfilePicture = studentProfilePicture;
        project.value.studentDisplayName = studentDisplayName;
        project.value.keywords = keywords;

        setMeta();

        loading.value = false;
      } catch (e) {
        console.error(e);
      }
    });

    if (process.client) setMeta();

    return {
      loading,
      project,
    };
  },
  head: {},
});
</script>

<style lang="sass" scoped>
.title
  @apply text-2xl text-ps-white

.my-project-info
  @apply bg-ps-secondary shadow rounded-lg p-4
  @apply mt-6
  @apply flex flex-col

  flex: 0 1 100%

  @screen lg
    @apply m-0

    flex: 0 1 66%
    max-width: 66%

  .subtitle
    @apply text-ps-green text-lg

  .row
    @apply text-ps-white flex items-center justify-between

.my-project-user
  @apply bg-ps-secondary shadow rounded-lg p-2
  @apply flex flex-col
  @apply p-4

  flex: 0 1 33%

  .user-info
    @apply flex items-center
    @apply leading-5

    .profile-picture
      @apply rounded-full mr-2
      @apply border-solid border-2 border-ps-green

    .display-name
      @apply text-ps-white text-lg
</style>
