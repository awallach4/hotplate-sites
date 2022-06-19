import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { /*connectAuthEmulator,*/ getAuth } from "firebase/auth";
import {
  // connectFirestoreEmulator,
  getFirestore
} from "firebase/firestore/lite";
import { /*connectStorageEmulator,*/ getStorage } from "firebase/storage";
import { /*connectFunctionsEmulator,*/ getFunctions } from "firebase/functions";

const config = {
  apiKey: "AIzaSyBa7AtqAJsPWOphFGuKECvonSxYYZZsm1Q",
  authDomain: "hotplate-demo.firebaseapp.com",
  projectId: "hotplate-demo",
  storageBucket: "hotplate-demo.appspot.com",
  messagingSenderId: "333701603989",
  appId: "1:333701603989:web:c2ab3d4efc710260f6f19c",
  measurementId: "G-3FQCP3VPJN"
};

export const app = initializeApp(config);

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeXunggAAAAAGnGBukRrWorbkBZQcuIRPZxVJXc"),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Uncomment to use local emulators.
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(firestore, "localhost", 8000);
// connectStorageEmulator(storage, "localhost", 9199);
// connectFunctionsEmulator(functions, "localhost", 5001);
