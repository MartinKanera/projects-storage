<template lang="pug">
.wrapper
  .placeholder {{ placeholder }}
  .chip-container
    .chip(v-for='(chip, index) in chips', :key='index', :class='{ edittable: edittable }')
      span {{ chip }}
      .btn-wrap
        .close-btn(v-if='edittable', @click='removeChip(index)')
          closeIcon(:size='18')/
    input(v-if='edittable', v-model='currentInput', @keydown.enter='addChip', @keydown.tab.prevent='addChip', @keydown.delete='backspaceRemove')
  .mt-1.text-sm.text-ps-white.ml-auto.float-right(v-if='edittable') Klíčové slovo potvrdíš tabem/enterem
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@nuxtjs/composition-api';
import closeIcon from 'vue-material-design-icons/Close.vue';

export default defineComponent({
  components: {
    closeIcon,
  },
  props: {
    value: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    edittable: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { emit }) {
    watch(props, (newProps) => {
      chips.value = newProps.value;
    });

    const chips = ref(props.value);
    const currentInput = ref('');

    const removeChip = (index: number) => {
      chips.value.splice(index, 1);
      emit('input', chips.value);
    };

    const addChip = () => {
      const inputValue = currentInput.value.trim();
      if (inputValue === '') return;

      chips.value.push(inputValue);
      currentInput.value = '';
      emit('input', chips.value);
    };

    const backspaceRemove = () => {
      if (currentInput.value !== '') return;

      chips.value.pop();
      emit('input', chips.value);
    };

    return {
      chips,
      currentInput,
      removeChip,
      addChip,
      backspaceRemove,
    };
  },
});
</script>

<style lang="sass" src="./chips.sass" scoped />
