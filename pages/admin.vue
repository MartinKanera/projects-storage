<template lang="pug">
.min-h-screen.flex.flex-col.justify-center.m-4(class='md:m-20')
  .flex.flex-col(class='lg:flex-row')
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentProjects', :maxCount='statistics.currentMaxStudents') Žáci kteří mají zadání
    ps-admin-stats(:loading='statsLoading', :currentCount='0', :maxCount='statistics.currentMaxStudents') Vložené práce
    ps-admin-stats(:loading='statsLoading', :currentCount='statistics.currentReviews', :maxCount='statistics.currentMaxReviews') Odevzdaná hodnocení
  ps-tabs.mt-4.w-full(:tabs='["aktuální projekty", "ostatní projekty", "externí učitelé"]', :selected='selectedTab', @selected='setTab', class='md:w-auto')
    ps-tab(:active='selectedTab == "aktuální projekty"')
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
        :title='project.title',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture',
        :teachers='teachers'
      )
    ps-tab(:active='selectedTab == "ostatní projekty"')
      span.text-ps-white.text-xl.mt-2 Všechny práce
      ps-admin-project.mt-2(
        v-for='project in allProjects',
        :key='project.projectId',
        :projectId='project.projectId',
        :currentYear='project.currentYear',
        :opponentId='project.opponentId',
        :publicProject='project.publicProject',
        :reviews='project.reviews',
        :studentId='project.studentId',
        :submittedDate='project.submittedDate',
        :teacherId='project.teacherId',
        :title='project.title',
        :displayName='project.displayName',
        :profilePicture='project.profilePicture',
        :teachers='teachers'
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
  title: String;
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

    const selectedTab = ref('aktuální projekty');

    const setTab = (tab: string) => {
      selectedTab.value = tab;

      switch (selectedTab.value) {
        case 'aktuální projekty': {
          window.onscroll = currentYearLazyLoading;
          break;
        }
        case 'ostatní projekty': {
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

    const formatProjectArray = (projectDocs: any, userDocs: any) => {
      return projectDocs.map((project: any) => {
        const userData = userDocs?.find((user: any) => user.id === project.data()?.studentId)?.data();
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
          title: projectData?.title,
          displayName: userData?.displayName,
          profilePicture: userData?.profilePicture,
        };
      });
    };

    const teachers = ref([]);

    const currentYearProjects = ref([] as Array<Project>);
    const listeners = [];
    let lastOfCurrent: any = null;

    onMounted(async () => {
      try {
        statistics.value = (await firebase.firestore().collection('system').doc('statistics').get()).data();
        currentSchoolYear.value = (await firebase.firestore().collection('system').doc('schoolYear').get()).data()?.currentYear;

        // @ts-ignore
        teachers.value = (await firebase.firestore().collection('users').where('teacher', '==', true).get()).docs.map((teacher) => {
          return {
            value: teacher.id,
            placeholder: teacher.data()?.displayName,
            extern: teacher.data()?.extern,
          };
        });

        statsLoading.value = false;
      } catch (e) {
        console.error(e);
      }

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .orderBy(firebase.firestore.FieldPath.documentId(), 'asc')
          .where('currentYear', '==', currentSchoolYear.value)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfCurrent = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              currentYearProjects.value = currentYearProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              currentYearProjects.value.push(project);
            });

            window.onscroll = currentYearLazyLoading;
          }),
      );
    });

    const currentYearLazyLoading = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfCurrent) return;

      console.log('Bottom of current years projects');

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '==', currentSchoolYear.value)
          .startAfter(lastOfCurrent)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfCurrent = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              currentYearProjects.value = currentYearProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              currentYearProjects.value.push(project);
            });
          }),
      );
    };

    // Older projects
    const allProjects = ref([] as Array<Project>);
    let lastOfAll: any = null;

    const getAllProjects = () => {
      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '<', currentSchoolYear.value)
          .orderBy('currentYear', 'desc')
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfAll = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              allProjects.value = allProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              allProjects.value.push(project);
            });
          }),
      );
    };

    const allLazyLoading = () => {
      if (!(window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight) || !lastOfAll) return;

      console.log('Bottom of all projects');

      listeners.push(
        firebase
          .firestore()
          .collection('projects')
          .where('currentYear', '<', currentSchoolYear.value)
          .orderBy('currentYear', 'desc')
          .startAfter(lastOfAll)
          .limit(10)
          .onSnapshot(async (snapshots) => {
            const projectDocs = snapshots.docs;

            const usersDocs = await getUserDocs(projectDocs);

            lastOfAll = projectDocs[projectDocs.length - 1];

            const projects = formatProjectArray(projectDocs, usersDocs);

            projects.forEach((project: Project) => {
              allProjects.value = allProjects.value.filter((currentProject) => currentProject.projectId !== project.projectId);
              allProjects.value.push(project);
            });
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
          .where('deleted', '!=', true)
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

        email.value = '';
        password.value = '';
        displayName.value = '';

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
      teachers,
    };
  },
});
</script>
