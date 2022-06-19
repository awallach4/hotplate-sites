<template>
  <div v-if="pageData.components" id="spec-page">
    <template v-for="component in pageData.components">
      <component
        :is="checkComponent(component.vueComp)"
        v-bind="component.data"
        :key="component.props.id"
        :meta-data="component.props"
      />
      <v-spacer :key="`${component.props.id}-spacer`" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { CompData, PageData } from "@/types";
import { usePages } from "@/store/pages";
import { useRoute } from "@/plugins/contextInject";
import { computed, ref } from "@vue/composition-api";
import {
  AlertMessage,
  CalendarWidget,
  ColumnLayout,
  ContactForm,
  DocumentList,
  ImageCarousel,
  ItemList,
  MessageStream,
  NonexistentComponent,
  PageHeader,
  PlainText,
  RequestForm,
  RichText,
  SignupSheetCollection,
  VideoEmbed
} from "@/components/asyncComponents";
import { pushRouter } from "@/plugins/routerStoreHelpers";

const PagesModule = usePages();
const route = useRoute();
const pageData = ref({
  components: []
} as PageData);
const pageIndex = computed(() => {
  const index = PagesModule.specialPages.findIndex((item) => {
    return item.dbPath === `/${route.params.SpecialPage}`;
  });
  return index;
});
const pageMetaData = computed(() => {
  return PagesModule.specialPages[pageIndex.value];
});
const dbPath = computed(() => {
  return (
    (route.params.SpecialPage[0] === "/" ? "" : "/") + route.params.SpecialPage
  );
});

const getPageData = async () => {
  if (pageMetaData.value) {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, orderBy, query, where } = await import(
      "firebase/firestore/lite"
    );
    const pageDocs = await getDocs(
      query(
        collection(firestore, `pages${dbPath.value}/components`),
        where("data.hidden", "==", false),
        orderBy("index", "asc")
      )
    );
    pageDocs.forEach((pageDoc) => {
      const data = pageDoc.data();
      if (data) {
        pageData.value.components.push(data as CompData);
      }
    });

    PagesModule.viewPage(
      pageMetaData.value.dbPath,
      pageMetaData.value.name,
      false
    );
  } else {
    pushRouter("/error");
  }
};

const checkComponent = (component: string) => {
  switch (component) {
    case "AlertMessage":
      return AlertMessage;
    case "CalendarWidget":
      return CalendarWidget;
    case "ColumnLayout":
      return ColumnLayout;
    case "ContactForm":
      return ContactForm;
    case "DocumentList":
      return DocumentList;
    case "ImageCarousel":
      return ImageCarousel;
    case "ItemList":
      return ItemList;
    case "MessageStream":
      return MessageStream;
    case "PageHeader":
      return PageHeader;
    case "PlainText":
      return PlainText;
    case "RequestForm":
      return RequestForm;
    case "RichText":
      return RichText;
    case "SignupSheetCollection":
      return SignupSheetCollection;
    case "VideoEmbed":
      return VideoEmbed;
    default:
      return NonexistentComponent;
  }
};

getPageData();
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
