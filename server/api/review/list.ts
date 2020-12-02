import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const projectId = req.params.id;

  if (!projectId) return res.status(401).send('Missing params');

  const getReviewsUrls = async (reviews: any, authorized = false) => {
    const storage = admin.app().storage().bucket('ps-reviews');
    const expires = Date.now() + 3600 * 1000;

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

  try {
    const project = await admin.firestore().collection('projects').doc(projectId).get();

    if (!project.exists) return res.status(404).send('Project does not exist');

    const userData = idToken ? await admin.auth().verifyIdToken(idToken) : { uid: 'public' };

    const user = await admin.firestore().collection('users').doc(userData.uid).get();

    // User is not logged in and project is not logged in
    if (!user.exists && !project.data()?.public) {
      console.log('User is not logged in and project is not logged in');
      return res.status(403).send('Project is not public');
    }

    // User is not admin but the project is public
    if (!user.data()?.admin && project.data()?.public) {
      console.log('User is not admin but the project is public');
      return res.send(await getReviewsUrls(project.data()?.reviews));
    }

    // User owns this project
    if (project.data()?.studentId === userData.uid) {
      console.log('User owns this project');
      return res.send(await getReviewsUrls(project.data()?.reviews));
    }

    // User is admin
    if (user.data()?.admin) {
      console.log('User is admin');
      res.send(await getReviewsUrls(project.data()?.reviews, true));
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send();
  }
};
