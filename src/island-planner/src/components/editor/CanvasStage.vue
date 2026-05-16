<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue';
import type { PlannerItem, ItemType } from '@/types/island';
import Konva from 'konva';
import { useIslandPlannerStore } from '@/stores/island-planner.store';

const store = useIslandPlannerStore();
// --- Props & Emits ---
const props = withDefaults(
  defineProps<{
    gridSize: { w: number; h: number };
    camera: { x: number; y: number; scale: number };
    gridSizePx?: number;
    showGrid?: boolean;
  }>(),
  { gridSizePx: 64, gridSizeName: 'Custom', showGrid: true },
);

const emit = defineEmits<{
  (e: 'update:camera', camera: typeof props.camera): void;
  (e: 'placeItem', item: Omit<PlannerItem, 'id'>): void;
  (e: 'removeItem', itemId: string): void;
  (e: 'itemHover', x: number, y: number, type: ItemType | null): void;
  (e: 'itemUnhover'): void;
  (e: 'resize'): void;
}>();

// --- State ---
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = shallowRef<Konva.Stage | null>(null);
const mapLayer = shallowRef<Konva.Layer | null>(null);
const gridLayer = shallowRef<Konva.Layer | null>(null);
const itemsLayer = shallowRef<Konva.Layer | null>(null);

const isPanning = ref<boolean>(false);
let isDraggingItem = false;
let panStartCamera = { x: 0, y: 0 };

let wasDragged = false;
let dragStartPos = { x: 0, y: 0 };

let isPainting = false;
let lastPlacedCell = { x: -1, y: -1 };

// Hover state for the "Ghost" cursor
const hoverPos = ref<{ x: number; y: number }>({ x: -1, y: -1 });
const hoverTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const GRID_SIZE_PX = computed(() => props.gridSizePx ?? 32);

onMounted(() => {
  if (!containerRef.value) return;

  stageRef.value = new Konva.Stage({
    container: containerRef.value,
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  });

  // 1. Create layers
  mapLayer.value = new Konva.Layer();
  gridLayer.value = new Konva.Layer();
  itemsLayer.value = new Konva.Layer();

  // 2. Add to stage in Z-order
  if (stageRef.value) {
    stageRef.value.add(mapLayer.value);
    stageRef.value.add(gridLayer.value);
    stageRef.value.add(itemsLayer.value);
    stageRef.value.draw();
  }

  // Set canvas background to water
  if (gridLayer.value) {
    const { w, h } = props.gridSize;
    const size = GRID_SIZE_PX.value;
    gridLayer.value.add(
      new Konva.Rect({
        width: w * size,
        height: h * size,
        fill: '#0f172a', // Default water color
        listening: false,
      }),
    );
  }

  // Attach listeners...
  containerRef.value.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  containerRef.value.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
  stageRef.value.addEventListener('click', handleGridClick);

  // Initial render
  renderAll();
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  containerRef.value?.removeEventListener('wheel', handleWheel);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
  stageRef.value?.destroy();
  if (hoverTimer.value) clearTimeout(hoverTimer.value);
});

watch(
  () => store.plannerItems,
  () => {
    // Use nextTick to ensure Vue has updated any DOM refs if needed,
    // though Konva handles its own DOM updates independently.
    nextTick(() => renderAll());
  },
  { deep: true }, // Crucial for nested array changes
);

// --- Grid Rendering ---
function renderMap() {
  if (!mapLayer.value) return;
  mapLayer.value.destroyChildren();

  const size = GRID_SIZE_PX.value;

  // Render all terrain tiles (Land & Water)
  const terrainItems = store.plannerItems.filter(
    (item) => item.type === 'land' || item.type === 'water',
  );

  terrainItems.forEach((tile) => {
    // Water matches the default ocean background, Land uses variants
    const isWater = tile.type === 'water';
    const fillColor = isWater ? '#0f172a' : getItemColor(tile.type);

    mapLayer.value?.add(
      new Konva.Rect({
        x: tile.x * size,
        y: tile.y * size,
        width: size,
        height: size,
        fill: fillColor,
        listening: false, // Terrain doesn't need click events
      }),
    );
  });

  mapLayer.value.batchDraw();
}

