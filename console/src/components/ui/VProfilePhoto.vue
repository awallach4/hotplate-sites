<template>
  <v-avatar class="flex-grow-0 flex-shrink-0" :size="size">
    <v-img v-if="!imagePath" src="/profile.png" alt="Profile picture." />
    <v-img v-else :src="imagePath" alt="Profile picture." />
  </v-avatar>
</template>

<script lang="ts" setup>
interface Props {
  imagePath?: string | null;
  size?: number;
}
withDefaults(defineProps<Props>(), {
  imagePath: "",
  size: 48
});
</script>
