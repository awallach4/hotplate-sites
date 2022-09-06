<template>
  <div class="base-page">
    <v-expansion-panels v-if="currentPage">
      <v-expansion-panel color="card">
        <v-expansion-panel-header class="cardtext--text">
          <h1>Page Settings</h1>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="cardtext-text">
          <v-select
            v-model="currentPage.permissions"
            label="Page Visibility"
            :items="permissions"
            :hint="
              siteSettings.defaultPage === currentPage.dbPath
                ? 'You cannot change the visibility of the default page.'
                : 'Only the users that meet these criteria will be able to view this page.  Other users will not be able to access the page or its data.'
            "
            persistent-hint
            filled
            color="secondary"
            item-color="secondary"
            :rules="[fieldRequired]"
            :disabled="siteSettings.defaultPage === currentPage.dbPath"
          />
          <v-btn
            color="error"
            class="errtext--text"
            :disabled="siteSettings.defaultPage === currentPage.dbPath"
            @click="deletePage"
          >
            Delete Page
          </v-btn>
          <p
            v-if="siteSettings.defaultPage === currentPage.dbPath"
            class="my-1 text-caption text--disabled"
          >
            You cannot delete the default page.
          </p>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-spacer />
    <draggable
      v-model="pageData.components"
      ghost-class="elevation-10"
      style="width: 100%"
      handle=".handle"
      group="components"
      :animation="200"
      :move="moveItem"
      @start="dragging = true"
      @end="dragging = false"
    >
      <component
        :is="checkComponent(component.vueComp)"
        v-for="(component, index) in pageData.components"
        :key="component.props.id"
        ref="componentElement"
        v-model="component.data"
        :meta-data="component.props"
        :can-delete="true"
        :db-path="currentPage.dbPath"
        :dragging="dragging"
        @delete="removeComponent(index)"
      />
    </draggable>
    <v-dialog v-model="newComponentDialog" persistent max-width="400px">
      <template #activator="{ on: dialog, attrs }">
        <v-tooltip top>
          <template #activator="{ on: tooltip }">
            <v-btn
              v-bind="attrs"
              fab
              fixed
              bottom
              right
              color="secondary"
              class="sectext--text mt-6"
              v-on="{ ...dialog, ...tooltip }"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          Add Component
        </v-tooltip>
      </template>
      <v-card>
        <v-card-title>New Component</v-card-title>
        <v-card-text>
          <v-form
            id="newComponentForm"
            ref="newComponentForm"
            @submit.prevent="addComponent"
          >
            <v-select
              v-model="newComponentType"
              label="Component Type"
              :items="componentOptions"
              filled
              color="secondary"
              item-color="secondary"
              :rules="[fieldRequired]"
              validate-on-blur
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            class="cardtext--text ml-auto"
            @click="newComponentDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            form="newComponentForm"
            color="secondary"
            class="sectext--text ml-2"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import draggable from "vuedraggable";
import { computed, ref, watch, type Ref } from "vue";
import {
  PermissionGroups,
  type CompData,
  type PageData,
  type PageConfig,
  type VFormOptions
} from "@/types";
import { useSettings } from "@/store/settings";
import { usePages } from "@/store/pages";
import { useRoute } from "vue-router/composables";
import type { FirestoreError } from "firebase/firestore/lite";
import { fieldRequired } from "@/plugins/formRules";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import { pushRouter, pages } from "@/plugins/routerStoreHelpers";
import { permissions } from "@/plugins/authHandler";
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
  RichText,
  SignupSheetCollection,
  VideoEmbed,
  NonexistentComponent
} from "@/components/asyncComponents";

const pageData: Ref<PageData> = ref({
  components: []
});
const newComponentDialog = ref(false);
const newComponentType = ref("");
const dragging = ref(false);
const newComponentForm = ref({} as VFormOptions);
const route = useRoute();
const deletedComponents: Ref<CompData[]> = ref([]);
const componentElement: Ref<
  { save: () => void; deleteSelf: (ask: boolean) => void }[]
