const parseFirebaseConfig = () => {
  if (process.env.FIREBASE_CONFIG) return JSON.parse(process.env.FIREBASE_CONFIG);

  console.error('Missing FIREBASE_CONFIG environment variable');
};

const parseServiceAccount = () => {
  if (process.env.SERVICE_ACCOUNT) return JSON.parse(process.env.SERVICE_ACCOUNT);

  console.error('Missing SERVICE_ACCOUNT environment variable');
};

export const env = {
  firebaseConfig: parseFirebaseConfig(),
  serviceAccount: parseServiceAccount(),
};
