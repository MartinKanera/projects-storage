import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const userId = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    await admin.auth().getUser(userId);
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  const yearTolerance = 4;
  const year = req.body?.year;

  if (!year && year <= year + yearTolerance) return res.status(400).send('Missing parameters');

  const currentYearTimestamp = admin.firestore.Timestamp.fromDate(new Date(year, 4, 25));

  try {
    await admin.firestore().collection('users').doc(userId).update({
      currentYear: currentYearTimestamp,
    });

    return res.status(200).send(currentYearTimestamp);
  } catch (_) {}

  return res.status(500).send();
};
