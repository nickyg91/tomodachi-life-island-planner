<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ItemType } from '@/types/island';
import { ITEM_CATEGORIES, VARIANT_OPTIONS } from '@/types/island';

const emit = defineEmits<{ (e: 'select', type: ItemType, variant: string): void }>();

const activeCategory = ref('');
const selectedItem = ref<ItemType | null>(null);
const selectedVariant = ref('default');

// Filter items by category
const filteredItems = computed(() => {
  const items = Object.keys(ITEM_CATEGORIES) as ItemType[];
  if (!activeCategory.value) return items;
  return items.filter((t) => ITEM_CATEGORIES[t] === activeCategory.value);
});

const selectItem = (type: ItemType) => {
  selectedItem.value = type;
  selectedVariant.value = (VARIANT_OPTIONS[type]?.[0] || 'default') as string;
  emit('select', type, selectedVariant.value);
};

const getThumbnail = (type: ItemType) => `/assets/icons/${type}.svg`;
</script>

<template>
  <aside class="w-64 bg-gray-900 text-white p-4 overflow-y-auto">
    <h2 class="text-lg font-bold mb-4">Island Items</h2>

    <!-- Category Filter -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="cat in ['All', ...Object.values(ITEM_CATEGORIES).filter((v, i) => i === 0 || true)]"
        :key="cat"
        class="px-3 py-1 text-xs rounded-full bg-gray-700 hover:bg-gray-600"
        :class="{ 'bg-blue-600': activeCategory === cat }"
        @click="activeCategory = cat === 'All' ? '' : cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Item Grid -->
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="itemType in filteredItems"
        :key="itemType"
        class="relative group cursor-pointer"
        @mousedown="selectItem(itemType)"
      >
        <div
          class="w-full aspect-square bg-gray-800 rounded border border-gray-600 flex items-center justify-center"
        >
          <img :src="getThumbnail(itemType)" class="w-8 h-8" />
        </div>
        <span class="text-[10px] text-gray-400 text-center block">{{
          itemType.replace('_', ' ')
        }}</span>
      </div>
    </div>

    <!-- Variant Picker (shows when item is selected) -->
    <div v-if="selectedItem" class="mt-4 p-3 bg-gray-800 rounded">
      <p class="text-xs text-gray-400 mb-2">Variant</p>
      <select v-model="selectedVariant" class="w-full bg-gray-700 text-white text-xs p-1 rounded">
        <option v-for="v in VARIANT_OPTIONS[selectedItem] || ['default']" :key="v" :value="v">
          {{ v.replace('_', ' ') }}
        </option>
      </select>
    </div>
  </aside>
</template>
