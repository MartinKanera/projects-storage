<template lang="pug">
button.btn(v-ripple, :class='{ "btn-block": block, "btn-text": text, shadow: !text, disabled: disabled, loading: loading }', @click='$emit("click")', :disabled='disabled')
  .icon-left.mr-1(v-if='$slots["icon-left"]')
    slot(name='icon-left')
  .capitalize.flex-grow
    slot
  .spinner(v-if='loading')
  .icon-right.ml-1(v-if='$slots["icon-right"]')
    slot(name='icon-right')
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';
import ripple from '@/directives/ripple';

export default defineComponent({
  directives: { ripple },
  props: {
    block: {
      type: Boolean,
      default: false,
    },
    text: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="sass" src="./btn.sass" scoped />
