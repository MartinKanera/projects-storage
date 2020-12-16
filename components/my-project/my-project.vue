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
      .subtitle.mt-2 Povinné soubory
      span.mb-1.text-ps-white.text-sm Dokumentace (docx, PDF), Projekt (zip/rar)
      ps-drag-drop(v-model='mandatoryFilesUpload', tile, multiple, accept='.pdf,.docx,.zip,.rar')
      .subtitle Nahrané povinné soubory:
      .row(v-for='file in mandatoryFilesRef')
        a.flex.items-center(:href='file.url', target='_blank') 
          word-icon(v-if='file.extension == "docx"')
          pdf-icon(v-else-if='file.extension == "pdf"')
          zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
          file-icon(v-else)
          .ml-2.underline {{ file.fileName }}
        ps-btn(text, @click='removeFile(file.filePath)', :disabled='removing', :loading='removing')
          bin-icon(:size='20')
      .subtitle.mt-2 Soubory navíc
      ps-drag-drop#optionalSelect(v-model='optionalFilesUpload', tile, multiple)
      .subtitle Nahrané soubory navíc:
      .row(v-for='file in optionalFilesRef')
        a.flex.items-center(:href='file.url', target='_blank')
          word-icon(v-if='file.extension == "docx"')
          pdf-icon(v-else-if='file.extension == "pdf"')
          zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
          image-icon(v-else-if='file.extension == "jpg" || file.extension == "jpeg" || file.extension == "png" || file.extension == "gif"')
          file-icon(v-else)
          .ml-2.underline {{ file.fileName }}
        ps-btn(text, @click='removeFile(file.filePath)', :disabled='removing', :loading='removing')
          bin-icon(:size='20')
  .mt-8.w-full.flex.flex.justify-center
    ps-btn.mr-4(@click='saveChanges', :disabled='awaiting', :loading='awaiting') Uložit
    ps-btn.ml-4(@click='checkModal', :disabled='awaiting', :loading='awaiting') Odevzdat
      template(#icon-right)
        chevron-right/
  ps-modal(v-model='submitCheck')
    ps-btn(@click='submitProject')
  ps-snackbar(v-model='snackbar') {{ message }}
</template>

<script lang="ts">
import { defineComponent, ref, useFetch } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';
import axios from 'axios';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';
import wordIcon from 'vue-material-design-icons/FileWord.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import zipIcon from 'vue-material-design-icons/ZipBox.vue';
import imageIcon from 'vue-material-design-icons/Image.vue';
import fileIcon from 'vue-material-design-icons/File.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

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
  setup(_, { root }) {
    const mainStore = useMainStore();

    const snackbar = ref(false);
    const message = ref('');
    const awaiting = ref(false);

    const titleRef = ref('');
    const descriptionRef = ref('');
    const linksRef = ref([]);
    const mandatoryFilesRef = ref([]);
    const optionalFilesRef = ref([]);
    const submittedRef = ref(false);

    const mandatoryFilesUpload = ref([]);
    const optionalFilesUpload = ref([]);

    const getExtensions = (files: Array<any>) => {
      return files.map((file) => {
        const splittedName = file.fileName.split('.');

        return {
          ...file,
          extension: splittedName[splittedName.length - 1].toLowerCase(),
        };
      });
    };

    const { fetch } = useFetch(async () => {
      try {
        // @ts-ignore
        const response = await root.$nuxt.$axios.get(`/api/project/${mainStore.state.project.id}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        const { title, description, links, mandatoryFiles, optionalFiles, submitted } = response.data;

        titleRef.value = title;
        descriptionRef.value = description;
        linksRef.value = links;
        // @ts-ignore
        mandatoryFilesRef.value = getExtensions(mandatoryFiles);
        // @ts-ignore
        optionalFilesRef.value = getExtensions(optionalFiles);
        submittedRef.value = submitted;
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
      } catch (e) {
        console.error(e);
      }

      setTimeout(async () => {
        await fetch();

        mandatoryFilesUpload.value = [];
        optionalFilesUpload.value = [];

        snackbar.value = true;
        message.value = 'Projekt aktualizován';

        awaiting.value = false;
      }, 5000);
    };

    const removing = ref(false);

    const removeFile = async (filePath: string) => {
      removing.value = true;

      try {
        await axios.delete(`/api/project-file/${filePath}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        await fetch();
      } catch (e) {}

      removing.value = false;
    };

    const submitCheck = ref(false);

    const checkModal = () => (submitCheck.value = !submitCheck.value);

    const submitProject = async () => {
      awaiting.value = true;

      try {
        await axios.post(`/api/project/${mainStore.state.project.id}`, _, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        snackbar.value = true;
        message.value = 'Projekt odevzdán k hodnocení';
      } catch (e) {
        if (e.response.status === 412) {
          snackbar.value = true;
          message.value = 'Chybí ti povinné soubory';
        }
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
      removeFile,
      removing,
      submitProject,
      snackbar,
      message,
      submitCheck,
      checkModal,
      submittedRef,
    };
  },
});
</script>

<style lang="sass" src="./my-project.sass" scoped />
