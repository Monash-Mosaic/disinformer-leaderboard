import admin, { ServiceAccount } from "firebase-admin";
import type { Firestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getServiceAccount(): ServiceAccount {
    const projectId =
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
        );
    }

    return { projectId, clientEmail, privateKey };
}

let firestoreSingleton: Firestore | null = null;

export function getFirebaseAdmin(): typeof admin {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(getServiceAccount()),
        });
    }
    return admin;
}

export function getDb(): Firestore {
    if (!firestoreSingleton) {
        firestoreSingleton = getFirebaseAdmin().firestore();
    }
    return firestoreSingleton;
}
