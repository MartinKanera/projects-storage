<template lang="pug">
.select-wrap.relative
  select(:class='{ loading: loading }', @change='onSelectValue($event)', :disabled='options.length === 0')
    option(v-if='!options.length > 0') Nic k dispozici
    option(v-else-if='placeholderValue && !options.some((option) => option.value === value)', selected='selected') {{ placeholderValue }}
    option(v-for='option in options', :value='option.value', :selected='value === option.value') {{ option.placeholder }}
  .loader-wrap(v-if='loading')
    img.ml-4.animate-spin(src='/loader.svg', width='20')
    span.ml-2 Načítaní
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: {
      type: String,
      default: '',
    },
    placeholder: {
      default: '',
      type: String,
    },
    options: {
      default: () => {
        return [];
      },
      type: Array,
    },
    loading: {
      default: false,
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    const { placeholder, options } = toRefs(props);

    const placeholderValue = ref(props.placeholder);

    const onSelectValue = (event: any) => {
      placeholderValue.value = '';

      emit('input', event.target.value);
    };

    watch(options, (_) => {
      placeholderValue.value = placeholder.value;
    });

    return {
      onSelectValue,
      placeholderValue,
    };
  },
});
</script>

<style lang="sass" src="./select.sass" scoped />
