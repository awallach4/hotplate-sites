import { useUser } from "@/store/user";
import { AuthLevels, AuthStates, type AuthUser } from "@/types";
import { computed } from "@vue/composition-api";

export const user = computed(() => {
  const UserModule = useUser();
  return UserModule.user as AuthUser;
});

export const authLevel = computed(() => {
  const UserModule = useUser();
  return UserModule.authLevel;
});

export const isLoggedIn = computed(() => {
  const UserModule = useUser();
  if (UserModule.authState === AuthStates.LOGGED_IN) {
    return true;
  } else {
    return false;
  }
});

export const isAuthorized = computed(() => {
  if (authLevel.value === AuthLevels.ADMIN) {
    return true;
  } else if (authLevel.value === AuthLevels.WEBMASTER) {
    return true;
  } else if (authLevel.value === AuthLevels.USER) {
    return true;
  } else {
    return false;
  }
});

export const isWebmaster = computed(() => {
  if (authLevel.value === AuthLevels.WEBMASTER) {
    return true;
  } else if (authLevel.value === AuthLevels.ADMIN) {
    return true;
  } else {
    return false;
  }
});
