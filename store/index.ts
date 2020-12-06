import { createStore } from 'pinia';
import firebase from 'firebase/app';

type State = {
  user: {
    id: String;
    loggedIn: Boolean;
    displayName: String;
    profilePicture: String;
    student: Boolean;
    teacher: Boolean;
    admin: Boolean;
    currentYear: firebase.firestore.Timestamp | null;
    extern: Boolean;
  };
  project: {
    id: String;
  };
};

export const useMainStore = createStore({
  id: 'main',
  state: (): State => ({
    user: {
      id: '',
      loggedIn: false,
      displayName: '',
      profilePicture: '',
      student: false,
      teacher: false,
      admin: false,
      currentYear: null,
      extern: true,
    },
    project: {
      id: '',
    },
  }),
  getters: {
    isLoggedIn: (state: State) => state.user.loggedIn,
    displayName: (state: State) => state.user.displayName,
    profilePicture: (state: State) => state.user.profilePicture,
    isStudent: (state: State) => state.user.student,
    isTeacher: (state: State) => state.user.teacher,
    isAdmin: (state: State) => state.user.admin,
    projectId: (state: State) => state.project.id,
  },
});
