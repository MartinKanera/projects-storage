import { Request, Response } from 'express';
import admin from 'firebase-admin';

const getReviewsUrls = async (projectData: any, authorized = false) => {
  const reviews = projectData?.reviews;

  const storage = admin.app().storage().bucket('ps-reviews');
  const expires = Date.now() + 3600 * 1000;

  const result = [
    {
      teacherId: projectData?.teacherId,
      reviews: [],
    },
    {
      teacherId: projectData?.opponentId,
      reviews: [],
    },
  ];

  if (!reviews) return result;

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

  const strippedReviews: Array<any> = response.filter((el: any) => el != null);
  return result.map((teacher) => {
    return {
      ...teacher,
      reviews: strippedReviews.filter((review) => review.teacherId === teacher.teacherId),
    };
  });
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const projectId = req.params.id;

  if (!projectId) return res.status(400).send('Missing params');

  try {
    const project = await admin.firestore().collection('projects').doc(projectId).get();

    if (!project.exists) return res.status(404).send('Project does not exist');

    const projectData = project.data();

    if (!projectData?.public && idToken === 'undefined') return res.status(403).send();
    if (projectData?.public && idToken === 'undefined') return res.status(200).send(await getReviewsUrls(projectData));

    try {
      // Check auth
      const userAuth = await admin.auth().verifyIdToken(idToken);
      const userData = (await admin.firestore().collection('users').doc(userAuth.uid).get()).data();

      return res.send(await getReviewsUrls(projectData, userData?.admin || projectData?.teacherId === userAuth.uid || projectData?.opponentId === userAuth.uid));
    } catch (_) {
      return res.status(401).send('Project is not public');
    }
  } catch (_) {
    return res.status(500).send();
  }
};
