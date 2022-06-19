import { auth, firestore } from "./admin";
import * as functions from "firebase-functions";

const addFirstAdmin = functions.https.onRequest(async (req, res) => {
  let uid = "";

  if (!req.query.id) {
    res.status(500).send("Request needs a user id (?id=[UID]).");
    return;
  }

  if (typeof req.query.id === "string") {
    uid = req.query.id;
  } else {
    res.status(400).send("The uid must be a string.");
    return;
  }

  try {
    const numDocs = await firestore.collection("admin").limit(2).get();
    let admins = 0;

    numDocs.forEach(() => {
      admins++;
    });
    if (admins > 1) {
      res.status(403).send("There is already at least one admin!");
      return;
    }

    const dbEntry = await firestore.doc(`admin/${uid}`).get();
    const data = dbEntry.data();
    if (data) {
      await auth.setCustomUserClaims(uid, {
        authorized: true,
        admin: true,
        webmaster: true
      });
      await auth.revokeRefreshTokens(uid);
      const user = await auth.getUser(uid);
      await firestore.doc(`users/${uid}`).set(
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          permissions: "Admin",
          disabled: user.disabled
        },
        { merge: true }
      );
      res.status(200).send("Successfully added the first admin.");
    } else {
      res.status(403).send("The user is not authorized to become an admin.");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

export default addFirstAdmin;
