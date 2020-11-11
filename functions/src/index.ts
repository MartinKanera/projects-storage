/* eslint-disable vue/valid-v-text */
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

exports.projectsHooks = functions.firestore.document('projects/{projectId}').onWrite(async (snap, context) => {
  const statisticsRef = db.collection('system').doc('statistics');

  const runTransaction = async (difference: number) => {
    return await db.runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(statisticsRef);
  
      let projectsCount = sfDoc.data()?.currentProjects;

      if (!projectsCount) projectsCount = 0;
  
      transaction.set(statisticsRef, {
        currentProjects: projectsCount + difference,
      }, { merge: true });
  
      return transaction;
    });
  }

  if (!snap.before.data() && snap.after.data()) return await runTransaction(1);
  if (!snap.after.data()) return await runTransaction(-1);

  // TODO onUpdate check if new reviews came or project is submitted
  return;
});

exports.userHooks = functions.firestore.document('users/{userId}').onWrite(async (snap, context) => {
  const statisticsRef = db.collection('system').doc('statistics');

  const runTransaction = async (difference: number) => {
    return await db.runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(statisticsRef);
  
      let usersCount = sfDoc.data()?.currentMaxStudents;

      if (!usersCount) usersCount = 0;

      functions.logger.debug(usersCount + difference);
  
      transaction.set(statisticsRef, {
        currentMaxStudents: usersCount + difference,
      }, { merge: true });
  
      return transaction;
    });
  }

  // Delete
  if (!snap.after.data() && snap.before.data()?.student) return await runTransaction(-1);
  // Update
  if (snap.before.data() && snap.after.data()) {
    // users currentYear changed
    if (snap.before.data()?.currentYear !== snap.after.data()?.currentYear) {
      const currentSchoolYear: admin.firestore.Timestamp = (await db.collection('system').doc('schoolYear').get()).data()?.currentYear;
      
      if (currentSchoolYear.isEqual(snap.after.data()?.currentYear)) return await runTransaction(1);

      if (!currentSchoolYear.isEqual(snap.after.data()?.currentYear)) return await runTransaction(-1)
    }
  };

  return;
});

// TODO Yearly function set school currentSchoolYear, reset all system fields and update maxStudents count
exports.newSchoolYear = functions.pubsub.schedule('0 0 25 5 *').timeZone('Europe/Prague').onRun(async () => {
  // UTC+2
  const newSchoolYear = admin.firestore.Timestamp.fromDate(new Date(new Date().getFullYear(), 4, 24, 22));

  const statisticsRef = db.collection('system').doc('statistics');

  try {
    await db.collection('system').doc('schoolYear').set({
      currentYear: newSchoolYear,
    });

    // TODO add properties for reviews and submitted projects
    await statisticsRef.set({
      currentMaxStudents: 0,
      currentProjects: 0,
    }, { merge: true })
  } catch (_) {};

  const newCurrentUsers = db.collection('users').where('currentYear', '==', newSchoolYear);

  return await db.runTransaction(async (transaction) => {
    const currentUsers = await transaction.get(newCurrentUsers);

    transaction.update(statisticsRef, { 
      currentMaxStudents: currentUsers.docs.length
    });

    return transaction;
  });
});
