import type { ISelectedItemType as ISelectedItem, PlannerItem } from '@/types';
import { defineStore } from 'pinia';
import { readonly, ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useIslandPlannerStore = defineStore('useIslandPlannerStore', () => {
  const plannerItems = ref<PlannerItem[]>([]);
  const selectedItemType = ref<ISelectedItem | undefined>();
  const addPlannerItem = (item: PlannerItem) => {
    item.id = uuidv4();
    plannerItems.value.push(item);
  };

  const removePlannerItem = (id: string) => {
    const idx = plannerItems.value.findIndex((x) => x.id === id);
    plannerItems.value.splice(idx, 1);
  };

  const setSelectedItemType = (item: ISelectedItem) => {
    selectedItemType.value = item;
  };

  return {
    plannerItems: readonly(plannerItems),
    selectedItemType: readonly(selectedItemType),
    addPlannerItem,
    removePlannerItem,
    setSelectedItemType,
  };
});
