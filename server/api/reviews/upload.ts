import admin from 'firebase-admin';
import { Request, Response } from 'express';
import { storage } from '../../../gc-storage';

export default async (req: Request, res: Response) => {
  const userId = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    admin.auth().getUser(userId);
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  if (!(await admin.firestore().collection('users').doc(userId).get()).data()?.teacher) return res.status(403).send('Only teacher can upload reviews');

  // @ts-ignore
  if (!req.file || !req.body.projectId) return res.status(400).send('Missing parameters');

  // @ts-ignore
  const file = req.file;
  const projectId = req.body.projectId;

  // files.map((file: any) => {
  //   const splitName = file.originalname.split('.');
  //   file.customName = `${projectId}-${userId}.${splitName[splitName.length - 1]}`;

  //   return file;
  // });

  const splitName = file.originalname.split('.');
  file.customName = `${projectId}-${userId}.${splitName[splitName.length - 1]}`;

  const bucket = storage.bucket('ps-reviews');

  const blob = bucket.file(file.customName);

  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false,
  });

  blobStream.on('finish', async () => {
    const projectRef = admin.firestore().collection('projects').doc(projectId);

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const sfDoc = await transaction.get(projectRef);

        const reviews = sfDoc.data()?.reviews ?? [];

        const updatedReviews = reviews.filter((review: any) => review.teacherId !== userId);
        updatedReviews.push({
          fileName: file.originalname,
          fileUrl: `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
          teacherId: userId,
          uploaded: admin.firestore.Timestamp.now(),
        });

        transaction.set(
          projectRef,
          {
            reviews: updatedReviews,
          },
          { merge: true },
        );

        return transaction;
      });

      return res.send();
    } catch (e) {
      console.error(e);
    }
  });

  blobStream.on('error', () => {
    return res.status(500).send();
  });

  blobStream.end(file.buffer);

  // files.forEach((file: any) => {
  //   const blob = bucket.file(file.customName);

  //   const blobStream = blob.createWriteStream({
  //     metadata: {
  //       contentType: file.mimetype,
  //     },
  //   });

  //   blob.on('finish' => {})

  //   blobStream.end(file.buffer);
  // });
};
