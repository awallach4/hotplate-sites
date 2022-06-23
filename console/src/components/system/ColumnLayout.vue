<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="true"
    :can-delete="canDelete"
    name="Column Layout"
    header="Column Layout"
    class="column-layout"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-select
        v-model="retVal.layout"
        :items="layouts"
        label="Layout"
        filled
        color="secondary"
        item-color="secondary"
        :persistent-hint="retVal.layout === 'threeCol' && col3.length > 0"
        :disabled="retVal.layout === 'threeCol' && col3.length > 0"
        :hint="
          retVal.layout === 'threeCol' && col3.length > 0
            ? 'Column 3 must be empty to change the column type.'
            : ''
        "
      />
      <v-row>
        <v-col
          cols="12"
          :md="retVal.layout === 'threeCol' ? '4' : '6'"
          :class="{ 'drag-col': drag }"
        >
          <h2>Column 1</h2>
          <v-spacer />
          <draggable
            v-model="col1"
            class="column-layout-column"
            ghost-class="elevation-10"
            style="width: 100%; height: 100%"
            group="components"
            handle=".handle"
            :animation="200"
            @start="drag = true"
            @end="drag = false"
          >
            <component
              :is="checkComponent(item.vueComp)"
              v-for="(item, index) in col1"
              :key="col1[index].props.id"
              ref="col1Element"
              v-model="col1[index].data"
              :meta-data="col1[index].props"
              :can-delete="true"
              :dragging="dragging || drag"
              @delete="removeComp(index, 'col1')"
            />
          </draggable>
        </v-col>
        <v-col
          cols="12"
          :md="retVal.layout === 'threeCol' ? '4' : '6'"
          :class="{ 'drag-col': drag }"
        >
          <h2>Column 2</h2>
          <v-spacer />
          <draggable
            v-model="col2"
            class="column-layout-column"
            ghost-class="elevation-10"
            style="width: 100%; height: 100%"
            handle=".handle"
            group="components"
            :animation="200"
            @start="drag = true"
            @end="drag = false"
          >
            <component
              :is="checkComponent(item.vueComp)"
              v-for="(item, index) in col2"
              :key="col2[index].props.id"
              ref="col2Element"
              v-model="col2[index].data"
              :meta-data="col2[index].props"
              :can-delete="true"
              :dragging="dragging || drag"
              @delete="removeComp(index, 'col2')"
            />
          </draggable>
        </v-col>
        <v-col
          v-if="retVal.layout === 'threeCol'"
          cols="12"
          md="4"
          :class="{ 'drag-col': drag }"
        >
          <h2>Column 3</h2>
          <v-spacer />
          <draggable
            v-model="col3"
            class="column-layout-column"
            ghost-class="elevation-10"
            style="width: 100%; height: 100%"
            handle=".handle"
            group="components"
            :animation="200"
            @start="drag = true"
            @end="drag = false"
          >
            <component
              :is="checkComponent(item.vueComp)"
              v-for="(item, index) in col3"
              :key="col3[index].props.id"
              ref="col3Element"
              v-model="col3[index].data"
              :meta-data="col3[index].props"
              :can-delete="true"
              :dragging="dragging || drag"
              @delete="removeComp(index, 'col3')"
            />
          </draggable>
        </v-col>
      </v-row>
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import draggable from "vuedraggable";
import type { CompData, ComponentMetaData, VSelectValues } from "@/types";
import { onUpdated, ref, watch, type Ref } from "@vue/composition-api";
import { displayPageAlert } from "@/plugins/errorHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import {
  AlertMessage,
  CalendarWidget,
  ContactForm,
  DocumentList,
  ImageCarousel,
  ItemList,
  NonexistentComponent,
  PlainText,
  RequestForm,
  RichText,
  VideoEmbed
} from "@/components/asyncComponents";

interface ColumnLayoutData {
  layout: string;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  dbPath: string;
  metaData: ComponentMetaData;
  value: ColumnLayoutData;
}

