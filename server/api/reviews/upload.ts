import admin from 'firebase-admin';
import { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const userId = req.headers.authorization?.split(' ')[1] ?? '';

  try {
    admin.auth().getUser(userId);
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  if (!(await admin.firestore().collection('users').doc(userId).get()).data()?.teacher) return res.status(403).send('Only teacher can upload reviews');

  // @ts-ignore
  if (!req.files || !req.body.projectId) return res.status(400).send('Missing parameters');

  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  // @ts-ignore
  for (const file of req.files) {
    if (!acceptedTypes.some((type) => type === file.mimetype)) return res.status(400).send('Provided file with unaccepted extension');
  }

  console.log('Shiver me timbers, shiver me niggers');

  const projectId = req.body.projectId;
  const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();

  if (projectDoc.data()?.teacherId !== userId && projectDoc.data()?.opponentId !== userId) return res.status(403).send('You cannot submit review for this project');

  // @ts-ignore
  const files = req.files;

  files.map((file: any) => {
    const splitName = file.originalname.split('.');
    file.customName = `${projectId}-${userId}.${splitName[splitName.length - 1]}`;

    return file;
  });

  const bucket = admin.storage().bucket('ps-reviews');

  try {
    await Promise.all(
      files.map(async (file: any) => {
        return await new Promise((resolve, reject) => {
          const blob = bucket.file(file.customName);

          const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
            resumable: false,
          });

          blobStream.on('finish', async () => {
            try {
              const projectRef = admin.firestore().collection('projects').doc(projectId);

              await admin.firestore().runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(projectRef);

                const reviews = sfDoc.data()?.reviews ?? [];

                const fileUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

                const updatedReviews = reviews.filter((review: any) => review.fileUrl !== fileUrl);
                updatedReviews.push({
                  fileName: file.originalname,
                  fileUrl,
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

              resolve('Successful');
            } catch (e) {
              reject(e);
            }
          });

          blobStream.end(file.buffer);

          blobStream.on('error', (e) => {
            reject(e);
          });
        });
      }),
    );

    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
};
