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
  const projectUrl = req.params.url;

  if (!projectUrl) return res.status(400).send('Missing parameters');

  try {
    const queriedProjects = admin.firestore().collection('projects').where('url', '==', projectUrl);
    const project = (await queriedProjects.get()).docs[0];
    const projectRef = project.ref;

    const projectData = project.data();

    if (!project?.exists) return res.status(404).send('Project does not exist');

    if (!projectData?.public) {
      try {
        const userAuth = await admin.auth().verifyIdToken(idToken);
        const user = await admin.firestore().collection('users').doc(userAuth.uid).get();

        if (!user.data()?.admin && !(projectData?.studentId === userAuth.uid) && !(projectData?.teacherId === userAuth.uid) && !(projectData?.opponentId === userAuth.uid))
          return res.status(403).send();
      } catch (_) {
        return res.status(403).send();
      }
    }

    let deadlineDate = projectData?.deadlineDate;

    if (deadlineDate == null) {
      deadlineDate = (await admin.firestore().collection('system').doc('schoolYear').get())?.data()?.projectDeadline;
    }

    const studentData = (await admin.firestore().collection('users').doc(projectData?.studentId).get()).data();

    const projectFiles = (await admin.firestore().collection('projectFiles').where('projectId', '==', projectRef.id).get()).docs[0];

    return res.status(200).send({
      id: project.id,
      title: projectData?.title,
      description: projectData?.description,
      links: projectData?.links,
      currentYear: projectData?.currentYear,
      mandatoryFiles: await getFiles(projectFiles.data()?.mandatory),
      optionalFiles: await getFiles(projectFiles.data()?.optional),
      submitted: projectData?.submitted,
      deadlineDate,
      studentProfilePicture: studentData?.profilePicture,
      studentDisplayName: studentData?.displayName,
      keywords: projectData?.keywords,
    });
  } catch (e) {
    console.error(e);
    return res.status(401).send(e);
  }
};
