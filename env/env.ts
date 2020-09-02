const parseFirebaseConfig = () => {
  if (process.env.FIREBASE_CONFIG) return JSON.parse(process.env.FIREBASE_CONFIG);

  console.error('Missing FIREBASE_CONFIG environment variable');
};

export const env = {
  firebaseConfig: parseFirebaseConfig(),
};
