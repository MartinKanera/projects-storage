import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[0] ?? '';
  const projectId = req.params?.id;

  if (!projectId) return res.status(400).send();

  let userAuth: admin.auth.DecodedIdToken;

  try {
    userAuth = await admin.auth().verifyIdToken(idToken);
  } catch (_) {
    return res.status(401).send();
  }

  const projectRef = admin.firestore().collection('projects').doc(projectId);
  const systemRef = admin.firestore().collection('system');

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const projectDoc = await transaction.get(projectRef);

      if (!projectDoc.exists) throw new Error('404');
      if (!projectDoc.data()?.submitted) throw new Error('412');

      const userDoc = await transaction.get(admin.firestore().collection('users').doc(userAuth.uid));

      if (!userDoc.data()?.admin) throw new Error('403');

      const systemInfoDoc = await transaction.get(systemRef.doc('schoolYear'));
      const statisticsDoc = await transaction.get(systemRef.doc('statistics'));

      transaction.update(projectRef, {
        submitted: false,
        submittedDate: null,
      });

      if (projectDoc.data()?.currentYear.isEqual(systemInfoDoc.data()?.currentYear)) {
        const newSubmittedProjects = (statisticsDoc.data()?.currentSubmittedProjects ?? 0) - 1;

        transaction.update(systemRef.doc('statistics'), {
          currentSubmittedProjects: newSubmittedProjects,
        });
      }

      transaction.set(admin.firestore().collection('notifications').doc(), {
        userId: projectDoc.data()?.studentId,
        message: 'Projekt byl vrácen',
      });

      return transaction;
    });

    return res.status(200).send();
  } catch (e) {
    switch (e.toString()) {
      case 'Error: 403':
        return res.status(403).send('You are not an admin');
      case 'Error: 404':
        return res.status(404).send('Project does not exist');
      case 'Error: 412':
        return res.status(412).send('Project has to be submitted first');
      default:
        return res.status(500).send(e);
    }
  }
};
