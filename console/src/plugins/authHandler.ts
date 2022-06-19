import { useUser } from "@/store/user";
import {
  AuthLevels,
  PermissionGroups,
  type AuthUser,
  type VSelectValues
} from "@/types";
import { computed } from "@vue/composition-api";

export const user = computed(() => {
  const UserModule = useUser();
  return UserModule.user as AuthUser;
});

export const authLevel = computed(() => {
  const UserModule = useUser();
  return UserModule.authLevel;
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

export const isAdmin = computed(() => {
  if (authLevel.value === AuthLevels.ADMIN) {
    return true;
  } else {
    return false;
  }
});

export const permissions: VSelectValues[] = [
  {
    text: "Anyone on the Internet",
    value: PermissionGroups.PUBLIC
  },
  {
    text: "Only Site Members",
    value: PermissionGroups.USERS
  },
  {
    text: "Only Site Webmasters and Administrators",
    value: PermissionGroups.WEBMASTERS
  }
];
