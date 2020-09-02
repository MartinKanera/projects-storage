import { createStore } from 'pinia';

export const useMainStore = createStore({
  id: 'main',
  state: () => ({
    loggedIn: false,
  }),
  getters: {
    isLoggedIn: (state) => state.loggedIn,
  },
});
