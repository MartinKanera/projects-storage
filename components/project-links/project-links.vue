<template lang="pug">
.project-links(v-if='editableValue.length > 0 || editable')
  .flex.items-center.justify-between
    span.text-ps-green.text-lg Externí odkazy
    ps-btn.rounded-full(v-if='editable', text)
      add-icon.text-ps-white(@click='openModal')/
  .flex.flex-col
    draggable(v-model='editableValue', handle='.handle')
      .flex.items-center.text-ps-white(v-for='(link, index) in editableValue', :key='index')
        drag-icon.handle(v-if='editable')
        .flex.w-full.justify-between.items-center
          a.break-all(:href='link.url', target='_blank') {{ link.placeholder }}
          ps-btn.rounded-full(v-if='editable', text) 
            bin-icon.text-ps-white(@click='removeLink(index)', :size='20')/
  ps-modal(v-model='linksModal')
    .flex.flex-col.flex-wrap
      span.text-2xl.text-ps-white Přidat odkaz
      ps-text-field.mt-8(v-model='placeholder', label='Text zobrazení')
      ps-text-field.mt-8(v-model='url', label='Url odkaz')
      ps-btn.mt-4.self-end(@click='addLink') přidat
</template>

<script lang="ts">
import { defineComponent, ref, unref, watch } from '@nuxtjs/composition-api';

import addIcon from 'vue-material-design-icons/Plus.vue';
import binIcon from 'vue-material-design-icons/Delete.vue';
import dragIcon from 'vue-material-design-icons/DragVertical.vue';

import draggable from 'vuedraggable';

type Link = {
  url: String;
  placeholder: String;
};

export default defineComponent({
  components: {
    addIcon,
    binIcon,
    dragIcon,
    draggable,
  },
  props: {
    value: {
      type: Array,
      default: () => [] as Array<Link>,
    },
    editable: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { emit }) {
    const editableValue = ref(unref(props.value));

    watch(editableValue, (newLinks) => {
      emit('input', newLinks);
    });

    watch(props, (newProps) => {
      // @ts-ignore
      editableValue.value = newProps.value;
    });

    const removeLink = (index: number) => {
      editableValue.value.splice(index, 1);
      emit('input', editableValue.value);
    };

    const linksModal = ref(false);

    const openModal = () => (linksModal.value = true);

    const placeholder = ref('');
    const url = ref('');

    const addLink = () => {
      const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
      if (placeholder.value === '' || !url.value.match(regex)) return;

      editableValue.value.push({ placeholder: placeholder.value, url: url.value });
      placeholder.value = '';
      url.value = '';
      emit('input', editableValue.value);
      linksModal.value = false;
    };

    return {
      editableValue,
      removeLink,
      linksModal,
      placeholder,
      url,
      addLink,
      openModal,
    };
  },
});
</script>

<style lang="sass" src="./project-links.sass" scoped />
