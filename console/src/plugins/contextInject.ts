import { getCurrentInstance } from "vue";

export const useVuetify = () => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error("This must be called from the Composition API");
  }
  return instance.proxy.$vuetify;
};
