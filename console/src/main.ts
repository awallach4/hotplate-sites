import { createPinia, PiniaVuePlugin } from "pinia";
import VueRouter from "vue-router";

import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import Vue, { h } from "vue";

Vue.use(PiniaVuePlugin);
Vue.use(VueRouter);

export default new Vue({
  router,
  pinia: createPinia(),
  vuetify,
  render: () => h(App)
}).$mount("#app");

// [TODO] For future Vue 3 upgrade.
// const app = createApp({
//   router,
//   pinia: createPinia(),
//   vuetify,
//   render: () => h(App)
// });

// app.use(VueCompositionAPI);
// app.use(PiniaVuePlugin);
// app.use(VueRouter);

// app.mount("#app");
