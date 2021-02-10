<template lang="pug">
nuxt-link.public-project(:to='`/project/${url}`')
  .wrapper(@mouseover='hover = true', @mouseleave='hover = false')
    .title {{ title }}
    .info
      .year {{ year }}
      .author-name {{ displayName }}
    .description {{ description }}
    .forward(:class='{ "text-ps-mint": !hover, "bg-ps-mint": hover }')
      span Přejít na projekt
      chevronRight /
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api';
import chevronRight from 'vue-material-design-icons/ChevronRight.vue';

export default defineComponent({
  components: {
    chevronRight,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  setup() {
    const hover = ref(false);

    return {
      hover,
    };
  },
});
</script>

<style lang="sass" src="./public-project.sass" scoped />
