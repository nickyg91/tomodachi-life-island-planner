<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ISelectedItemType, ItemType } from '@/types/island';
import { ITEM_CATEGORIES, VARIANT_OPTIONS, ALL_ITEM_TYPES } from '@/types/island';

// Category order matters for deterministic rendering
const CATEGORY_LIST = [
  { key: 'All', label: 'All' },
  { key: 'Residential', label: 'Residential' },
  { key: 'Commercial', label: 'Commercial' },
  { key: 'Service', label: 'Service' },
  { key: 'Landmark', label: 'Landmark' },
  { key: 'Nature', label: 'Nature' },
  { key: 'Path', label: 'Path' },
  { key: 'Decor', label: 'Decor' },
  { key: 'Environment', label: 'Environment' },
] as const;

const emit = defineEmits<{
  (e: 'itemSelect', event: ISelectedItemType): void;
  (e: 'categoryChange', category: string | null): void;
}>();

const activeCategory = ref<string | null>(null);
const searchQuery = ref('');
const selectedType = ref<ItemType | null>(null);
const selectedVariant = ref<string>('default');

// Filter items based on active category and search query
const filteredItems = computed(() => {
  let items = ALL_ITEM_TYPES;

  if (activeCategory.value && activeCategory.value !== 'All') {
    items = items.filter((t) => ITEM_CATEGORIES[t] === activeCategory.value);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(
      (t) => t.toLowerCase().includes(query) || ITEM_CATEGORIES[t].toLowerCase().includes(query),
    );
  }

  return items;
});

// Reset variant when item changes
watch(selectedType, (newType) => {
  if (newType) {
    selectedVariant.value = (VARIANT_OPTIONS[newType]?.[0] || 'default') as string;
  }
});

// Emit selection + variant
const handleSelect = (type: ItemType) => {
  selectedType.value = type;
  selectedVariant.value = (VARIANT_OPTIONS[type]?.[0] || 'default') as string;
  emit('itemSelect', {
    itemType: type,
    variant: selectedVariant.value,
  });
};

// Update variant and emit
const handleVariantChange = () => {
  if (selectedType.value) {
    emit('itemSelect', {
      itemType: selectedType.value!,
      variant: selectedVariant.value,
    });
  }
};

// Clear active category
const resetCategory = () => {
  activeCategory.value = null;
  emit('categoryChange', null);
};
</script>

<template>
  <div class="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-neutral-800">
      <h2 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Island Items</h2>
    </div>

    <!-- Category Tabs -->
    <div class="px-3 py-2 border-b border-neutral-800 overflow-x-auto">
      <div class="flex space-x-1 min-w-max">
        <button
          v-for="cat in CATEGORY_LIST"
          :key="cat.key"
          @click="activeCategory = activeCategory === cat.key ? null : cat.key"
          :class="[
            'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
            activeCategory === cat.key
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
          ]"
        >
          {{ cat.label }}
        </button>
        <button
          v-if="activeCategory"
          @click="resetCategory"
          class="px-2 py-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
          title="Clear filter"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="px-3 py-2 border-b border-neutral-800">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search items..."
          class="w-full bg-neutral-950 border border-neutral-700 rounded-md py-1.5 pl-3 pr-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-2 w-4 h-4 text-neutral-500 cursor-pointer hover:text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    </div>

    <!-- Variant Picker -->
    <div v-if="selectedType" class="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
      <label class="block text-xs font-medium text-neutral-400 mb-1">Variant</label>
      <select
        v-model="selectedVariant"
        @change="handleVariantChange"
        class="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option
          v-for="variant in VARIANT_OPTIONS[selectedType] || ['default']"
          :key="variant"
          :value="variant"
        >
          {{ variant.replace(/_/g, ' ') }}
        </option>
      </select>
    </div>

    <!-- Items Grid -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div v-if="filteredItems.length === 0" class="text-center py-6 text-sm text-neutral-500">
        No items found
      </div>
      <div
        v-for="type in filteredItems"
        :key="type"
        @click="handleSelect(type)"
        :class="[
          'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border',
          selectedType === type
            ? 'bg-blue-600/20 border-blue-500/50'
            : 'bg-neutral-800/50 border-transparent hover:bg-neutral-800 hover:border-neutral-700',
        ]"
      >
        <div
          class="w-8 h-8 rounded bg-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-300"
        >
          {{ type.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-neutral-200 truncate">{{ type.replace(/_/g, ' ') }}</p>
          <p class="text-xs text-neutral-500">{{ ITEM_CATEGORIES[type] }}</p>
        </div>
        <div v-if="selectedType === type" class="text-blue-400">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
