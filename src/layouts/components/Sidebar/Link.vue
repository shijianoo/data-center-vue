<script lang="ts" setup>
import { isExternal } from "@@/utils/validate"

interface Props {
  to: string
  target?: string
}

const props = defineProps<Props>()
</script>

<template>
  <a v-if="isExternal(props.to)" :href="props.to" :target="props.target || '_blank'" rel="noopener noreferrer">
    <slot />
  </a>
  <router-link v-else :to="props.to">
    <slot />
  </router-link>
</template>
