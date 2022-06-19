import { computed, getCurrentInstance } from "@vue/composition-api";

export const useRouter = () => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("This must be called from the Composition API");
  }
  return instance.proxy.$router;
};

export const useRoute = () => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("This must be called from the Composition API");
  }
  return computed(() => {
    return instance.proxy.$route;
  }).value;
};

export const useVuetify = () => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("This must be called from the Composition API");
  }
  return instance.proxy.$vuetify;
};
