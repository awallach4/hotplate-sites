<template>
  <div id="dashboard">
    <v-card class="pa-5 mb-5" color="primary darken-2" min-height="300px">
      <v-overlay class="pa-5" absolute z-index="1" opacity="0.6">
        <v-row justify="center" align="center">
          <v-col class="text-center" cols="12">
            <h1 class="display-2 font-weight-thin mb-4">
              {{ pageData.head }}
            </h1>
            <h2 class="subheading">
              {{ pageData.sub }}
            </h2>
          </v-col>
        </v-row>
      </v-overlay>
    </v-card>
    <v-card color="card">
      <v-card-title class="cardtext--text">
        {{ pageData.section }}
      </v-card-title>
      <v-card-text class="cardtext--text">
        <div v-html="sanitized(pageData.content)" />
        <div
          v-if="isAdmin && pageData.privContent"
          v-html="sanitized(pageData.privContent)"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";
import { usePages } from "@/store/pages";
import { ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
import { isAdmin } from "@/plugins/authHandler";
import { displayPageAlert } from "@/plugins/errorHandler";

interface DocumentationData {
  head: string;
  sub: string;
  section: string;
  content: string;
  privContent?: string;
}

const pageData = ref({} as DocumentationData);

const getDocumentation = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const pageDoc = await getDoc(doc(firestore, "configuration/documentation"));
    const data = pageDoc.data() as DocumentationData;
    if (data) {
      pageData.value = data;
    } else {
      pageData.value = {
        head: "Welcome to Hotplate Console",
        sub: "An Open Source Site Builder",
        section: "No Content",
        content: "This page has no content.  Check back later."
      };
    }
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the documentation: ${rawError.message}`
    );
    pageData.value = {
      head: "Welcome to Hotplate Console",
      sub: "An Open Source Content Site Builder",
      section: "No Content",
      content: "This page has no content.  Check back later."
    };
  }
};

getDocumentation();
const PagesModule = usePages();
PagesModule.viewPage("/", "Documentation", false);
</script>
