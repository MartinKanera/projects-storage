<template lang="pug">
.drag-drop(@dragover.prevent, @drop.prevent, @drop='handleFileDrop', :class='{ tile: tile }')
  .list-wrap.w-full.mb-4(:class='{ "mt-2": files.length > 0 }')
    .text-ps-white.flex.justify-between(v-for='file in files')
      .flex.items-center
        word-icon(v-if='file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"')
        pdf-icon(v-else-if='file.type == "application/pdf"')
        zip-icon(v-else-if='file.type == "application/x-zip-compressed"')
        image-icon(v-else-if='file.type.split("/")[0] == "image"')
        file-icon(v-else)
        span.ml-2 {{ file.name }}
      ps-btn.justify-self-end(text, @click='removeFile(file.name)')
        bin-icon(:size='20')
  .input-wrap
    ps-btn(@click='btnTrigger') Vyber soubory
    span.ml-3.text-ps-white nebo je sem přetáhni
    input(:id='id', type='file', name='file-input', :multiple='multiple', @change='handleFileInput', style='display: none', :accept='accept')
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@nuxtjs/composition-api';

import wordIcon from 'vue-material-design-icons/FileWord.vue';
import pdfIcon from 'vue-material-design-icons/PdfBox.vue';
import zipIcon from 'vue-material-design-icons/ZipBox.vue';
import imageIcon from 'vue-material-design-icons/Image.vue';
import fileIcon from 'vue-material-design-icons/File.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';

export default defineComponent({
  components: {
    wordIcon,
    zipIcon,
    pdfIcon,
    imageIcon,
    fileIcon,
    binIcon,
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
    accept: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    id: {
      type: String,
      default: 'chooseFiles',
    },
  },
  setup(props, { emit }) {
    const files = ref([]);

    const btnTrigger = () => {
      document.getElementById(props.id)?.click();
    };

    const extensions = props.accept.replace(/\./g, '').split(',');

    const checkType = (file: any) => {
      if (props.accept === '') return true;
      const fileNameSplitted = file.name.split('.');

      return extensions.some((extension) => extension === fileNameSplitted[fileNameSplitted.length - 1]);
    };

    const handleFileDrop = (e: any) => {
      const droppedFiles = e.dataTransfer.files;

      if (!droppedFiles || props.disabled) return;

      if (!props.multiple) {
        files.value = [];
        // @ts-ignore
        if (checkType(droppedFiles[0])) files.value.push(droppedFiles[0]);
        return;
      }

      [...droppedFiles].forEach((file) => {
        // @ts-ignore
        if (checkType(file)) files.value.push(file);
      });
    };

    const handleFileInput = (e: any) => {
      const currentFiles = e.target.files;

      if (!currentFiles || props.disabled) return;

      if (!props.multiple) {
        files.value = [];
        // @ts-ignore
        if (checkType(currentFiles[0])) files.value.push(currentFiles[0]);
        return;
      }

      [...currentFiles].forEach((file) => {
        // @ts-ignore
        if (checkType(file)) files.value.push(file);
      });
    };

    watch(files, (files) => {
      emit('input', files);
    });

    const removeFile = (fileName: string) => {
      // @ts-ignore
      files.value = files.value.filter((file) => file.name !== fileName);
    };

    return {
      files,
      btnTrigger,
      handleFileDrop,
      handleFileInput,
      removeFile,
    };
  },
});
</script>

<style lang="sass" src="./drag-drop.sass" scoped />
