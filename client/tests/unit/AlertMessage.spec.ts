import AlertMessage from "@/components/system/AlertMessage.vue";
import { createLocalVue, mount } from "@vue/test-utils";
import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

describe("AlertMessage Component", () => {
  const localVue = createLocalVue();
  let vuetify: Vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mountFunction = (options: any) => {
    return mount(AlertMessage, {
      localVue,
      vuetify,
      ...options
    });
  };

  it("should render a message specified by the text prop", () => {
    const wrapper = mountFunction({
      propsData: {
        text: "Hello World!"
      }
    });

    const message = wrapper.find(".v-alert .v-alert__content");

    expect(message.text()).toMatch("Hello World!");
  });

  it("should render an error alert if the type prop is set to error", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "error"
      }
    });

    const alert = wrapper.find(".v-alert.error");

    expect(alert.exists()).toBe(true);
  });

  it("should render an info alert if the type prop is set to info", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "info"
      }
    });

    const alert = wrapper.find(".v-alert.info");

    expect(alert.exists()).toBe(true);
  });

  it("should render a warning alert if the type prop is set to warning", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "warning"
      }
    });

    const alert = wrapper.find(".v-alert.warning");

    expect(alert.exists()).toBe(true);
  });

  it("should render a success alert if the type prop is set to success", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "success"
      }
    });

    const alert = wrapper.find(".v-alert.success");

    expect(alert.exists()).toBe(true);
  });

  it("should render an alert octagon outline icon if the type prop is set to error", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "error"
      }
    });

    const icon = wrapper.find(
      ".v-alert__wrapper > .v-icon.mdi-alert-octagon-outline"
    );

    expect(icon.exists()).toBe(true);
  });

  it("should render an information outline icon if the type prop is set to info", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "info"
      }
    });

    const icon = wrapper.find(
      ".v-alert__wrapper > .v-icon.mdi-information-outline"
    );

    expect(icon.exists()).toBe(true);
  });

  it("should render an alert outline icon if the type prop is set to warning", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "warning"
      }
    });

    const icon = wrapper.find(".v-alert__wrapper > .v-icon.mdi-alert-outline");

    expect(icon.exists()).toBe(true);
  });

  it("should render a check circle outline icon if the type prop is set to success", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "success"
      }
    });

    const icon = wrapper.find(
      ".v-alert__wrapper > .v-icon.mdi-check-circle-outline"
    );

    expect(icon.exists()).toBe(true);
  });

  it("should use the error text color if the type prop is set to error", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "error"
      }
    });

    const alert = wrapper.find(".v-alert.errtext--text");

    expect(alert.exists()).toBe(true);
  });

  it("should use the info text color if the type prop is set to info", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "info"
      }
    });

    const alert = wrapper.find(".v-alert.infotext--text");

    expect(alert.exists()).toBe(true);
  });

  it("should use the warning text color if the type prop is set to warning", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "warning"
      }
    });

    const alert = wrapper.find(".v-alert.warntext--text");

    expect(alert.exists()).toBe(true);
  });

  it("should use the success text color if the type prop is set to success", () => {
    const wrapper = mountFunction({
      propsData: {
        type: "success"
      }
    });

    const alert = wrapper.find(".v-alert.suctext--text");

    expect(alert.exists()).toBe(true);
  });
});
