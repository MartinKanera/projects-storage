import admin from 'firebase-admin';
import { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  if (!req.params.id) return res.status(400).send('Missing parameters');

  const proposalRef = admin.firestore().collection('proposals').doc(req.params.id);

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    const userData = (await admin.firestore().collection('users').doc(user.uid).get()).data();

    if (!(userData?.teacher || userData?.admin)) return res.status(403).send('Forbidden');
    if (userData?.teacher && !((await proposalRef.get()).data()?.teacherId === user.uid)) return res.status(403).send();
  } catch {
    return res.status(401).send('Unauthorized');
  }

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(proposalRef);

      const schoolYear = (await transaction.get(admin.firestore().collection('system').doc('schoolYear'))).data();

      const projectRef = admin.firestore().collection('projects').doc();

      transaction.set(projectRef, {
        title: sfDoc.data()?.title,
        titleLower: sfDoc.data()?.title.toLowerCase(),
        description: '',
        studentId: sfDoc.data()?.studentId,
        teacherId: sfDoc.data()?.teacherId,
        opponentId: '',
        currentYear: schoolYear?.currentYear,
        public: false,
        submitted: false,
        submittedDate: null,
        reviews: [],
        links: [],
        deadlineDate: null,
      });

      transaction.set(admin.firestore().collection('projectFiles').doc(), {
        projectId: projectRef.id,
        mandatory: [],
        optional: [],
      });

      transaction.delete(proposalRef);

      return transaction;
    });
  } catch (e) {
    return res.status(500).send(e);
  }

  return res.status(200).send('Proposal accepted');
};
