import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cached: { app: App; auth: Auth; db: Firestore } | null = null;

export function getAdmin() {
  if (cached) return cached;

  const existing = getApps()[0];
  const app =
    existing ??
    initializeApp({
      credential: cert(loadServiceAccount()),
    });

  cached = { app, auth: getAuth(app), db: getFirestore(app) };
  return cached;
}

function loadServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_B64 is not set. See .env.local.",
    );
  }
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}
