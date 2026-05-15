<script setup lang="ts">
import AppLayout from '@/layout/AppLayout.vue';
import PaletteSidebar from '@/components/editor/PaletteSidebar.vue';
import CanvasStage from '@/components/editor/CanvasStage.vue';
// import PropertiesPanel from '@/components/PropertiesPanel.vue';
</script>
<template>
  <AppLayout>
    <!-- Left: Palette -->
    <template #palette>
      <PaletteSidebar />
    </template>

    <!-- Center: Canvas -->
    <template #canvas>
      <CanvasStage
        :gridSize="{ w: 120, h: 90 }"
        :camera="{ x: 0, y: 0, scale: 1 }"
        gridSizeName="large"
        :gridSizePx="1080"
        :items="[]"
      />
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
