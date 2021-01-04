<template lang="pug">
.wrapper
  .placeholder {{ placeholder }}
  .chip-container
    .chip(v-for='(chip, index) in chips', :key='index')
      span {{ chip }}
      .close-btn(@click='removeChip(index)')
        closeIcon(:size='18')/
    input(v-model='currentInput', @keydown.enter='addChip', @keydown.delete='backspaceRemove')
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api';
import closeIcon from 'vue-material-design-icons/Close.vue';

export default defineComponent({
  components: {
    closeIcon,
  },
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  setup({ value }, { emit }) {
    const chips = ref(value);
    const currentInput = ref('');

    const removeChip = (index: number) => {
      chips.value.splice(index, 1);
      emit('input', chips.value);
    };

    const addChip = () => {
      if (currentInput.value === '') return;

      chips.value.push(currentInput.value);
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
