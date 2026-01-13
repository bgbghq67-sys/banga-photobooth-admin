import { Firestore } from "@google-cloud/firestore";

type ServiceAccount = {
  project_id: string;
  private_key: string;
  client_email: string;
};

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY. Add Firebase Admin service account JSON to Vercel env."
    );
  }

  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
  }

  const project_id = String(json?.project_id ?? "");
  const client_email = String(json?.client_email ?? "");
  let private_key = String(json?.private_key ?? "");

  // Vercel often stores newlines as literal \n
  private_key = private_key.replace(/\\n/g, "\n");

  if (!project_id || !client_email || !private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields.");
  }

  return { project_id, client_email, private_key };
}

let _db: Firestore | null = null;

export function getServerDb() {
  if (_db) return _db;
  const sa = parseServiceAccount();
  _db = new Firestore({
    projectId: sa.project_id,
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    // Key fix: use REST transport to avoid gRPC stalls on serverless
    preferRest: true,
  } as any);
  return _db;
}

export function getServerInfo() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    return { hasServiceAccount: false, serviceAccountProjectId: "" };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      hasServiceAccount: true,
      serviceAccountProjectId: String(parsed?.project_id ?? ""),
    };
  } catch {
    return { hasServiceAccount: true, serviceAccountProjectId: "" };
  }
}


