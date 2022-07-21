<template>
  <card-wrap :is-elevated="useCard" :header="header" class="item-list">
    <component :is="type">
      <li v-for="item in items" :key="item.id">
        {{ item.content }}
      </li>
    </component>
  </card-wrap>
</template>

<script lang="ts" setup>
import type { ItemListItem } from "@/types";
import { computed } from "vue";

interface Props {
  header?: string;
  items?: ItemListItem[];
  ordered?: boolean;
  useCard?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  header: "",
  items: () => [],
  ordered: false,
  useCard: true
});
const type = computed(() => {
  if (props.ordered) {
    return "ol";
  } else {
    return "ul";
  }
});
</script>
