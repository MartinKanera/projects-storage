import { Request, Response } from 'express';
import admin from 'firebase-admin';

const removeReviews = async (filePaths: Array<string>) => {
  try {
    return await Promise.all(
      filePaths.map((filePath: string) => {
        return admin.storage().bucket('ps-reviews').file(filePath).delete();
      }),
    );
  } catch (e) {
    throw new Error(e);
  }
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';

  const updatedProject = req.body;

  if (!req.params.id) return res.status(401).send('Missing params');

  try {
    if (typeof updatedProject.deadlineDate === 'string') admin.firestore.Timestamp.fromDate(new Date(updatedProject.deadlineDate));
  } catch (_) {
    return res.status(400).send('Poorly formated date');
  }

  if (
    !(updatedProject.opponentId || updatedProject.public !== undefined || updatedProject.teacherId || updatedProject.title) &&
    typeof updatedProject.opponentId === 'string' &&
    typeof updatedProject.public === 'boolean' &&
    typeof updatedProject.teacherId === 'string' &&
    typeof updatedProject.title === 'string' &&
    updatedProject.deadlineDate !== undefined
  )
    return res.status(400).send('Missing params');

  try {
    const user = await admin.auth().verifyIdToken(idToken);

    if (!(await admin.firestore().collection('users').doc(user.uid).get()).data()?.admin) return res.status(403).send('Only accessible by admins');
  } catch (_) {
    return res.status(401).send('Unauthorized');
  }

  const projectRef = admin.firestore().collection('projects').doc(req.params.id);

  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const sfDoc = await transaction.get(projectRef);

      let projectToUpload = {
        opponentId: updatedProject.opponentId,
        public: updatedProject.public,
        teacherId: updatedProject.teacherId,
        title: updatedProject.title,
        titleLower: updatedProject.title.toLowerCase(),
        deadlineDate: updatedProject.deadlineDate === null ? null : admin.firestore.Timestamp.fromDate(new Date(updatedProject.deadlineDate)),
      };

      if (sfDoc.data()?.teacherId !== updatedProject.teacherId && sfDoc.data()?.reviews) {
        removeReviews(
          sfDoc
            .data()
            ?.reviews.filter((review: any) => review.teacherId === sfDoc.data()?.teacherId)
            .map((review: any) => review.filePath),
        );
        const filteredReviews = sfDoc.data()?.reviews.filter((review: any) => review.teacherId !== sfDoc.data()?.teacherId);

        projectToUpload = {
          ...projectToUpload,
          // @ts-ignore
          reviews: filteredReviews,
        };
      }

      if (sfDoc.data()?.opponentId !== updatedProject.opponentId && sfDoc.data()?.reviews) {
        removeReviews(
          sfDoc
            .data()
            ?.reviews.filter((review: any) => review.teacherId === sfDoc.data()?.opponentId)
            .map((review: any) => review.filePath),
        );
        const filteredReviews = sfDoc.data()?.reviews.filter((review: any) => review.teacherId !== sfDoc.data()?.opponentId);

        projectToUpload = {
          ...projectToUpload,
          // @ts-ignore
          reviews: filteredReviews,
        };
      }

      transaction.update(projectRef, projectToUpload);

      return transaction;
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send(e);
  }

  return res.status(200).send();
};