interface Emits {
  (e: "input", payload: ColumnLayoutData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  dbPath: "",
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  },
  value: () => {
    return {
      layout: "twoCol",
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const layouts: VSelectValues[] = [
  {
    text: "Two Columns",
    value: "twoCol"
  },
  {
    text: "Three Columns",
    value: "threeCol"
  }
];

const retVal = ref(props.value);
const drag = ref(false);
const col1: Ref<CompData[]> = ref([]);
const col2: Ref<CompData[]> = ref([]);
const col3: Ref<CompData[]> = ref([]);
const deletedCol1: Ref<CompData[]> = ref([]);
const deletedCol2: Ref<CompData[]> = ref([]);
const deletedCol3: Ref<CompData[]> = ref([]);

const col1Element: Ref<
  { save: () => void; deleteSelf: (ask: boolean) => void }[]
> = ref([]);
const col2Element: Ref<
  { save: () => void; deleteSelf: (ask: boolean) => void }[]
> = ref([]);
const col3Element: Ref<
  { save: () => void; deleteSelf: (ask: boolean) => void }[]
> = ref([]);

watch(
  () => col1.value,
  (newValue, oldValue) => {
    if (oldValue.length > newValue.length) {
      const deletedItems = oldValue.filter(
        (value) => !newValue.includes(value)
      );
      deletedItems.forEach((item) => {
        deletedCol1.value.push(item);
      });
    } else if (newValue.length > oldValue.length) {
      const addedItems = newValue.filter((value) => !oldValue.includes(value));
      addedItems.forEach((item) => {
        if (deletedCol1.value.includes(item)) {
          deletedCol1.value.splice(deletedCol1.value.indexOf(item), 1);
        }
      });
    }
  }
);

watch(
  () => col2.value,
  (newValue, oldValue) => {
    if (oldValue.length > newValue.length) {
      const deletedItems = oldValue.filter(
        (value) => !newValue.includes(value)
      );
      deletedItems.forEach((item) => {
        deletedCol2.value.push(item);
      });
    } else if (newValue.length > oldValue.length) {
      const addedItems = newValue.filter((value) => !oldValue.includes(value));
      addedItems.forEach((item) => {
        if (deletedCol2.value.includes(item)) {
          deletedCol2.value.splice(deletedCol2.value.indexOf(item), 1);
        }
      });
    }
  }
);

watch(
  () => col3.value,
  (newValue, oldValue) => {
    if (oldValue.length > newValue.length) {
      const deletedItems = oldValue.filter(
        (value) => !newValue.includes(value)
      );
      deletedItems.forEach((item) => {
        deletedCol3.value.push(item);
      });
    } else if (newValue.length > oldValue.length) {
      const addedItems = newValue.filter((value) => !oldValue.includes(value));
      addedItems.forEach((item) => {
        if (deletedCol3.value.includes(item)) {
          deletedCol3.value.splice(deletedCol3.value.indexOf(item), 1);
        }
      });
    }
  }
);

const updateData = () => {
  emit("input", retVal.value);
};

const save = async (
  err = (e: FirestoreError) => {
    displayPageAlert(`An error occurred while saving: ${e.message}`);
  }
) => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { deleteDoc, doc, setDoc } = await import("firebase/firestore/lite");
    const writeColumn = (column: CompData[], columnNumber: number) => {
      column.forEach(async (item, itemIndex) => {
        const data = {
          ...item,
          index: itemIndex
        };
        await setDoc(
          doc(
            firestore,
            `pages${props.dbPath}/components/${props.metaData.id}/col${columnNumber}/${item.props.id}`
          ),
          data
        );
      });
    };

    const deleteColumn = (column: CompData[], columnNumber: number) => {
      column.forEach(async (item) => {
        await deleteDoc(
          doc(
            firestore,
            `pages${props.dbPath}/components/${props.metaData.id}/col${columnNumber}/${item.props.id}`
          )
        );
      });
      column = [];
    };

    deleteColumn(deletedCol1.value, 1);
    deleteColumn(deletedCol2.value, 2);
    deleteColumn(deletedCol3.value, 3);

    writeColumn(col1.value, 1);
    writeColumn(col2.value, 2);
    writeColumn(col3.value, 3);

    deletedCol1.value = [];
    deletedCol2.value = [];
    deletedCol3.value = [];
  } catch (error) {
    err(error as FirestoreError);
  }
};

const removeComp = (index: number, col: string) => {
  if (col === "col1") {
    deletedCol1.value.push(col1.value[index]);
    col1.value.splice(index, 1);
  } else if (col === "col2") {
    deletedCol2.value.push(col2.value[index]);
    col2.value.splice(index, 1);
  } else if (col === "col3") {
    deletedCol3.value.push(col3.value[index]);
    col3.value.splice(index, 1);
  }
};

const checkComponent = (component: string) => {
  switch (component) {
    case "AlertMessage":
      return AlertMessage;
    case "CalendarWidget":
      return CalendarWidget;
    case "ContactForm":
      return ContactForm;
    case "DocumentList":
      return DocumentList;
    case "ImageCarousel":
      return ImageCarousel;
    case "ItemList":
      return ItemList;
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
    const { collection, getDocs, query, orderBy } = await import(
      "firebase/firestore/lite"
    );
    for (let i = 1; i <= 3; i++) {
      const column = await getDocs(
        query(
          collection(
            firestore,
            `pages${props.dbPath}/components/${props.metaData.id}/col${i}`
          ),
          orderBy("index", "asc")
        )
      );
      column.forEach((component) => {
        const data = component.data();
        if (i === 1) {
          col1.value.push(data as CompData);
        } else if (i === 2) {
          col2.value.push(data as CompData);
        } else if (i === 3) {
          col3.value.push(data as CompData);
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

const deleteSelf = async (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL COMPONENTS IN ITS COLUMNS WILL BE PERMANENTLY DELETED, REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  col1Element.value.forEach((component) => {
    component.deleteSelf(false);
  });
  col2Element.value.forEach((component) => {
    component.deleteSelf(false);
  });
  col3Element.value.forEach((component) => {
    component.deleteSelf(false);
  });

  const { firestore } = await import("@/plugins/firebase");
  const { deleteDoc, doc } = await import("firebase/firestore/lite");
  const deleteColumn = (column: CompData[], columnNumber: number) => {
    column.forEach(async (item) => {
      await deleteDoc(
        doc(
          firestore,
          `pages${props.dbPath}/components/${props.metaData.id}/col${columnNumber}/${item.props.id}`
        )
      );
    });
  };

  deleteColumn(col1.value, 1);
  deleteColumn(col2.value, 2);
  deleteColumn(col3.value, 3);
  deleteColumn(deletedCol1.value, 1);
  deleteColumn(deletedCol2.value, 2);
  deleteColumn(deletedCol3.value, 3);

  emit("delete");
};

defineExpose({ save, deleteSelf });

onUpdated(() => {
  updateData();
});

getComponentData();
updateData();
</script>

<style lang="scss" scoped>
.v-card__text {
  padding: 0 24px 24px 24px;
}

.theme--light .drag-col {
  border: dashed 1px var(--v-card-darken1);
}

.theme--dark .drag-col {
  border: dashed 1px var(--v-card-lighten1);
}
</style>