function renderGrid() {
  if (!gridLayer.value || !props.showGrid) {
    if (gridLayer.value) gridLayer.value.destroyChildren();
    return;
  }

  gridLayer.value.destroyChildren();
  const { w, h } = props.gridSize;
  const size = GRID_SIZE_PX.value;
  const width = w * size;
  const height = h * size;

  // Background for grid layer (transparent)
  gridLayer.value.add(
    new Konva.Rect({
      width,
      height,
      fill: 'transparent',
      listening: false,
    }),
  );

  for (let x = 0; x <= width; x += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [x, 0, x, height],
        stroke: x % (size * 5) === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
        strokeWidth: 1 / (props.camera.scale || 1),
        dash: [5 / (props.camera.scale || 1)],
      }),
    );
  }
  for (let y = 0; y <= height; y += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: y % (size * 5) === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
        strokeWidth: 1 / (props.camera.scale || 1),
        dash: [5 / (props.camera.scale || 1)],
      }),
    );
  }
  gridLayer.value.batchDraw();
}

// --- Items Rendering ---
function getItemColor(type: ItemType): string {
  const colors: Record<ItemType, string> = {
    house: '#3b82f6',
    restaurant: '#ef4444',
    mii_news_tower: '#f59e0b',
    food_market: '#10b981',
    clothing_store: '#8b5cf6',
    interior_decoration_store: '#ec4899',
    photo_booth: '#06b6d4',
    pawn_shop: '#f97316',
    path: '#78716c',
    tree: '#22c55e',
    decor: '#a8a29e',
    land: '#4ade8a',
    water: '#3b82f6',
  };
  return colors[type] || '#6b7280';
}

function renderItems() {
  if (!itemsLayer.value) return;
  itemsLayer.value.destroyChildren();

  // Only render non-terrain items as interactive buildings
  const buildingItems = store.plannerItems.filter(
    (item) => item.type !== 'land' && item.type !== 'water',
  );

  const size = GRID_SIZE_PX.value;
  const offset = (size - 2) / 2;

  buildingItems.forEach((item) => {
    const rect = new Konva.Rect({
      x: item.x * size + offset,
      y: item.y * size + offset,
      width: size - 2,
      height: size - 2,
      fill: getItemColor(item.type),
      stroke: 'rgba(255, 255, 255, 0.15)',
      strokeWidth: 1,
      cornerRadius: 4,
      draggable: true,
      name: 'item',
      id: item.id,
      offsetX: size / 2,
      offsetY: size / 2,
      cursor: 'grab',
    });

    rect.on('dragstart', () => {
      isDraggingItem = true;
    });
    rect.on('dragend', () => {
      isDraggingItem = false;
    });
    rect.on('click', (e) => {
      e.cancelBubble = true;
      //emit('selectItem', item);
    });

    itemsLayer.value?.add(rect);
  });

  itemsLayer.value.batchDraw();
}

function renderAll() {
  renderMap(); // 1. Terrain (bottom)
  renderGrid(); // 2. Grid lines (middle)
  renderItems(); // 3. Buildings (top)
}

function handlePointerDown(e: PointerEvent) {
  // Panning: Shift + Left Click
  if (e.shiftKey && e.button === 0) {
    isPanning.value = true;
    dragStartPos = { x: e.clientX, y: e.clientY };
    panStartCamera = { x: stageRef.value!.x(), y: stageRef.value!.y() };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
    return;
  }

  // Painting: Left Click
  if (e.button === 0) {
    isPainting = true;
    dragStartPos = { x: e.clientX, y: e.clientY };
    lastPlacedCell = { x: -1, y: -1 }; // Reset tracker
  }
}

