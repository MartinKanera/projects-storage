import { Request, Response } from 'express';

import admin from 'firebase-admin';
import 'firebase/auth';

export default async (req: Request, res: Response) => {
  const userId = req.headers.authorization ?? '';

  try {
    await admin.auth().getUser(userId);

    if ((await admin.firestore().collection('proposals').where('studentId', '==', userId).get()).docs.length === 1) {
      return res.status(202).send({ message: 'Proposal already submitted', status: 202 });
    }
  } catch (e) {
    return res.status(401).send();
  }

  const teachersData = (await admin.firestore().collection('users').where('student', '==', false).get()).docs;

  const teachersList = teachersData.map((teacherDoc) => {
    return {
      placeholder: teacherDoc.data().displayName,
      value: teacherDoc.id,
    };
  });

  return res.status(200).json(teachersList);
};
