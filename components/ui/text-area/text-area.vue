<template lang="pug">
.text-area
  .text-area-info
    label.text-base.text-ps-green(:name='name') {{ placeholder }}
    .text-ps-white.text-sm(v-if='')
      span {{ areaLength }}/
      span.text-ps-green {{ maxLength }}
  textarea(:value='value', @input='areaInput', :placeholder='`${placeholder}...`', :name='name', :maxlength='maxLength')
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: {
      type: String,
      default: '',
    },
    cols: {
      type: Number,
      default: 50,
    },
    rows: {
      type: Number,
      default: 7,
    },
    placeholder: {
      type: String,
      default: 'Text area',
    },
    name: {
      type: String,
      default: '',
    },
    maxLength: {
      type: Number,
      default: 250,
    },
  },
  setup(props, { emit }) {
    const areaLength = ref(props.value.toString().length);

    watchEffect(() => {
      areaLength.value = props.value.toString().length;
    });

    const areaInput = (e: any) => {
      const newValue = e.target.value;
      if (newValue.length > props.maxLength) return;

      emit('input', newValue);
    };

    return {
      areaLength,
      areaInput,
    };
  },
});
</script>

<style lang="sass" src="./text-area.sass" scoped />
