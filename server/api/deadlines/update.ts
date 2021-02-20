import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const timeNow = admin.firestore.Timestamp.now();

  let { projectDeadline, reviewDeadline } = req.body;

  try {
    projectDeadline = admin.firestore.Timestamp.fromDate(new Date(projectDeadline));
    reviewDeadline = admin.firestore.Timestamp.fromDate(new Date(reviewDeadline));
  } catch (_) {
    return res.status(400).send('Date poorly formatted');
  }

  // If provided timestamps are before time now
  if (timeNow > projectDeadline || timeNow > reviewDeadline) return res.status(400).send();

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const user = await transaction.get(admin.firestore().collection('users').doc(userAuth.uid));

        // Check if user is admin
        if (!user.data()?.admin) throw new Error('403');

        transaction.update(admin.firestore().collection('system').doc('schoolYear'), {
          projectDeadline,
          reviewDeadline,
        });

        return transaction;
      });

      return res.status(200).send();
    } catch (e) {
      switch (e.toString()) {
        case 'Error: 403':
          return res.status(403).send('Only admin can update deadlines');
        default:
          return res.status(500).send(e);
      }
    }
  } catch (_) {
    return res.status(401).send();
  }
};
