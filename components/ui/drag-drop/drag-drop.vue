<template lang="pug">
.drag-drop(@dragover.prevent, @drop.prevent, @drop='handleFileDrop', :class='{ tile: tile }')
  .list-wrap(:class='{ "mt-2": files.length > 0 }')
    .text-ps-white.flex.mt-2(v-for='file in files')
      word-icon(v-if='file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"')
      zip-icon(v-else-if='file.type == "application/x-zip-compressed"')
      pdf-icon(v-else-if='file.type == "application/pdf"')
      image-icon(v-else-if='file.type.split("/")[0] == "image"')
      file-icon(v-else)
      span.ml-2 {{ file.name }}
  .input-wrap
    ps-btn(@click='btnTrigger') Vyber soubory
    span.ml-3.text-ps-white nebo je sem přetáhni
    input#chooseFiles(type='file', name='file-input', :multiple='multiple', @change='handleFileInput', style='display: none')
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'nuxt-composition-api';

import wordIcon from 'vue-material-design-icons/FileWord.vue';
import zipIcon from 'vue-material-design-icons/ZipBox.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import imageIcon from 'vue-material-design-icons/Image.vue';
import fileIcon from 'vue-material-design-icons/File.vue';

export default defineComponent({
  components: {
    wordIcon,
    zipIcon,
    pdfIcon,
    imageIcon,
    fileIcon,
  },
  props: {
    value: {
      default: () => [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    tile: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const files = ref([]);

    const btnTrigger = () => {
      document.getElementById('chooseFiles')?.click();
    };

    const handleFileDrop = (e: any) => {
      const droppedFiles = e.dataTransfer.files;

      if (!droppedFiles) return;

      if (!props.multiple) {
        files.value = [];
        // @ts-ignore
        files.value.push(droppedFiles[0]);
        return;
      }

      [...droppedFiles].forEach((file) => {
        // @ts-ignore
        files.value.push(file);
      });
    };

    const handleFileInput = (e: any) => {
      const currentFiles = e.target.files;

      if (!currentFiles) return;

      if (!props.multiple) {
        files.value = [];
        // @ts-ignore
        files.value.push(currentFiles[0]);
        return;
      }

      [...currentFiles].forEach((file) => {
        // @ts-ignore
        files.value.push(file);
      });
    };

    watch(files, (files) => {
      emit('input', files);
    });

    return {
      files,
      btnTrigger,
      handleFileDrop,
      handleFileInput,
    };
  },
});
</script>

<style lang="sass" src="./drag-drop.sass" scoped />
