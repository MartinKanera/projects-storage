import { Request, Response } from 'express';
import admin from 'firebase-admin';

const deleteFile = async (filePath: string) => {
  const storage = admin.storage().bucket('ps-reviews');

  try {
    await storage.file(filePath).delete();
  } catch (e) {}
};

export default async (req: Request, res: Response) => {
  const idToken = req.headers.authorization?.split(' ')[1] ?? '';
  const filePath = req.params.filePath;
  const projectId = req.body.projectId;

  if (!filePath || !projectId) return res.status(400).send('Missing parameters');

  try {
    const userAuth = await admin.auth().verifyIdToken(idToken);

    const projectRef = admin.firestore().collection('projects').doc(projectId);

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const system = await transaction.get(admin.firestore().collection('system').doc('schoolYear'));

        const reviewsDeadline = system.data()?.reviewDeadline;
        if (reviewsDeadline < admin.firestore.Timestamp.now()) throw new Error('429');

        const userDoc = await transaction.get(admin.firestore().collection('users').doc(userAuth.uid));
        if (!userDoc.data()?.teacher) throw new Error('403');

        const projectDoc = await transaction.get(projectRef);
        if (!projectDoc.exists) throw new Error('404');
        if (projectDoc.data()?.teacherId !== userAuth.uid && projectDoc.data()?.opponentId !== userAuth.uid) throw new Error('403');

        if (!projectDoc.data()?.reviews.some((review: any) => review.filePath === filePath && review.teacherId === userAuth.uid)) throw new Error('404/2');
        await deleteFile(filePath);

        const updatedReviews = projectDoc.data()?.reviews.filter((review: any) => review.filePath !== filePath);

        transaction.update(projectRef, {
          reviews: updatedReviews,
        });

        return transaction;
      });

      return res.status(200).send();
    } catch (e) {
      console.error(e);
      switch (e.toString()) {
        case 'Error: 403':
          return res.status(403).send("Only teacher can delete their's own review");
        case 'Error: 404':
          return res.status(404).send('Project does not exist');
        case 'Error: 404/2':
          return res.status(404).send('No review with provided file path and project');
        case 'Error: 429':
          return res.status(429).send('Past deadline');
        default:
          return res.status(500).send();
      }
    }
  } catch (_) {
    return res.status(401).send();
  }
};
