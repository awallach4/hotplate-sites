<template>
  <div class="sign-ups">
    <v-row>
      <v-col cols="12" md="4">
        <v-card color="card">
          <v-card-title class="cardtext--text">Signup Sheets</v-card-title>
          <v-card-text class="cardtext--text">
            <v-list color="card">
              <v-list-item-group v-model="sheet" mandatory color="secondary">
                <v-list-item v-for="(list, index) in sheets" :key="index">
                  {{ list.header.length > 0 ? list.header : "Untitled" }}
                </v-list-item>
                <v-list-item v-if="sheets.length < 1"
                  >No signup sheets are available.</v-list-item
                >
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="sheets.length > 0" cols="12" md="8">
        <template v-for="(list, index) in sheets">
          <signup-sheet
            v-if="index === sheet"
            :key="list.id"
            :data="sheets[index]"
            :db-path="`pages/${$route.params.SpecialPage}/components/${metaData.id}/${list.id}-signups`"
          />
        </template>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentMetaData, SignupData } from "@/types";
import { ref } from "@vue/composition-api";
import { SignupSheet } from "@/components/asyncComponents";

interface Props {
  sheets: SignupData[];
  metaData: ComponentMetaData;
}
withDefaults(defineProps<Props>(), {
  sheets: () => [] as SignupData[],
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  }
});

const sheet = ref(0);
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
