<template>
  <card-wrap :is-elevated="useCard" :header="header" class="document-list">
    <ul>
      <li v-for="doc in storPath" :key="doc.url">
        <a
          :href="doc.url"
          target="_blank"
          rel="noreferrer noopener nofollow"
          :download="doc.name"
          >{{ doc.name }}</a
        >
      </li>
    </ul>
  </card-wrap>
</template>

<script lang="ts" setup>
import type { UploadedFile } from "@/types";

interface Props {
  header?: string;
  storPath?: UploadedFile[];
  useCard?: boolean;
}
withDefaults(defineProps<Props>(), {
  header: "",
  storPath: () => [],
  useCard: true
});
</script>
