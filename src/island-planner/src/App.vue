<script setup lang="ts">
import AppLayout from '@/layout/AppLayout.vue';
import PaletteSidebar from '@/components/editor/PaletteSidebar.vue';
import CanvasStage from '@/components/editor/CanvasStage.vue';
import type { ISelectedItemType } from './types';
import { useIslandPlannerStore } from './stores/island-planner.store';
// import PropertiesPanel from '@/components/PropertiesPanel.vue';
const store = useIslandPlannerStore();
const onItemSelected = (item: ISelectedItemType) => {
  store.setSelectedItemType(item);
};
</script>
<template>
  <AppLayout>
    <!-- Left: Palette -->
    <template #palette>
      <PaletteSidebar @itemSelect="onItemSelected" />
    </template>

    <!-- Center: Canvas -->
    <template #canvas>
      <CanvasStage :gridSize="{ w: 120, h: 90 }" :camera="{ x: 60, y: 45, scale: 0 }" />
    </template>

    <!-- Right: Properties -->
    <!-- <template #properties>
      <PropertiesPanel />
    </template> -->

    <!-- Top Bar Actions -->
    <template #header-actions>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition"
        >
          Export JSON
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition"
        >
          Import
        </button>
      </div>
    </template>
  </AppLayout>
</template>
