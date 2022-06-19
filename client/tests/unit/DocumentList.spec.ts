import DocumentList from "@/components/system/DocumentList.vue";
import { createLocalVue, mount } from "@vue/test-utils";
import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

describe("DocumentList Component", () => {
  const localVue = createLocalVue();
  let vuetify: Vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mountFunction = (options: any) => {
    return mount(DocumentList, {
      localVue,
      vuetify,
      ...options
    });
  };

  it("should render an empty unordered list if no props are passed", () => {
    const wrapper = mountFunction({});

    const list = wrapper.find("ul");

    expect(list.html()).toBe("<ul></ul>");
  });

  it("should render an <li> element for each item in the storPath prop", () => {
    const items = [
      {
        name: "File1",
        url: "https://googleapis.com/file1"
      },
      {
        name: "File2",
        url: "https://googleapis.com/file2"
      }
    ];
    const wrapper = mountFunction({
      propsData: {
        storPath: items
      }
    });

    const list = wrapper.findAll("li");

    expect(list.length).toEqual(items.length);
  });

  it("should generate a link for each file; the href should be the file url and the text should be the file name", () => {
    const items = [
      {
        name: "File1",
        url: "https://googleapis.com/file1"
      },
      {
        name: "File2",
        url: "https://googleapis.com/file2"
      }
    ];
    const wrapper = mountFunction({
      propsData: {
        storPath: items
      }
    });

    const links = wrapper.findAll("a");
    links.wrappers.forEach((item, index) => {
      expect(item.attributes().href).toEqual(items[index].url);
      expect(item.attributes().download).toEqual(items[index].name);
      expect(item.attributes().target).toEqual("_blank");
      expect(item.attributes().rel).toEqual("noreferrer noopener nofollow");
      expect(item.text()).toEqual(items[index].name);
    });
    expect(links.length).toEqual(items.length);
  });
});
