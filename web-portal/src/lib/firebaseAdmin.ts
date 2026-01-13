import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccountJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  // Vercel env vars often store JSON in one line. If someone pasted with newlines,
  // JSON.parse still works as long as it’s valid JSON.
  try {
    return JSON.parse(raw) as {
      project_id: string;
      private_key: string;
      client_email: string;
    };
  } catch (e) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the full service account JSON (one line) into Vercel env."
    );
  }
}

export function getAdminDb() {
  const serviceAccount = parseServiceAccountJson();
  if (!serviceAccount) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY. Add Firebase Admin service account JSON to Vercel env to enable DB writes."
    );
  }

  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount as any),
        })
      : getApps()[0];

  return getFirestore(app);
}


