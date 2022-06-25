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
                <v-list-item-group
                  v-model="currentSheet"
                  mandatory
                  color="secondary"
                >
                  <v-list-item
                    v-for="(list, index) in signupSheets"
                    :key="index"
                  >
                    {{ list.header.length > 0 ? list.header : "Untitled" }}
                  </v-list-item>
                  <v-list-item v-if="signupSheets.length < 1"
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
        <v-col v-if="signupSheets.length > 0" cols="12" md="8">
          <template v-for="(list, index) in signupSheets">
            <signup-sheet
              v-if="index === currentSheet"
              :key="list.id"
              v-model="signupSheets[index]"
              :db-path="`pages${dbPath}/components/${metaData.id}/signup-sheets/${list.id}/signups`"
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
import { onUpdated, ref, type Ref } from "@vue/composition-api";
import type { ComponentMetaData, SignupData } from "@/types";
import type { FirestoreError } from "firebase/firestore/lite";
import { displayPageAlert } from "@/plugins/errorHandler";

interface SignupSheetCollectionData {
  hidden: boolean;
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
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const currentSheet = ref(0);
const signupSheets: Ref<SignupData[]> = ref([]);

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
    const { doc, setDoc } = await import("firebase/firestore/lite");
    signupSheets.value.forEach(async (sheet) => {
      await setDoc(
        doc(
          firestore,
          `pages${props.dbPath}/components/${props.metaData.id}/signup-sheets/${sheet.id}`
        ),
        sheet
      );
    });
  } catch (error) {
    err(error as FirestoreError);
  }
};

const getSheets = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, orderBy, query } = await import(
      "firebase/firestore/lite"
    );
    const sheets = await getDocs(
      query(
        collection(
          firestore,
          `pages${props.dbPath}/components/${props.metaData.id}/signup-sheets`
        ),
        orderBy("created", "desc")
      )
    );

    signupSheets.value = [];

    sheets.forEach((sheet) => {
      const data = sheet.data() as SignupData;
      signupSheets.value.push(data);
    });
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the signup sheets: ${rawError.message}`
    );
  }
};

const addSheet = async () => {
  const { generateString } = await import("@/plugins/stringGenerator");
  const { firestore } = await import("@/plugins/firebase");
  const { doc, setDoc, serverTimestamp } = await import(
    "firebase/firestore/lite"
  );
  const newSheet: SignupData = {
    enabled: true,
    header: "",
    multiple: true,
    roles: [],
    text: "",
    id: generateString(20),
    times: [],
    useCard: true,
    hidden: false,
    created: serverTimestamp()
  };

  await setDoc(
    doc(
      firestore,
      `pages${props.dbPath}/components/${props.metaData.id}/signup-sheets/${newSheet.id}`
    ),
    newSheet
  );

  await getSheets();
  updateData();
};

const removeSheet = async (index: number) => {
  const sheet = signupSheets.value[index];
  const { firestore } = await import("@/plugins/firebase");
  const { collection, deleteDoc, doc, getDocs } = await import(
    "firebase/firestore/lite"
  );
  const docs = await getDocs(
    collection(
      firestore,
      `pages${props.dbPath}/components/${props.metaData.id}/signup-sheets/${sheet.id}/signups`
    )
  );
  docs.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });

  await deleteDoc(
    doc(
      firestore,
      `pages${props.dbPath}/components/${props.metaData.id}/signup-sheets/${sheet.id}`
    )
  );

  await getSheets();
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

  signupSheets.value.forEach((sheet) => {
    removeSheet(signupSheets.value.indexOf(sheet));
  });
  emit("delete");
};

defineExpose({ save, deleteSelf });

onUpdated(() => {
  updateData();
});

getSheets();
updateData();
</script>
