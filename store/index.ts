import { createStore } from 'pinia';

export const useMainStore = createStore({
  id: 'main',
  state: () => ({
    loggedIn: false,
    displayName: '',
    profilePicture: '',
    student: '',
    verified: false,
    admin: false,
    class: '',
    year: 0,
  }),
  getters: {
    isLoggedIn: (state) => state.loggedIn,
  },
});
