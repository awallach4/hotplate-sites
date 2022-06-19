import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { initializeApp } from "firebase/app";
import { /*connectAuthEmulator,*/ getAuth } from "firebase/auth";
import {
  // connectFirestoreEmulator,
  getFirestore
} from "firebase/firestore/lite";
import { /*connectStorageEmulator,*/ getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
const config = {
  apiKey: "AIzaSyBa7AtqAJsPWOphFGuKECvonSxYYZZsm1Q",
  authDomain: "hotplate-demo.firebaseapp.com",
  projectId: "hotplate-demo",
  storageBucket: "hotplate-demo.appspot.com",
  messagingSenderId: "333701603989",
  appId: "1:333701603989:web:d8bdefb911f75c2df6f19c",
  measurementId: "G-T4JH685JGC"
};

export const app = initializeApp(config);

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeXunggAAAAAGnGBukRrWorbkBZQcuIRPZxVJXc"),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export const analytics = getAnalytics(app);

// Uncomment to use local emulators.
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(firestore, "localhost", 8000);
// connectStorageEmulator(storage, "localhost", 9199);
