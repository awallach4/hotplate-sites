import {
  AuthLevels,
  AuthStates,
  type AuthUser,
  type SettingsSitePrivate,
  type UserData
} from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import type { User } from "firebase/auth";
import { defineStore } from "pinia";
import { useSettings } from "./settings";

export const useUser = defineStore("user", () => {
  const authState = ref(AuthStates.LOGGED_OUT);
  const authLevel = ref(AuthLevels.NONE);
  const user: Ref<AuthUser | null> = ref(null);
  const userProfile: Ref<UserData | null> = ref(null);

  const loginWithEmail = async (
    email: string,
    password: string,
    persistence: boolean
  ) => {
    authState.value = AuthStates.LOGGING_IN;

    try {
      const { auth, analytics } = await import("@/plugins/firebase");
      const {
        browserLocalPersistence,
        browserSessionPersistence,
        setPersistence,
        signInWithEmailAndPassword
      } = await import("firebase/auth");
      if (persistence) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }
      await signInWithEmailAndPassword(auth, email, password);
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "login", { method: "password" });
    } catch (error) {
      authState.value = AuthStates.LOGGED_OUT;
      throw error;
    }

    authState.value = AuthStates.LOGGED_IN;
  };

  const sendPasswordReset = async (email: string) => {
    const { auth } = await import("@/plugins/firebase");
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    const { auth } = await import("@/plugins/firebase");
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  const changePassword = async (
    email: string,
    password: string,
    newPassword: string
  ) => {
    const { auth } = await import("@/plugins/firebase");
    const user = auth.currentUser;
    if (user && authState.value === AuthStates.LOGGED_IN) {
      const {
        EmailAuthProvider,
        reauthenticateWithCredential,
        updatePassword
      } = await import("firebase/auth");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(email, password)
      );
      await updatePassword(user, newPassword);
    }
  };

  const changeEmail = async (
    email: string,
    password: string,
    newEmail: string
  ) => {
    const { auth } = await import("@/plugins/firebase");
    const user = auth.currentUser;
    if (user && authState.value === AuthStates.LOGGED_IN) {
      const {
        EmailAuthProvider,
        reauthenticateWithCredential,
        sendEmailVerification,
        updateEmail
      } = await import("firebase/auth");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(email, password)
      );
      updateEmail(user, newEmail);
      sendEmailVerification(user);
      const { firestore } = await import("@/plugins/firebase");
      const { doc, updateDoc } = await import("firebase/firestore/lite");
      await updateDoc(doc(firestore, `users/${user.uid}`), {
        email: newEmail
      });
    }
  };

  const editProfile = async (data: UserData) => {
    const { auth } = await import("@/plugins/firebase");
    const user = auth.currentUser;
    if (user && authState.value === AuthStates.LOGGED_IN) {
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL
      });

      const { firestore } = await import("@/plugins/firebase");
      const { doc, updateDoc } = await import("firebase/firestore/lite");
      await updateDoc(doc(firestore, `users/${user.uid}`), { ...data });
    }
  };

  const verifyEmail = async () => {
    const { auth } = await import("@/plugins/firebase");
    const user = auth.currentUser;
    if (user && authState.value === AuthStates.LOGGED_IN) {
      const { sendEmailVerification } = await import("firebase/auth");
      await sendEmailVerification(user);
      await logout();
    }
  };

  const deleteCurrentUser = async (email: string, password: string) => {
    const { auth } = await import("@/plugins/firebase");
    const user = auth.currentUser;
    if (user && authState.value === AuthStates.LOGGED_IN) {
      const { deleteUser, EmailAuthProvider, reauthenticateWithCredential } =
        await import("firebase/auth");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(email, password)
      );
      await deleteUser(user);
    }
  };

  const getInitialUser = async (): Promise<User | null> => {
    const { auth } = await import("@/plugins/firebase");
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  };

  const createAuthListener = async () => {
    const { auth } = await import("@/plugins/firebase");
    const { getIdTokenResult, onAuthStateChanged } = await import(
      "firebase/auth"
    );
    onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const SettingsModule = useSettings();
        if (firebaseUser) {
          const { uid, displayName, email, photoURL, emailVerified } =
            firebaseUser;
          user.value = { uid, displayName, email, photoURL, emailVerified };
          const token = await getIdTokenResult(firebaseUser);
          const isAdmin = token.claims.admin;
          const isWebmaster = token.claims.webmaster;
          const isAuthorized = token.claims.authorized;
          const isEmailVerified = firebaseUser.emailVerified;

          if (isAdmin && isWebmaster && isAuthorized && isEmailVerified) {
            authLevel.value = AuthLevels.ADMIN;
            SettingsModule.getSitePrivateSettings();
          } else if (isWebmaster && isAuthorized && isEmailVerified) {
            authLevel.value = AuthLevels.WEBMASTER;
            SettingsModule.getSitePrivateSettings();
          } else if (isAuthorized && isEmailVerified) {
            authLevel.value = AuthLevels.USER;
            SettingsModule.getSitePrivateSettings();
          } else {
            authLevel.value = AuthLevels.NONE;
          }
          authState.value = AuthStates.LOGGED_IN;

          try {
            const { firestore } = await import("@/plugins/firebase");
            const { doc, getDoc } = await import("firebase/firestore/lite");
            const userDoc = await getDoc(doc(firestore, `users/${uid}`));
            const data = userDoc.data() as UserData;
            userProfile.value = data;
          } catch (error) {
            await logout();
            throw error;
          }
        } else {
          user.value = null;
          userProfile.value = null;
          authLevel.value = AuthLevels.NONE;
          authState.value = AuthStates.LOGGED_OUT;
          SettingsModule.sitePrivateSettings = {} as SettingsSitePrivate;
        }
      },
      (error) => {
        throw error;
      }
    );
  };

  return {
    authState,
    authLevel,
    user,
    userProfile,
    loginWithEmail,
    sendPasswordReset,
    logout,
    changePassword,
    changeEmail,
    editProfile,
    verifyEmail,
    deleteCurrentUser,
    getInitialUser,
    createAuthListener
  };
});
