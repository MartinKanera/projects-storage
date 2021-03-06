<template lang="pug">
.h-auto.m-4(class='md:mx-12')
  ps-loader(:value='loading')
  .flex.justify-center.mb-4(v-if='thisSchoolYearRef')
    .rounded-lg.shadow.bg-ps-secondary.flex.px-2
      .text-ps-white.mr-2 Termín odevzdání:
      .text-ps-green.text-lg {{ deadlineFormatted[deadlineFormatted.length - 1] === ":" ? deadlineFormatted.substr(0, deadlineFormatted.length - 1) : deadlineFormatted }}
  .flex.flex-col.justify-between.items-stretch(class='lg:flex-row-reverse lg:items-start')
    .my-project-user
      .user-info
        img.profile-picture(:src='profilePicture', width='52')
        .flex.flex-col
          .display-name {{ displayName }}
          .text-ps-green.text-sm {{ year }}
      ps-reviews-list.mt-2(:projectId='projectId')
    .my-project-info
      .title {{ titleRef }}
      ps-text-area.mt-2(v-model='descriptionRef', placeholder='Popis projektu', name='project-description', :readonly='!modificable')
      ps-project-links.mt-2(v-model='linksRef', :editable='modificable')
      .subtitle.mt-2(v-if='modificable') Povinné soubory
      span.mb-1.text-ps-white.text-sm(v-if='modificable') Dokumentace (docx, PDF), Projekt (zip/rar)
      ps-drag-drop(v-if='modificable', v-model='mandatoryFilesUpload', tile, multiple, accept='.pdf,.docx,.zip,.rar', :disabled='!modificable')
      .subtitle.mt-2(v-if='mandatoryFilesRef.length > 0') Nahrané povinné soubory
      draggable.mb-2(v-model='mandatoryFilesRef', handle='.handle')
        .row(v-for='file in mandatoryFilesRef')
          drag-icon.handle(v-if='modificable')
          .row-items
            a.flex.items-center(:href='file.url', target='_blank') 
              word-icon(v-if='file.extension == "docx"')
              pdf-icon(v-else-if='file.extension == "pdf"')
              zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
              file-icon(v-else)
              .ml-2.underline {{ file.fileName }}
            ps-btn(v-if='modificable', text, @click='removeFile(file.filePath)', :disabled='removing', :loading='removing')
              bin-icon(:size='20')
      .subtitle.mt-2(v-if='modificable') Další soubory
      ps-drag-drop#optionalSelect(v-if='modificable', v-model='optionalFilesUpload', tile, multiple, :disabled='!modificable')
      .subtitle(v-if='optionalFilesRef.length > 0') Další nahrané soubory
      draggable.mb-2(v-model='optionalFilesRef', handle='.handle')
        .row(v-for='file in optionalFilesRef')
          drag-icon.handle(v-if='modificable')
          .row-items
            a.flex.items-center(:href='file.url', target='_blank')
              word-icon(v-if='file.extension == "docx"')
              pdf-icon(v-else-if='file.extension == "pdf"')
              zip-icon(v-else-if='file.extension == "zip" || file.extension == "rar"')
              image-icon(v-else-if='file.extension == "jpg" || file.extension == "jpeg" || file.extension == "png" || file.extension == "gif"')
              file-icon(v-else)
              .ml-2.underline {{ file.fileName }}
            ps-btn(v-if='modificable', text, @click='removeFile(file.filePath)', :disabled='removing', :loading='removing')
              bin-icon(:size='20')
      ps-chips(v-model='keywordsRef', :edittable='modificable', placeholder='Klíčová slova')
  .mt-8.w-full.flex.flex.justify-center
    ps-btn.mr-4(@click='saveChanges', :disabled='awaiting || submittedRef || !modificable', :loading='awaiting') Uložit
    ps-btn.ml-4(@click='checkModal', :disabled='awaiting || submittedRef || !modificable || !thisSchoolYearRef', :loading='awaiting') Odevzdat
      template(#icon-right)
        chevron-right/
  ps-modal(v-model='submitCheck', :disabled='awaiting')
    .flex.flex-col
      .title Pokud odešleš projekt, nepůjde to vzít zpět!
      ps-btn.mt-4(@click='submitProject', :disabled='awaiting', :loading='awaiting') Odevzdat projekt
        template(#icon-right)
          chevron-right/
  ps-snackbar(v-model='snackbar', :delay='6000') {{ message }}
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';
import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/firestore';

import chevronRight from 'vue-material-design-icons/ChevronRight.vue';
import wordIcon from 'vue-material-design-icons/FileWord.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import zipIcon from 'vue-material-design-icons/ZipBox.vue';
import imageIcon from 'vue-material-design-icons/Image.vue';
import fileIcon from 'vue-material-design-icons/File.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';
import dragIcon from 'vue-material-design-icons/DragVertical.vue';

import draggable from 'vuedraggable';

export default defineComponent({
  components: {
    draggable,
    chevronRight,
    wordIcon,
    zipIcon,
    pdfIcon,
    imageIcon,
    fileIcon,
    binIcon,
    dragIcon,
  },
  setup() {
    const mainStore = useMainStore();

    const loading = ref(true);

    const snackbar = ref(false);
    const message = ref('');
    const awaiting = ref(false);

    const titleRef = ref('');
    const descriptionRef = ref('');
    const linksRef = ref([]);
    const mandatoryFilesRef = ref([]);
    const optionalFilesRef = ref([]);
    const submittedRef = ref(false);
    const deadlineDateRef = ref(new firebase.firestore.Timestamp(0, 0));
    const keywordsRef = ref([]);
    const thisSchoolYearRef = ref(false);

    const mandatoryFilesUpload = ref([]);
    const optionalFilesUpload = ref([]);

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

    const fetch = async () => {
      try {
        // @ts-ignore
        const response = await axios.get(`/api/project/${mainStore.state.project.url}`, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
          },
        });

        const { title, description, links, mandatoryFiles, optionalFiles, submitted, deadlineDate, keywords, thisSchoolYear } = response.data;

        titleRef.value = title;
        descriptionRef.value = description;
        linksRef.value = links;
        // @ts-ignore
        mandatoryFilesRef.value = getExtensions(mandatoryFiles);
        // @ts-ignore
        optionalFilesRef.value = getExtensions(optionalFiles);
        submittedRef.value = submitted;
        deadlineDateRef.value = deadlineDate == null ? new firebase.firestore.Timestamp(0, 0) : new firebase.firestore.Timestamp(deadlineDate._seconds, 0);
        keywordsRef.value = keywords;
        thisSchoolYearRef.value = thisSchoolYear;
      } catch (e) {
        console.error(e);
      }
    };

    onBeforeMount(async () => {
      await fetch();
      loading.value = false;
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
          keywords: keywordsRef.value,
          mandatoryOrder: mandatoryFilesRef.value.map((file: any) => {
            return {
              fileName: file.fileName,
              filePath: file.filePath,
              uploaded: file.uploaded,
            };
          }),
          optionalOrder: optionalFilesRef.value.map((file: any) => {
            return {
              fileName: file.fileName,
              filePath: file.filePath,
              uploaded: file.uploaded,
            };
          }),
        }),
      );

      try {
        await axios.put(`/api/student-project/${mainStore.state.project.id}`, fd, {
          headers: {
            authorization: `Bearer ${mainStore.state.user.idToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (mandatoryFilesUpload.value.length === 0 && optionalFilesUpload.value.length === 0) {
          await fetch();

          mandatoryFilesUpload.value = [];
          optionalFilesUpload.value = [];

          snackbar.value = true;
          message.value = 'Projekt aktualizován';

          awaiting.value = false;
        } else {
          setTimeout(async () => {
            await fetch();

            mandatoryFilesUpload.value = [];
            optionalFilesUpload.value = [];

            snackbar.value = true;
            message.value = 'Projekt aktualizován';

            awaiting.value = false;
          }, 5000);
        }
      } catch (e) {
        console.error(e);

        awaiting.value = false;
      }
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
      try {
        await saveChanges();
        awaiting.value = true;

        await axios.post(
          `/api/project/${mainStore.state.project.id}`,
          {},
          {
            headers: {
              authorization: `Bearer ${mainStore.state.user.idToken}`,
            },
          },
        );

        await fetch();

        snackbar.value = true;
        message.value = 'Projekt odevzdán k hodnocení';
      } catch (e) {
        console.error(e);
        if (e.response.status === 412) {
          snackbar.value = true;
          message.value = 'Chybí ti povinné soubory';
        } else {
          snackbar.value = true;
          message.value = 'Nastala chyba';
        }
      }

      checkModal();
      awaiting.value = false;
    };

    const deadlineFormatted = computed(() => `${deadlineDateRef.value.toDate().toLocaleDateString('cs-CZ')} ${deadlineDateRef.value.toDate().toLocaleTimeString('cs-CZ').substr(0, 5)}`);

    const modificable = computed(() => (!submittedRef.value && deadlineDateRef.value > firebase.firestore.Timestamp.now()) || !thisSchoolYearRef.value);

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
      deadlineFormatted,
      modificable,
      loading,
      keywordsRef,
      thisSchoolYearRef,
    };
  },
});
</script>

<style lang="sass" src="./my-project.sass" scoped />
