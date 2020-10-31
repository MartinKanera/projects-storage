<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.p-4(class='md:p-20')
  .self-start
    span.text-2xl.text-ps-white.font-medium Projekty ke schválení
  .flex.flex-col.mt-4.flex-wrap.justify-between(class='md:flex-row')
    ps-student-proposal(
      studentId='rtyui',
      displayName='Martin Kaněra',
      projectName='Úložiště maturitních projektů',
      profilePicture='https://storage.googleapis.com/ps-profile-pictures/pkMMgNKZQhVZcvflEUDOSCBYrNo1.jpeg'
    )
    ps-student-proposal(
      studentId='rtyui',
      displayName='Martin Kaněra',
      projectName='Úložiště maturitních projektů',
      profilePicture='https://storage.googleapis.com/ps-profile-pictures/pkMMgNKZQhVZcvflEUDOSCBYrNo1.jpeg'
    )
    ps-student-proposal(
      studentId='rtyui',
      displayName='Martin Kaněra',
      projectName='Úložiště maturitních projektů',
      profilePicture='https://storage.googleapis.com/ps-profile-pictures/pkMMgNKZQhVZcvflEUDOSCBYrNo1.jpeg'
    )
</template>

<script lang="ts">
import { defineComponent } from 'nuxt-composition-api';

export default defineComponent({
  middleware: 'teacher',
});
</script>
