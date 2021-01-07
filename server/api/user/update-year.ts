import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    const yearTolerance = 4;
    const year = req.body?.year;

    if (!year && year <= new Date().getFullYear() + yearTolerance) return res.status(400).send('Missing parameters');

    const currentYearTimestamp = admin.firestore.Timestamp.fromDate(new Date(Date.UTC(year, 4, 25)));

    try {
      await admin.firestore().collection('users').doc(user.uid).update({
        currentYear: currentYearTimestamp,
      });

      return res.status(200).send(currentYearTimestamp);
    } catch (e) {
      return res.status(500).send(e);
    }
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }
};
