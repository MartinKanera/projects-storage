import admin from 'firebase-admin';
import { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
  const tokenId = req.headers.authorization?.split(' ')[1] ?? '';

  const projectId = req.params.id;
  const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();

  let user: admin.auth.DecodedIdToken;

  try {
    user = await admin.auth().verifyIdToken(tokenId);

    if (!(await admin.firestore().collection('users').doc(user.uid).get()).data()?.teacher) return res.status(403).send('Only teacher can upload reviews');
    if (projectDoc.data()?.teacherId !== user.uid && projectDoc.data()?.opponentId !== user.uid) return res.status(403).send('You cannot submit review for this project');
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  // @ts-ignore
  if (!req.files || !req.params.id) return res.status(400).send('Missing parameters');

  const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  // @ts-ignore
  for (const file of req.files) {
    if (!acceptedTypes.some((type) => type === file.mimetype)) return res.status(400).send('Provided file with unaccepted extension');
  }

  // @ts-ignore
  const files = req.files;

  files.map((file: any) => {
    const splitName = file.originalname.split('.');
    file.customName = `${projectId}-${user.uid}.${splitName[splitName.length - 1]}`;

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

                const updatedReviews = reviews.filter((review: any) => review.filePath !== blob.name);
                updatedReviews.push({
                  fileName: file.originalname,
                  filePath: `${blob.name}`,
                  teacherId: user.uid,
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
