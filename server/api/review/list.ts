import { Request, Response } from 'express';
import admin from 'firebase-admin';

const getReviewsUrls = async (reviews: any, authorized = false) => {
  const storage = admin.app().storage().bucket('ps-reviews');
  const expires = Date.now() + 3600 * 1000;

  if (!reviews) return [];

  const response: any = await Promise.all(
    reviews.map(async (review: any) => {
      if (!authorized && review.filePath.includes('.xlsx')) return;

      const [url] = await storage.file(review.filePath).getSignedUrl({
        action: 'read',
        expires,
      });

      return {
        ...review,
        publicUrl: url,
      };
    }),
  );
  return response.filter((el: any) => el != null);
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const projectId = req.params.id;

  if (!projectId) return res.status(401).send('Missing params');

  try {
    const project = await admin.firestore().collection('projects').doc(projectId).get();

    if (!project.exists) return res.status(404).send('Project does not exist');

    const projectData = project.data();

    try {
      // Check auth
      const userAuth = await admin.auth().verifyIdToken(idToken);
      const userData = (await admin.firestore().collection('users').doc(userAuth.uid).get()).data();

      return res.send(await getReviewsUrls(projectData?.reviews, userData?.admin || projectData?.teacherId === userAuth.uid || projectData?.opponentId === userAuth.uid));
    } catch (_) {
      return res.send(await getReviewsUrls(projectData?.reviews));
    }
  } catch (_) {
    return res.status(500).send();
  }
};
