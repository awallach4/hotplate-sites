import { auth, firestore } from "./admin";
import * as functions from "firebase-functions";

const createUser = functions.https.onCall(async (data, context) => {
  if (context.app === undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }
  const email = data.email;
  const name = data.name;

  if (!email || !name) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Request needs email and username."
    );
  }

  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No context was provided."
    );
  }
  const caller = await auth.getUser(context.auth.uid);
  if (!caller.customClaims) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to create user accounts."
    );
  }
  const isAdmin = caller.customClaims.admin;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You are not authorized to create user accounts."
    );
  }

  // Generate the password.
  let password = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = characters.length;
  let i;
  for (i = 0; i < 20; i++) {
    password += characters.charAt(Math.floor(Math.random() * charLength));
  }

  try {
    const userRecord = await auth.createUser({
      email: email,
      emailVerified: false,
      disabled: false,
      displayName: name,
      password: password
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      authorized: true,
      webmaster: false,
      admin: false
    });

    await firestore.doc(`users/${userRecord.uid}`).set({
      authorized: true,
      displayName: name,
      email: email,
      disabled: false,
      photoURL: "",
      permissions: "User"
    });
    return {
      success: true,
      password: password,
      msg: "Successfully created a new account."
    };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error as string);
  }
});

export default createUser;
