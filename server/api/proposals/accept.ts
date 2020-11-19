import admin from 'firebase-admin';
import { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const userId = req.headers.authorization?.split(' ')[1] ?? '';
  const proposalId = req.body.proposalId;

  try {
    await admin.auth().getUser(userId);
  } catch {
    return res.status(401).send('Unauthorized');
  }

  if (!proposalId) return res.status(400).send('Missing parameters');

  const userData = (await admin.firestore().collection('users').doc(userId).get()).data();

  if (!(userData?.teacher || userData?.admin)) return res.status(403).send('Forbidden');

  const proposalRef = admin.firestore().collection('proposals').doc(proposalId);

  if (userData?.teacher && !((await proposalRef.get()).data()?.teacherId === userId)) return res.status(403).send();

  await admin.firestore().runTransaction(async (transaction) => {
    try {
      const sfDoc = await transaction.get(proposalRef);

      const projectRef = admin.firestore().collection('projects').doc();

      // TODO probbably add files and links array + get default deadline from system collection (set by admin)

      transaction.set(projectRef, {
        title: sfDoc.data()?.title,
        description: '',
        studentId: sfDoc.data()?.studentId,
        teacherId: sfDoc.data()?.teacherId,
        opponentId: '',
        currentYear: userData?.currentYear,
        public: false,
        submittedDate: null,
      });

      transaction.delete(proposalRef);

      return transaction;
    } catch (_) {
      return res.status(500).send();
    }
  });

  return res.status(200).send('Proposal accepted');
};
