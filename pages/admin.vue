<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .flex.flex-col(class='lg:flex-row')
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentProjects', :maxCount='statistics.currentMaxStudents') Žáci kteří mají zadání
    ps-admin-stats(:loading='statsLoading', :currentCount='0', :maxCount='statistics.currentMaxStudents') Vložené práce
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentReviews', :maxCount='statistics.currentMaxReviews') Odevzdaná hodnocení
  .flex.justify-between.items-center.my-4
    span.flex-1.bg-ps-secondary lulw search nebo co
  ps-tabs.w-full(:tabs='["aktuální školní rok", "všechny práce", "externí učitelé"]', :selected='selectedTab', @selected='setTab', class='md:w-auto')
    ps-tab(:active='selectedTab == "aktuální školní rok"')
      span.text-ps-white.text-xl.mt-2 Aktuální školní rok
      ps-admin-project.mt-2(
        v-for='project in currentYearProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :projectTitle='project.projectTitle',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture'
      )
    ps-tab(:active='selectedTab == "všechny práce"')
      span.text-ps-white.text-xl.mt-2 Všechny práce
      ps-admin-project.mt-2(
        v-for='project in currentYearProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :projectTitle='project.projectTitle',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture'
      )
    ps-tab(:active='selectedTab == "externí učitelé"')
      .flex.flex-col
        ps-btn.self-end(@click='displayTeacherModal = !displayTeacherModal') založit účet
          template(#icon-right)
            plus-icon/
        ps-extern-teacher.mt-4(
          v-for='teacher in externTeachers',
          :key='teacher.teacherId',
          :teacherId='teacher.teacherId',
          :displayName='teacher.displayName',
          :profilePicture='teacher.profilePicture'
        )
        ps-modal(v-model='displayTeacherModal')
          span.text-lg.text-ps-white Založit účet
          .flex.flex-col
            ps-text-field.mt-8(v-model='displayName', type='text', label='Jméno', name='password')
            ps-text-field.mt-8(v-model='email', type='email', label='Email', name='email')
            ps-text-field.mt-8(v-model='password', type='text', label='Heslo', name='password')
            ps-btn.mt-8.self-end(@click='createTeacher', :disabled='teacherBtn', :loading='teacherBtn') vytvořit účet
  ps-snackbar(v-model='displaySnack', :delay='5000') {{ message }}
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'nuxt-composition-api';

import axios from 'axios';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import plusIcon from 'vue-material-design-icons/Plus.vue';

type Project = {
  projectId: String;
  currentYear: firebase.firestore.Timestamp;
  opponentId: String;
  publicProject: Boolean;
  reviews: [];
  studentId: String;
  submittedDate: firebase.firestore.Timestamp;
  teacherId: String;
  projectTitle: String;
  displayName: String;
  profilePicture: String;
};

type ExternTeacher = {
  teacherId: String;
  displayName: String;
  profilePicture: String;
};

export default defineComponent({
  middleware: 'admin',
  components: {
    plusIcon,
  },
  setup() {
    const message = ref('');
    const displaySnack = ref(false);

    const statistics = ref({} as firebase.firestore.DocumentData | undefined);
    const statsLoading = ref(true);

    const currentSchoolYear = ref(firebase.firestore.Timestamp.prototype);

    const selectedTab = ref('aktuální školní rok');

    const setTab = (tab: string) => {
      selectedTab.value = tab;

      switch (selectedTab.value) {
        case 'aktuální školní rok': {
          window.onscroll = currentYearLazyLoading;
          break;
        }
        case 'všechny práce': {
          if (allProjects.value.length === 0) getAllProjects();
          window.onscroll = allLazyLoading;
          break;
        }
        case 'externí učitelé': {
          if (externTeachersListener === null) getExternTeachers();
          break;
        }
      }
    };

    const getUserDocs = async (projectDocs: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[]) => {
      if (projectDocs.length === 0) return;

      const studentIds = projectDocs.map((project) => project.data()?.studentId);

      return (await firebase.firestore().collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', studentIds).get()).docs;
    };

    const currentYearProjects = ref([] as Array<Project>);
    let lastOfCurrent: any = null;

    onMounted(async () => {
      try {
        statistics.value = (await firebase.firestore().collection('system').doc('statistics').get()).data();
        currentSchoolYear.value = (await firebase.firestore().collection('system').doc('schoolYear').get()).data()?.currentYear;

        statsLoading.value = false;
      } catch (e) {
        console.error(e);
      }

      const projectDocs = (await firebase.firestore().collection('projects').orderBy('title', 'asc').where('currentYear', '==', currentSchoolYear.value).limit(10).get()).docs;

      const usersDocs = await getUserDocs(projectDocs);

      lastOfCurrent = projectDocs[projectDocs.length - 1];

      try {
        currentYearProjects.value = projectDocs.map((project) => {
          const userData = usersDocs?.find((user) => user.id === project.data()?.studentId)?.data();
          const projectData = project.data();

          return {
            projectId: project.id,
            currentYear: projectData?.currentYear,
            opponentId: projectData?.opponentId,
            publicProject: projectData?.public,
            reviews: projectData?.reviews,
            studentId: projectData?.studentId,
            submittedDate: projectData?.submittedDate,
            teacherId: projectData?.teacherId,
            projectTitle: projectData?.title,
            displayName: userData?.displayName,
            profilePicture: userData?.profilePicture,
          };
        });
      } catch (e) {}

      console.log(currentYearProjects.value);

      window.onscroll = currentYearLazyLoading;
    });

    const currentYearLazyLoading = async () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfCurrent) return;

      console.log('Bottom of current years projects');

      const projectDocs = (
        await firebase.firestore().collection('projects').orderBy('title', 'asc').where('currentYear', '==', currentSchoolYear.value).startAfter(lastOfCurrent).limit(10).get()
      ).docs;

      const usersDocs = await getUserDocs(projectDocs);

      lastOfCurrent = projectDocs[projectDocs.length - 1];

      currentYearProjects.value.push(
        ...projectDocs.map((project) => {
          const userData = usersDocs?.find((user) => user.id === project.data()?.studentId)?.data();
          const projectData = project.data();

          return {
            projectId: project.id,
            currentYear: projectData?.currentYear,
            opponentId: projectData?.opponentId,
            publicProject: projectData?.public,
            reviews: projectData?.reviews,
            studentId: projectData?.studentId,
            submittedDate: projectData?.submittedDate,
            teacherId: projectData?.teacherId,
            projectTitle: projectData?.title,
            displayName: userData?.displayName,
            profilePicture: userData?.profilePicture,
          };
        }),
      );
    };

    // All projects
    const allProjects = ref([] as Array<Project>);
    let lastOfAll: any = null;

    const getAllProjects = async () => {
      const projectDocs = (await firebase.firestore().collection('projects').orderBy('currentYear', 'desc').limit(10).get()).docs;

      const usersDocs = await getUserDocs(projectDocs);

      lastOfAll = projectDocs[projectDocs.length - 1];

      try {
        allProjects.value = projectDocs.map((project) => {
          const userData = usersDocs?.find((user) => user.id === project.data()?.studentId)?.data();
          const projectData = project.data();

          return {
            projectId: project.id,
            currentYear: projectData?.currentYear,
            opponentId: projectData?.opponentId,
            publicProject: projectData?.public,
            reviews: projectData?.reviews,
            studentId: projectData?.studentId,
            submittedDate: projectData?.submittedDate,
            teacherId: projectData?.teacherId,
            projectTitle: projectData?.title,
            displayName: userData?.displayName,
            profilePicture: userData?.profilePicture,
          };
        });
      } catch (e) {
        console.error(e);
      }
    };

    const allLazyLoading = async () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfAll) return;

      console.log('Bottom of all projects');

      const projectDocs = (await firebase.firestore().collection('projects').orderBy('currentYear', 'desc').startAfter(lastOfAll).limit(10).get()).docs;

      const usersDocs = await getUserDocs(projectDocs);

      lastOfAll = projectDocs[projectDocs.length - 1];

      allProjects.value.push(
        ...projectDocs.map((project) => {
          const userData = usersDocs?.find((user) => user.id === project.data()?.studentId)?.data();
          const projectData = project.data();

          return {
            projectId: project.id,
            currentYear: projectData?.currentYear,
            opponentId: projectData?.opponentId,
            publicProject: projectData?.public,
            reviews: projectData?.reviews,
            studentId: projectData?.studentId,
            submittedDate: projectData?.submittedDate,
            teacherId: projectData?.teacherId,
            projectTitle: projectData?.title,
            displayName: userData?.displayName,
            profilePicture: userData?.profilePicture,
          };
        }),
      );
    };

    // Extern teachers view
    const externTeachers = ref([] as Array<ExternTeacher>);
    let externTeachersListener: (() => void) | null = null;

    const getExternTeachers = () => {
      try {
        externTeachersListener = firebase
          .firestore()
          .collection('users')
          .where('extern', '==', true)
          .onSnapshot((externTeachersSnap) => {
            externTeachers.value = externTeachersSnap.docs.map((externTeacher) => {
              return {
                teacherId: externTeacher.id,
                displayName: externTeacher.data()?.displayName,
                profilePicture: externTeacher.data()?.profilePicture,
              };
            });
          });
      } catch (e) {}
    };

    const email = ref('');
    const password = ref('');
    const displayName = ref('');

    const displayTeacherModal = ref(false);
    const teacherBtn = ref(false);

    const createTeacher = async () => {
      try {
        teacherBtn.value = true;

        await axios.put(
          '/api/teacher/create',
          { email: email.value, password: password.value, displayName: displayName.value },
          {
            headers: {
              Authorization: `Bearer ${await firebase.auth().currentUser?.getIdToken()}`,
            },
          },
        );

        message.value = 'Účet učitele vytvořen';
        displaySnack.value = true;

        displayTeacherModal.value = false;
      } catch (e) {
        console.log(e);

        switch (e.response.data.code) {
          case 'auth/email-already-exists': {
            message.value = 'Email už je využíván';
            break;
          }
          case 'auth/invalid-password': {
            message.value = 'Heslo musí mít alespoň 6 znaků';
            break;
          }
          default: {
            message.value = 'Chyba při vytváření účtu';
            break;
          }
        }

        displaySnack.value = true;
      }
      teacherBtn.value = false;
    };

    return {
      message,
      displaySnack,
      selectedTab,
      setTab,
      statistics,
      statsLoading,
      externTeachers,
      displayTeacherModal,
      email,
      password,
      createTeacher,
      displayName,
      teacherBtn,
      allProjects,
      currentYearProjects,
    };
  },
});
</script>
