import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const projectId = req.params.id;

  if (!projectId) return res.status(401).send('Missing params');

  const getReviewsUrls = async (projectId: string, reviewers: Array<string>, isAdmin = false) => {
    const storage = admin.app().storage().bucket('ps-reviews');
    const expires = Date.now() + 3600 * 1000;

    const response: any = await Promise.all(
      reviewers.map(async (reviewerId) => {
        const [pdf] = await storage.file(`${projectId}-${reviewerId}.pdf`).getSignedUrl({
          action: 'read',
          expires,
        });

        if (isAdmin) {
          const [xlsx] = await storage.file(`${projectId}-${reviewerId}.xlsx`).getSignedUrl({
            action: 'read',
            expires,
          });

          return [pdf, xlsx];
        }

        return [pdf];
      }),
    );

    return [...response[0], ...response[1]];
  };

  try {
    const project = await admin.firestore().collection('projects').doc(projectId).get();

    if (!project.exists) return res.status(404).send('Project does not exist');

    const userData = idToken ? await admin.auth().verifyIdToken(idToken) : { uid: 'public' };

    const user = await admin.firestore().collection('users').doc(userData.uid).get();

    console.log(await getReviewsUrls(projectId, [project.data()?.teacherId, project.data()?.opponentId]));

    // User is not logged in and project is not logged in
    if (!(user.exists && project.data()?.public)) return res.status(403).send('Project is not public');

    // User is not admin but the project is public
    if (!user.data()?.admin && project.data()?.public) {
      return res.send('You not admin and project is public');
    }

    // User owns this project
    if (project.data()?.studentId === userData.uid) {
      return res.send('You are project owner');
    }

    // User is admin
    if (user.data()?.admin) {
    }

    return res.send('You admin');
  } catch (e) {
    console.error(e);
    return res.status(500).send();
  }
};
