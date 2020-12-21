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

    const userData = idToken ? await admin.auth().verifyIdToken(idToken) : { uid: 'public' };

    const user = await admin.firestore().collection('users').doc(userData.uid).get();

    // User is not logged in and project is not public
    if (!user.exists && !project.data()?.public) {
      console.log('User is not logged in and project is not public');
      return res.status(403).send('Project is not public');
    }

    // User is admin
    else if (user.data()?.admin) {
      console.log('User is admin');
      res.send(await getReviewsUrls(project.data()?.reviews, true));
    }

    // User is not admin but the project is public
    else if (!user.data()?.admin && project.data()?.public) {
      console.log('User is not admin but the project is public');
      return res.send(await getReviewsUrls(project.data()?.reviews));
    }

    // User owns this project
    else if (project.data()?.studentId === userData.uid) {
      console.log('User owns this project');
      return res.send(await getReviewsUrls(project.data()?.reviews));
    }

    // TODO user is teacher from this project

    return res.status(403).send();
  } catch (e) {
    console.error(e);
    return res.status(500).send();
  }
};
