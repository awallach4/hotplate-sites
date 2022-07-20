import { useSettings } from "./settings";
import { defineStore } from "pinia";
import {
  AuthLevels,
  AuthStates,
  type AuthUser,
  type SettingsSitePrivate
} from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import type { AuthError, User } from "firebase/auth";
import { getAuthError } from "@/plugins/errorHandler";

export const useUser = defineStore("user", () => {
  const authState = ref(AuthStates.LOGGED_OUT);
  const authLevel = ref(AuthLevels.NONE);
  const user: Ref<AuthUser | null> = ref(null);

  const loginWithEmail = async (
    email: string,
    password: string,
    persistence: boolean
  ) => {
    authState.value = AuthStates.LOGGING_IN;

    try {
      const { auth } = await import("@/plugins/firebase");
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
    } catch (error) {
      authState.value = AuthStates.LOGGED_OUT;
      throw getAuthError(error as AuthError);
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
    onAuthStateChanged(auth, async (firebaseUser) => {
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
        } else if (SettingsModule.siteSettings.controlledAuth) {
          authLevel.value = AuthLevels.USER;
        } else {
          authLevel.value = AuthLevels.NONE;
        }
        authState.value = AuthStates.LOGGED_IN;
      } else {
        user.value = null;
        authLevel.value = AuthLevels.NONE;
        authState.value = AuthStates.LOGGED_OUT;
        SettingsModule.sitePrivateSettings = {} as SettingsSitePrivate;
      }
    });
  };

  return {
    authState,
    authLevel,
    user,
    loginWithEmail,
    sendPasswordReset,
    logout,
    getInitialUser,
    createAuthListener
  };
});
