import { Request, Response } from 'express';
import admin from 'firebase-admin';

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const projectId = req.params.id;

  if (!projectId) return res.status(400).send('Missing parameters');

  try {
    const userAuth = idToken ? await admin.auth().verifyIdToken(idToken) : { uid: 'public' };
    const user = await admin.firestore().collection('users').doc(userAuth.uid).get();

    const projectRef = admin.firestore().collection('projects').doc(projectId);
    const project = await projectRef.get();

    if (!project.exists) return res.status(404).send('Project does not exist');

    if (
      !user.data()?.admin &&
      !project.data()?.public &&
      !(project.data()?.studentId === userAuth.uid) &&
      !(project.data()?.teacherId === userAuth.uid) &&
      !(project.data()?.opponentId === userAuth.uid)
    ) {
      console.log('Kekw');
      return res.status(403).send();
    }

    const projectData = project.data();

    // TODO function to fetch all files (mandatory and optional)

    return res.status(200).send({
      title: projectData?.title,
      description: projectData?.description,
      links: projectData?.links,
      mandatoryFiles: [],
      optionalFiles: [],
    });
  } catch (e) {
    return res.status(401);
  }
};
