import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: false,
    options: {
      customProperties: true
    },
    themes: {
      light: {
        error: "#FF5252",
        errtext: "#000000",
        card: "#FFFFFF",
        cardtext: "#000000",
        warning: "#FB8C00",
        warntext: "#000000",
        primary: "#3949AB",
        pritext: "#FFFFFF",
        secondary: "#1976D2",
        sectext: "#FFFFFF",
        info: "#2196F3",
        infotext: "#000000",
        background: "#FFFFFF",
        bgtext: "#000000",
        anchor: "#0D47A1",
        success: "#4CAF50",
        suctext: "#000000",
        accent: "#000000"
      },
      dark: {
        background: "#121212",
        bgtext: "#FFFFFF",
        error: "#FF5252",
        errtext: "#000000",
        warning: "#FB8C00",
        warntext: "#000000",
        info: "#2196F3",
        infotext: "#000000",
        anchor: "#42A5F5",
        success: "#4CAF50",
        suctext: "#000000",
        card: "#1E1E1E",
        cardtext: "#FFFFFF",
        secondary: "#64B5F6",
        sectext: "#000000",
        primary: "#424242",
        pritext: "#FFFFFF",
        accent: "#FFFFFF"
      }
    }
  }
});
