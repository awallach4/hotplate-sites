<template>
  <v-card
    class="pa-5 mb-5 header"
    color="primary darken-2"
    :style="{
      height: `calc(${isFull}vh - ${isMobile}px)`,
      backgroundImage: `url(${storPath})`
    }"
  >
    <v-overlay absolute z-index="1" opacity="0.6">
      <v-row justify="center" align="center" class="ma-0">
        <v-col class="text-center" cols="12">
          <h1 class="display-2 font-weight-thin mb-4">
            {{ head }}
          </h1>
          <h2 v-if="sub" class="subheading">
            {{ sub }}
          </h2>
        </v-col>
      </v-row>
    </v-overlay>
  </v-card>
</template>

<script lang="ts" setup>
import { useVuetify } from "@/plugins/contextInject";
import { computed } from "vue";

interface Props {
  head?: string;
  sub?: string;
  fullPage?: boolean;
  storPath?: string;
}
const props = withDefaults(defineProps<Props>(), {
  head: "",
  sub: "",
  fullPage: false,
  storPath: ""
});
const isFull = computed(() => {
  if (props.fullPage) {
    return 100;
  } else {
    return 50;
  }
});
const isMobile = computed(() => {
  const vuetify = useVuetify();
  switch (vuetify.breakpoint.name) {
    case "xs":
      return 94;
    case "sm":
      return 94;
    case "md":
      return 94;
    case "lg":
      return 100;
    case "xl":
      return 100;
    default:
      return 94;
  }
});
</script>

<style lang="scss" scoped>
.v-card {
  background-size: cover;
  background-position: center;
  min-height: 250px;
  margin-bottom: 0 !important;
}
</style>
