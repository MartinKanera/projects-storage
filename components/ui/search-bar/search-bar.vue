<template lang="pug">
input(type='text', @input='onChange($event.target.value)', placeholder='Zační psát...')
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

export default defineComponent({
  setup(_, { emit }) {
    const onChange = (value: string) => {
      // Emit keywords
      emit('input', value);
    };

    return {
      onChange,
    };
  },
});
</script>

<style lang="sass" src="./search-bar.sass" scoped />
