import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const updatedProject = req.body;

  if (!req.params.id) return res.status(401).send('Missing params');

  if (
    !(updatedProject.opponentId || updatedProject.public !== undefined || updatedProject.teacherId || updatedProject.title) &&
    typeof updatedProject.opponentId === 'string' &&
    typeof updatedProject.public === 'boolean' &&
    typeof updatedProject.teacherId === 'string' &&
    typeof updatedProject.title === 'string'
  )
    return res.status(401).send('Missing params');

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    if (!(await admin.firestore().collection('users').doc(user.uid).get()).data()?.admin) return res.status(403).send('Only accessible by admins');
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  const projectRef = admin.firestore().collection('projects').doc(req.params.id);

  try {
    // eslint-disable-next-line require-await
    await admin.firestore().runTransaction(async (transaction) => {
      transaction.update(projectRef, {
        opponentId: updatedProject.opponentId,
        public: updatedProject.public,
        teacherId: updatedProject.teacherId,
        title: updatedProject.title,
      });

      return transaction;
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e);
  }

  return res.status(200).send();
};
