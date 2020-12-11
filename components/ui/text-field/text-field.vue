<template lang="pug">
.text-field
  input.input(:type='type', placeholder=' ', :name='name', @input='$emit("input", $event.target.value)', :value='value')
  label.label(:for='name')
    span.text {{ label }}
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    name: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="sass" src="./text-field.sass" scoped />
