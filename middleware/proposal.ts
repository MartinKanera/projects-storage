import { defineNuxtMiddleware } from '@nuxtjs/composition-api';
import { useMainStore } from '@/store';

export default defineNuxtMiddleware(({ redirect }) => {
  const mainStore = useMainStore();

  if (mainStore.projectId) return redirect('/myproject');
});
