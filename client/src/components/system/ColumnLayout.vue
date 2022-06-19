<template>
  <v-row class="column-layout">
    <v-col
      v-for="(column, index) in columns"
      :key="index"
      cols="12"
      sm="6"
      :md="layout === LayoutOptions.THREE_COLUMNS ? '4' : '6'"
    >
      <template v-for="item in column">
        <component
          :is="checkComponent(item.vueComp)"
          v-bind="item.data"
          :key="item.props.id"
          class="component"
        />
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { LayoutOptions, type CompData, type ComponentMetaData } from "@/types";
import { computed, ref, type Ref } from "@vue/composition-api";
import {
  AlertMessage,
  CalendarWidget,
  ColumnLayout,
  ContactForm,
  DocumentList,
  ImageCarousel,
  ItemList,
  MessageStream,
  PageHeader,
  PlainText,
  RequestForm,
  RichText,
  VideoEmbed,
  NonexistentComponent
} from "@/components/asyncComponents";
import { displayPageAlert } from "@/plugins/errorHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import { useRoute } from "@/plugins/contextInject";

interface Props {
  layout: LayoutOptions;
  metaData: ComponentMetaData;
}
const props = withDefaults(defineProps<Props>(), {
  layout: LayoutOptions.TWO_COLUMNS,
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  }
});

const column1: Ref<CompData[]> = ref([]);
const column2: Ref<CompData[]> = ref([]);
const column3: Ref<CompData[]> = ref([]);

const route = useRoute();

const columns = computed(() => {
  if (column3.value.length > 0) {
    return [column1.value, column2.value, column3.value];
  } else {
    return [column1.value, column2.value];
  }
});
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
    case "VideoEmbed":
      return VideoEmbed;
    default:
      return NonexistentComponent;
  }
};

const getComponentData = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, query, orderBy, where } = await import(
      "firebase/firestore/lite"
    );
    for (let i = 1; i <= 3; i++) {
      const column = await getDocs(
        query(
          collection(
            firestore,
            `pages/${route.params.SpecialPage}/components/${props.metaData.id}/col${i}`
          ),
          orderBy("index", "asc"),
          where("data.hidden", "==", false)
        )
      );
      column.forEach((component) => {
        const data = component.data();
        if (i === 1) {
          column1.value.push(data as CompData);
        } else if (i === 2) {
          column2.value.push(data as CompData);
        } else if (i === 3) {
          column3.value.push(data as CompData);
        }
      });
    }
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the page data: ${rawError.message}`
    );
  }
};

getComponentData();
</script>

<style lang="scss" scoped>
.col-12 .component:not(:last-child) {
  margin-bottom: 24px;
}
</style>
