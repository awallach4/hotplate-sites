<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Document List"
    :header="retVal.header || 'List of Documents'"
    class="document-list"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-switch
        v-model="retVal.useCard"
        color="secondary"
        label="Create Card on Page"
      />
      <v-text-field
        v-model="retVal.header"
        color="secondary"
        filled
        label="Header"
        :disabled="dragging"
      />
      <h3>Files</h3>
      <v-chip-group
        v-model="docDel"
        multiple
        column
        active-class="secondary--text"
      >
        <v-chip v-for="doc in retVal.storPath" :key="doc.url">
          {{ doc.name }}
        </v-chip>
      </v-chip-group>
      <v-file-input
        ref="fileInput"
        v-model="docFile"
        label="File Uploads"
        prepend-inner-icon="mdi-paperclip"
        prepend-icon=""
        multiple
        filled
        color="secondary"
        :disabled="(uploadProgress !== 0 && uploadProgress !== 100) || dragging"
      />
      <v-progress-linear
        :active="uploadProgress !== 0"
        background-opacity=".3"
        buffer-value="100"
        height="4"
        rounded
        :value="uploadProgress"
        color="secondary"
      />
      <v-spacer v-if="uploadProgress !== 0" />
      <v-btn
        color="secondary"
        class="sectext--text"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!canUpload"
        @click="uploadDocuments"
        >Upload</v-btn
      >
      <v-spacer v-if="$vuetify.breakpoint.name === 'xs'" />
      <v-btn
        color="error"
        class="errtext--text"
        :class="{ 'ml-5': $vuetify.breakpoint.name !== 'xs' }"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!canRemove"
        @click="rmDocs"
        >Delete Selected</v-btn
      >
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import type { ComponentMetaData, UploadedFile } from "@/types";
import { computed, onUpdated, ref, type Ref } from "@vue/composition-api";

interface DocumentListData {
  header: string;
  storPath: UploadedFile[];
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: DocumentListData;
}

interface Emits {
  (e: "input", payload: DocumentListData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  },
  value: () => {
    return {
      header: "",
      storPath: [],
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const docFile: Ref<File[]> = ref([]);
const docDel: Ref<UploadedFile[]> = ref([]);
const uploadProgress = ref(0);

const canUpload = computed(() => {
  return (
    docFile.value.length > 0 &&
    (uploadProgress.value === 0 || uploadProgress.value === 100)
  );
});

const canRemove = computed(() => {
  return docDel.value.length > 0;
});

const updateData = () => {
  emit("input", retVal.value);
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL FILES WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }
  retVal.value.storPath.forEach(async (doc) => {
    try {
      await deleteFile(doc.url);
    } catch (error) {
      displayPageAlert(
        `An error occurred while deleting the file(s): ${error}`
      );
    }
  });
  emit("delete");
};

defineExpose({ deleteSelf });

const uploadDocuments = () => {
  docFile.value.forEach(async (doc) => {
    const fileURL = await uploadFile(
      `${props.metaData.storPath}/${doc.name}`,
      doc,
      (url) => {
        const index = retVal.value.storPath.map((e) => e.url).indexOf(url);
        retVal.value.storPath.splice(index, 1);
      },
      (snapshot) => {
        uploadProgress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }
    );
    try {
      uploadProgress.value = 100;
      retVal.value.storPath.push({ name: doc.name, url: fileURL });
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the file URL(s): ${error}`
      );
    }
  });
  docFile.value = [];
  uploadProgress.value = 0;
};

const rmDocs = () => {
  if (canRemove.value) {
    if (
      confirm(
        "You are about to delete the selected items.  Do you wish to proceed?"
      )
    ) {
      docDel.value.forEach(async (doc) => {
        try {
          const index = retVal.value.storPath.indexOf(doc);
          const selected = retVal.value.storPath[index];
          await deleteFile(selected.url);
          retVal.value.storPath.splice(index, 1);
          const indexd = docDel.value.indexOf(doc);
          docDel.value.splice(indexd, 1);
        } catch (error) {
          displayPageAlert(
            `An error occurred while deleting the file(s): ${error}`
          );
        }
      });
    }
  } else {
    displayPageAlert("Please select some items to delete");
  }
};

onUpdated(() => {
  updateData();
});

updateData();
</script>
