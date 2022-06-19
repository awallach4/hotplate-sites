import * as admin from "firebase-admin";

admin.initializeApp();

export const auth = admin.auth();
export const firestore = admin.firestore();
