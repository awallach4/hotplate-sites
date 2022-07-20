<template>
  <div class="sign-ups">
    <v-row>
      <v-col cols="12" md="4">
        <v-card color="card">
          <v-card-title class="cardtext--text">Signup Sheets</v-card-title>
          <v-card-text class="cardtext--text">
            <v-list color="card">
              <v-list-item-group
                v-model="currentSheet"
                mandatory
                color="secondary"
              >
                <v-list-item v-for="(list, index) in signupSheets" :key="index">
                  {{ list.header.length > 0 ? list.header : "Untitled" }}
                </v-list-item>
                <v-list-item v-if="signupSheets.length < 1"
                  >No signup sheets are available.</v-list-item
                >
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="signupSheets.length > 0" cols="12" md="8">
        <template v-for="(list, index) in signupSheets">
          <signup-sheet
            v-if="index === currentSheet"
            :key="list.id"
            :data="signupSheets[index]"
            :db-path="`pages/${$route.params.BasePage}/components/${metaData.id}/signup-sheets/${list.id}/signups`"
          />
        </template>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentMetaData, SignupData } from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import { SignupSheet } from "@/components/asyncComponents";
import type { FirestoreError } from "firebase/firestore/lite";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import { useRoute } from "@/plugins/contextInject";

interface Props {
  metaData: ComponentMetaData;
}
const props = withDefaults(defineProps<Props>(), {
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  }
});

const currentSheet = ref(0);
const signupSheets: Ref<SignupData[]> = ref([]);

const route = useRoute();

const getSheets = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, orderBy, query, where } = await import(
      "firebase/firestore/lite"
    );
    const sheets = await getDocs(
      query(
        collection(
          firestore,
          `pages/${route.params.BasePage}/components/${props.metaData.id}/signup-sheets`
        ),
        orderBy("created", "desc"),
        where("hidden", "==", false)
      )
    );

    signupSheets.value = [];

    sheets.forEach((sheet) => {
      const data = sheet.data() as SignupData;
      signupSheets.value.push(data);
    });
  } catch (error) {
    displayPageAlert(
      `An error occurred while getting the signup sheets: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

getSheets();
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
