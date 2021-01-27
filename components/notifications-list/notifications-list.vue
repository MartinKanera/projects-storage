<template lang="pug">
.notifications-list
  .notification(v-for='(notification, i) in notifications', :key='i')
    .message {{ notification.message }}
    .action
      close-icon(:size='18', @click='removeNotification(notification.id)')
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from '@nuxtjs/composition-api';

import firebase from 'firebase/app';
import 'firebase/firestore';

import closeIcon from 'vue-material-design-icons/Close.vue';

import { useMainStore } from '@/store';

type Notification = {
  id: string;
  message: string;
};

export default defineComponent({
  components: {
    closeIcon,
  },
  setup(_, { emit }) {
    const mainStore = useMainStore();
    const notifications = ref([] as Array<Notification>);
    let notificationListener = () => {};

    onMounted(() => {
      notificationListener = firebase
        .firestore()
        .collection('notifications')
        .where('userId', '==', mainStore.user.id)
        .onSnapshot((snapshot) => {
          emit('update-notifications', snapshot.docs.length);

          notifications.value = snapshot.docs.map((notification) => {
            return {
              id: notification.id,
              message: notification.data().message,
            };
          });
        });
    });

    const removeNotification = async (id: string) => {
      try {
        await firebase.firestore().collection('notifications').doc(id).delete();
      } catch (_) {}
    };

    onUnmounted(() => notificationListener());

    return {
      notifications,
      removeNotification,
    };
  },
});
</script>

<style lang="sass" src="./notifications-list.sass" scoped />
