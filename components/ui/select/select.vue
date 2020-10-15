<template lang="pug">
select(@change='onSelectValue($event)')
  option(v-if='placeholder') {{ placeholder }}
  option(v-for='option in options', :value='option.value') {{ option.placeholder }}
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

export default defineComponent({
  props: {
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
  },
  setup(_, { emit }) {
    const onSelectValue = (event: any) => {
      emit('input', event.target.value);
    };

    return {
      onSelectValue,
    };
  },
});
</script>

<style lang="sass" src="./select.sass" scoped />