function handlePointerMove(e: PointerEvent) {
  // Panning
  if (isPanning.value && stageRef.value) {
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    stageRef.value.position({ x: panStartCamera.x + dx, y: panStartCamera.y + dy });
    stageRef.value.draw();
    emit('update:camera', { ...props.camera, x: panStartCamera.x + dx, y: panStartCamera.y + dy });
    return;
  }

  // Painting Logic
  if (isPainting) {
    const { x, y } = getGridCoords();
    const isValidCell = x >= 0 && x < props.gridSize.w && y >= 0 && y < props.gridSize.h;

    if (isValidCell) {
      // Only place if we moved to a NEW cell
      if (x !== lastPlacedCell.x || y !== lastPlacedCell.y) {
        const item = store.plannerItems.find((i) => i.x === x && i.y === y);
        if (!item) {
          store.addPlannerItem(x, y);
          lastPlacedCell = { x, y };
        } else {
          store.updateItem(item.id);
        }
      }
    }
  }
}

function handlePointerUp() {
  if (isPanning.value) {
    isPanning.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  if (isPainting) {
    isPainting = false;
  }
}

function handlePointerLeave() {
  handlePointerUp();
  hoverPos.value = { x: -1, y: -1 };
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  if (!stageRef.value) return;

  const scaleBy = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  const oldScale = stageRef.value.scaleX();
  const newScale = Math.max(0.1, Math.min(oldScale * scaleBy, 5));

  const mousePointTo = {
    x: (e.clientX - stageRef.value.x()) / oldScale,
    y: (e.clientY - stageRef.value.y()) / oldScale,
  };

  stageRef.value.scale({ x: newScale, y: newScale });
  stageRef.value.position({
    x: e.clientX - mousePointTo.x * newScale,
    y: e.clientY - mousePointTo.y * newScale,
  });

  emit('update:camera', {
    x: stageRef.value.x(),
    y: stageRef.value.y(),
    scale: stageRef.value.scaleX(),
  });
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && isDraggingItem) {
    e.preventDefault();
  }
}

function handleResize() {
  if (!stageRef.value || !containerRef.value) return;
  stageRef.value.width(containerRef.value.clientWidth);
  stageRef.value.height(containerRef.value.clientHeight);
  stageRef.value.draw();
  renderGrid();
}

function getGridCoords() {
  if (!stageRef.value) return { x: -1, y: -1 };

  const stage = stageRef.value;
  const point = stage.getPointerPosition();
  if (!point) return { x: -1, y: -1 };

  // CRITICAL: Subtract pan offset, then divide by zoom scale
  const rawX = (point.x - stage.x()) / stage.scaleX();
  const rawY = (point.y - stage.y()) / stage.scaleY();

  return {
    x: Math.floor(rawX / GRID_SIZE_PX.value),
    y: Math.floor(rawY / GRID_SIZE_PX.value),
  };
}
function handleGridClick(e: Event) {
  const mouseEvent = e as MouseEvent;
  if (mouseEvent.button === 2) {
    const { x, y } = getGridCoords();
    if (x >= 0 && x < props.gridSize.w && y >= 0 && y < props.gridSize.h) {
      const removed = store.plannerItems.find((i) => i.x === x && i.y === y);
      if (removed) store.removePlannerItem(removed.id);
    }
  }
}
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full overflow-hidden bg-neutral-950 cursor-crosshair"
    @mouseleave="handlePointerLeave"
    @contextmenu.prevent
  >
    <div
      v-show="hoverPos.x >= 0 && hoverPos.y >= 0"
      class="absolute pointer-events-none border border-blue-500 bg-blue-500/20 z-50"
      :style="{
        width: `${GRID_SIZE_PX}px`,
        height: `${GRID_SIZE_PX}px`,
        left: `${hoverPos.x * (props.gridSizePx || 32) + (stageRef?.x() ?? 0)}px`,
        top: `${hoverPos.y * (props.gridSizePx || 32) + (stageRef?.y() ?? 0)}px`,
        transform: `translate(${stageRef?.x() ?? 0}px, ${stageRef?.y() ?? 0}px)`,
      }"
    />
  </div>
</template>
