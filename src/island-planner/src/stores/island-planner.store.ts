import type { ISelectedItemType as ISelectedItem, PlannerItem } from '@/types';
import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useIslandPlannerStore = defineStore('useIslandPlannerStore', () => {
  const plannerItems = ref<PlannerItem[]>([]);
  const selectedItemType = ref<ISelectedItem | undefined>();
  const addPlannerItem = (xCoord: number, yCoord: number) => {
    if (!selectedItemType.value) {
      return;
    }
    plannerItems.value.push({
      id: uuidv4(),
      rotation: 0,
      type: selectedItemType.value!.itemType,
      variant: selectedItemType.value.variant,
      x: xCoord,
      y: yCoord,
    });
  };

  const removePlannerItem = (id: string) => {
    const idx = plannerItems.value.findIndex((x) => x.id === id);
    plannerItems.value.splice(idx, 1);
  };

  const setSelectedItemType = (item: ISelectedItem) => {
    selectedItemType.value = item;
  };

  const updateItem = (id: string) => {
    const idx = plannerItems.value.findIndex((x) => x.id === id);
    if (idx > -1) {
      plannerItems.value[idx]!.type = selectedItemType.value!.itemType;
      plannerItems.value[idx]!.variant = selectedItemType.value!.variant;
    }
  };

  return {
    plannerItems: readonly(plannerItems),
    selectedItemType: readonly(selectedItemType),
    addPlannerItem,
    removePlannerItem,
    setSelectedItemType,
    updateItem,
  };
});
