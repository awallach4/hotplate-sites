import VueCompositionAPI, { createApp, h } from "@vue/composition-api";
import { createPinia, PiniaVuePlugin } from "pinia";
import VueRouter from "vue-router";

import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";

const app = createApp({
  router,
  pinia: createPinia(),
  vuetify,
  render: () => h(App)
});

app.use(VueCompositionAPI);
app.use(PiniaVuePlugin);
app.use(VueRouter);

app.mount("#app");
