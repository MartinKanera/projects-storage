import { Request, Response } from 'express';
import admin from 'firebase-admin';

const getFiles = async (files: any) => {
  const storage = admin.app().storage().bucket('ps-project-files');
  const expires = Date.now() + 3600 * 1000;

  if (!files) return [];

  const response: any = await Promise.all(
    files.map(async (file: any) => {
      const [url] = await storage.file(file.filePath).getSignedUrl({
        action: 'read',
        expires,
      });

      return {
        ...file,
        url,
      };
    }),
  );

  return response.filter((el: any) => el != null);
};

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
      return res.status(403).send();
    }

    const projectData = project.data();

    const projectFiles = (await admin.firestore().collection('projectFiles').where('projectId', '==', projectRef.id).get()).docs[0];

    // TODO function to fetch all files (mandatory and optional)

    return res.status(200).send({
      title: projectData?.title,
      description: projectData?.description,
      links: projectData?.links,
      mandatoryFiles: await getFiles(projectFiles.data()?.mandatory),
      optionalFiles: await getFiles(projectFiles.data()?.optional),
      submitted: projectData?.submitted,
    });
  } catch (e) {
    return res.status(401).send(e);
  }
};
