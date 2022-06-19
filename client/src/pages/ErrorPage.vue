<template>
  <div id="error">
    <v-card color="card" max-width="400px" class="ma-auto">
      <v-card-subtitle class="pb-0">404</v-card-subtitle>
      <v-card-title class="cardtext--text pt-1"
        >Well... This can't be good!</v-card-title
      >
      <v-card-text class="cardtext--text">
        An error occurred while processing your request...
      </v-card-text>
      <v-card-actions>
        <v-btn block color="success" class="suctext--text" to="/"
          >Back to Homepage</v-btn
        >
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { usePages } from "@/store/pages";

const PagesModule = usePages();
PagesModule.viewPage("/error", "Error", true);
</script>
