<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Signup Sheet Collection"
    header="Signup Sheet Collection"
    class="signup-sheet-collection"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-row>
        <v-col cols="12" md="4" class="mb-6">
          <v-card outlined>
            <v-card-title class="cardtext--text">Signup Sheets</v-card-title>
            <v-card-text class="cardtext--text">
              <v-list color="card">
                <v-list-item-group v-model="sheet" mandatory color="secondary">
                  <v-list-item
                    v-for="(list, index) in retVal.sheets"
                    :key="index"
                  >
                    {{ list.header.length > 0 ? list.header : "Untitled" }}
                  </v-list-item>
                  <v-list-item v-if="retVal.sheets.length < 1"
                    >No signup sheets are available.</v-list-item
                  >
                </v-list-item-group>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <v-btn
                    fab
                    small
                    absolute
                    bottom
                    right
                    color="secondary"
                    class="sectext--text"
                    v-on="on"
                    @click="addSheet"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </template>
                Create Signup Sheet
              </v-tooltip>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col v-if="retVal.sheets.length > 0" cols="12" md="8">
          <template v-for="(list, index) in retVal.sheets">
            <signup-sheet
              v-if="index === sheet"
              :key="list.id"
              v-model="retVal.sheets[index]"
              :db-path="`pages${dbPath}/components/${metaData.id}/${list.id}-signups`"
              :can-delete="true"
              :dragging="dragging"
              @delete="removeSheet(index)"
            />
          </template>
        </v-col>
      </v-row>
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import SignupSheet from "./SignupSheet.vue";
import { onUpdated, ref } from "@vue/composition-api";
import type { ComponentMetaData, SignupData } from "@/types";

interface SignupSheetCollectionData {
  hidden: boolean;
  sheets: SignupData[];
}

interface Props {
  dragging: boolean;
  dbPath: string;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: SignupSheetCollectionData;
}

interface Emits {
  (e: "input", payload: SignupSheetCollectionData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  dbPath: "",
  canDelete: true,
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  },
  value: () => {
    return {
      sheets: [],
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const sheet = ref(0);

const updateData = () => {
  emit("input", retVal.value);
};

const addSheet = async () => {
  const { generateString } = await import("@/plugins/stringGenerator");
  const newSheet: SignupData = {
    enabled: true,
    header: "",
    id: generateString(20),
    multiple: true,
    roles: [],
    text: "",
    times: [],
    useCard: true
  };

  retVal.value.sheets.push(newSheet);
  updateData();
};

const removeSheet = async (index: number) => {
  const sheet = retVal.value.sheets[index];
  const { firestore } = await import("@/plugins/firebase");
  const { collection, deleteDoc, getDocs } = await import(
    "firebase/firestore/lite"
  );
  const docs = await getDocs(
    collection(
      firestore,
      `pages${props.dbPath}/components/${props.metaData.id}/${sheet.id}-signups`
    )
  );
  docs.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
  retVal.value.sheets.splice(index, 1);
  updateData();
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL SIGNUP SHEETS WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  retVal.value.sheets.forEach((sheet) => {
    removeSheet(retVal.value.sheets.indexOf(sheet));
  });
  emit("delete");
};

defineExpose({ deleteSelf });

onUpdated(() => {
  updateData();
});

updateData();
</script>