> = ref([]);

const currentPage = computed({
  get: () => {
    return pages.value[parseInt(route.params.index)];
  },
  set: (page: PageConfig) => {
    pages.value[parseInt(route.params.index)] = page;
  }
});

const siteSettings = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.siteSettings;
});

const dbPath = computed(() => {
  return (
    (currentPage.value.dbPath[0] === "/" ? "" : "/") + currentPage.value.dbPath
  );
});

const componentOptions = computed(() => {
  const components = [
    {
      text: "Header",
      value: "PageHeader"
    },
    {
      text: "Plain Text",
      value: "PlainText"
    },
    {
      text: "Rich Text",
      value: "RichText"
    },
    {
      text: "Alert Message",
      value: "AlertMessage"
    },
    {
      text: "Column Layout",
      value: "ColumnLayout"
    },
    {
      text: "Image Carousel",
      value: "ImageCarousel"
    },
    {
      text: "Embedded Video",
      value: "VideoEmbed"
    },
    {
      text: "List",
      value: "ItemList"
    },
    {
      text: "List of Documents",
      value: "DocumentList"
    },
    {
      text: "Signup Sheet Collection",
      value: "SignupSheetCollection"
    },
    {
      text: "Message Stream",
      value: "MessageStream"
    }
  ];

  if (siteSettings.value.useCalendar) {
    components.push({
      text: "Google Calendar",
      value: "CalendarWidget"
    });
  }

  if (siteSettings.value.useEmail) {
    components.push({
      text: "Contact Form",
      value: "ContactForm"
    });
  }

  return components;
});

watch(newComponentDialog, (newValue) => {
  if (!newValue) {
    newComponentForm.value.reset();
  }
});

watch(
  () => pageData.value.components,
  (newValue, oldValue) => {
    if (oldValue.length > newValue.length) {
      const deletedItems = oldValue.filter(
        (value) => !newValue.includes(value)
      );
      deletedItems.forEach((item) => {
        deletedComponents.value.push(item);
      });
    } else if (newValue.length > oldValue.length) {
      const addedItems = newValue.filter((value) => !oldValue.includes(value));
      addedItems.forEach((item) => {
        if (deletedComponents.value.includes(item)) {
          deletedComponents.value.splice(
            deletedComponents.value.indexOf(item),
            1
          );
        }
      });
    }
  }
);

const save = async (
  callback: () => void,
  err = (e: FirestoreError) => {
    displayPageAlert(`An error occurred while saving: ${getFirestoreError(e)}`);
  }
) => {
  try {
    const SettingsModule = useSettings();
    await SettingsModule.getSettings();
    if (
      currentPage.value.dbPath === siteSettings.value.defaultPage &&
      currentPage.value.permissions !== PermissionGroups.PUBLIC
    ) {
      displayPageAlert("You cannot change the visibility of the default page.");
      currentPage.value.permissions = PermissionGroups.PUBLIC;
      return;
    }
    const { firestore } = await import("@/plugins/firebase");
    const { deleteDoc, doc, setDoc } = await import("firebase/firestore/lite");
    await setDoc(doc(firestore, `pages${dbPath.value}`), currentPage.value, {
      merge: true
    });
    pageData.value.components.forEach(async (component, index) => {
      if (
        component.vueComp === "ColumnLayout" ||
        component.vueComp === "SignupSheetCollection"
      ) {
        componentElement.value.forEach((element) => {
          if (element.save) {
            element.save();
          }
        });
      }
      const data = {
        ...component,
        index
      };
      await setDoc(
        doc(firestore, `pages${dbPath.value}/components/${component.props.id}`),
        data,
        { merge: true }
      );
    });
    deletedComponents.value.forEach(async (component) => {
      await deleteDoc(
        doc(firestore, `pages${dbPath.value}/components/${component.props.id}`)
      );
    });
    deletedComponents.value = [];
    callback();
  } catch (error) {
    err(error as FirestoreError);
  }
};

