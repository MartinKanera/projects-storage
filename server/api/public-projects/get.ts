import { Request, Response } from 'express';
import admin from 'firebase-admin';

const getProjectAuthors = async (studentIds: Array<string>, transaction: admin.firestore.Transaction): Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>> => {
  const studentsData = await transaction.get(admin.firestore().collection('users').where(admin.firestore.FieldPath.documentId(), 'in', studentIds));

  return studentsData;
};

const formatProjectsData = async (projects: admin.firestore.QuerySnapshot<admin.firestore.DocumentData>, transaction: admin.firestore.Transaction) => {
  const students = await getProjectAuthors(
    projects.docs.map((project) => project.data().studentId),
    transaction,
  );

  return projects.docs.map((project) => {
    const currentStudent = students.docs.find((student) => project.data().studentId === student.id);

    return {
      id: project.id,
      title: project.data().title,
      description: project.data().description,
      displayName: currentStudent?.data().displayName,
      profilePicture: currentStudent?.data().profilePicture,
      year: (project.data()?.currentYear as admin.firestore.Timestamp).toDate().getFullYear(),
    };
  });
};

export default async (req: Request, res: Response) => {
  const { lastProjectId } = req.query;

  const limit = 10;

  try {
    const projects = await admin.firestore().runTransaction(async (transaction) => {
      if (!lastProjectId) {
        const projects = await transaction.get(admin.firestore().collection('projects').where('public', '==', true).orderBy('currentYear', 'desc').limit(limit));

        if (!projects.docs.length) return [];

        return formatProjectsData(projects, transaction);
      } else if (typeof lastProjectId === 'string') {
        const lastDoc = await transaction.get(admin.firestore().collection('projects').doc(lastProjectId));
        const projects = await transaction.get(admin.firestore().collection('projects').where('public', '==', true).orderBy('currentYear', 'desc').startAfter(lastDoc).limit(limit));

        if (!projects.docs.length) return [];

        return formatProjectsData(projects, transaction);
      }
    });

    return res.send(projects);
  } catch (e) {
    console.error(e);
    return res.status(500).send();
  }
};
