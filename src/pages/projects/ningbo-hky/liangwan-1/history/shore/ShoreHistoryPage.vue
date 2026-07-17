<script lang="ts" setup>
import type { ShoreKey } from "./config.ts"
import { computed } from "vue"
import HistoryDataPage from "../components/HistoryDataPage.vue"
import { getShoreName, shoreHistoryConfig } from "./config.ts"

const props = defineProps<{
  shore: ShoreKey
}>()

const groups = computed(() => shoreHistoryConfig[props.shore] ?? [])
const pageTitle = computed(() => `${props.shore} ${getShoreName(props.shore)}`)
</script>

<template>
  <HistoryDataPage
    :serial-number="shore"
    :title="pageTitle"
    :groups="groups"
  />
</template>