defineExpose({
  save
});

const moveItem = (evt: { to: HTMLElement; dragged: HTMLElement }) => {
  if (evt.to.classList.contains("column-layout-column")) {
    if (evt.dragged.classList.contains("column-layout")) {
      displayPageAlert("This component cannot be placed in a column layout.");
      return false;
    } else if (evt.dragged.classList.contains("message-stream")) {
      displayPageAlert("This component cannot be placed in a column layout.");
      return false;
    } else if (evt.dragged.classList.contains("page-header")) {
      displayPageAlert("This component cannot be placed in a column layout.");
      return false;
    } else if (evt.dragged.classList.contains("signup-sheet-collection")) {
      displayPageAlert("This component cannot be placed in a column layout.");
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
};

const addComponent = async () => {
  const isValid = newComponentForm.value.validate();
  if (!isValid) {
    return;
  }
  if (pageData.value.components) {
    const { generateString } = await import("@/plugins/stringGenerator");
    pageData.value.components.push({
      vueComp: newComponentType.value,
      props: {
        id: generateString(20),
        storPath: `pages${currentPage.value.dbPath}`
      }
    });
  }
  newComponentDialog.value = false;
};

const removeComponent = (index: number) => {
  deletedComponents.value.push(pageData.value.components[index]);
  pageData.value.components.splice(index, 1);
};

const deletePage = async () => {
  const SettingsModule = useSettings();
  await SettingsModule.getSettings();
  if (currentPage.value.dbPath === siteSettings.value.defaultPage) {
    displayPageAlert("You cannot delete the default page!");
    return;
  }
  if (!confirm("Are you sure you want to delete this page?")) {
    return;
  }
  try {
    componentElement.value.forEach((component) => {
      component.deleteSelf(false);
    });
    const index = pages.value.indexOf(currentPage.value);
    const { firestore, storage } = await import("@/plugins/firebase");
    const { collection, doc, deleteDoc, getDocs, increment, updateDoc } =
      await import("firebase/firestore/lite");
    const {
      ref: storageRef,
      listAll,
      deleteObject
    } = await import("firebase/storage");
    const components = await getDocs(
      collection(firestore, `pages${currentPage.value.dbPath}/components`)
    );
    components.forEach((component) => {
      deleteDoc(component.ref);
    });
    await deleteDoc(doc(firestore, `pages${currentPage.value.dbPath}`));
    const files = await listAll(
      storageRef(storage, `/pages${currentPage.value.dbPath}`)
    );
    files.items.forEach((file) => {
      deleteObject(file);
    });
    const pageDocs = await getDocs(collection(firestore, "pages"));
    pageDocs.forEach((page) => {
      const data = page.data();
      if (data.index > index) {
        updateDoc(page.ref, {
          index: increment(-1)
        });
      }
    });
    pages.value.splice(index, 1);
    pushRouter("/");
  } catch (error) {
    displayPageAlert(
      `An error occurred while deleting the page: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
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

const getPageData = async () => {
  try {
    const SettingsModule = useSettings();
    SettingsModule.canSave = true;
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, query, orderBy } = await import(
      "firebase/firestore/lite"
    );
    const pageDocs = await getDocs(
      query(
        collection(firestore, `pages${dbPath.value}/components`),
        orderBy("index", "asc")
      )
    );
    pageDocs.forEach((pageDoc) => {
      const data = pageDoc.data();
      pageData.value.components.push(data as CompData);
    });
  } catch (error) {
    pushRouter("/error");
  }
};

getPageData();
const PagesModule = usePages();
PagesModule.viewPage(currentPage.value.dbPath, currentPage.value.name, false);
</script>

<style lang="scss">
.base-page {
  .d-flex:not(:first-child) {
    margin-top: 24px;
  }
}
</style>
