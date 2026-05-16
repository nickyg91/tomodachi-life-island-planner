<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue';
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
  (e: 'selectItem', item: PlannerItem | null): void;
  (e: 'itemHover', x: number, y: number, type: ItemType | null): void;
  (e: 'itemUnhover'): void;
  (e: 'resize'): void;
}>();

// --- State ---
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = shallowRef<Konva.Stage | null>(null);
const gridLayer = shallowRef<Konva.Layer | null>(null);
const itemsLayer = shallowRef<Konva.Layer | null>(null);
const ghostLayer = shallowRef<Konva.Layer | null>(null);

const isPanning = ref<boolean>(false);
let isDraggingItem = false;
let startPos = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };

// Hover state for the "Ghost" cursor
const hoverPos = ref<{ x: number; y: number }>({ x: -1, y: -1 });
const hoverTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const GRID_SIZE_PX = computed(() => props.gridSizePx ?? 32);

const GRID_COLORS = computed(() => ({
  bg: '#0f172a',
  line: 'rgba(255, 255, 255, 1)',
  major: 'rgba(255, 255, 255, 1)',
  hover: 'rgba(59, 130, 246, 0.3)',
  border: '#334155',
}));

// --- Konva Lifecycle ---
onMounted(() => {
  if (!containerRef.value) return;

  stageRef.value = new Konva.Stage({
    container: containerRef.value,
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  });

  gridLayer.value = new Konva.Layer();
  itemsLayer.value = new Konva.Layer();
  ghostLayer.value = new Konva.Layer();

  if (stageRef.value) {
    stageRef.value.add(gridLayer.value);
    stageRef.value.add(itemsLayer.value);
    stageRef.value.add(ghostLayer.value);
    stageRef.value.draw();
  }

  // Attach native DOM listeners
  containerRef.value.addEventListener('mousedown', handleMouseDown);
  containerRef.value.addEventListener('mousemove', handleMouseMove);
  containerRef.value.addEventListener('mouseup', handleMouseUp);
  containerRef.value.addEventListener('wheel', handleWheel, { passive: false });
  containerRef.value.addEventListener('keydown', handleKeyDown);
  containerRef.value.addEventListener('resize', handleResize);

  syncCameraToProps();
  renderMap();
  renderItems();
});

onUnmounted(() => {
  containerRef.value?.removeEventListener('mousedown', handleMouseDown);
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  containerRef.value?.removeEventListener('wheel', handleWheel);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
  stageRef.value?.destroy();
  if (hoverTimer.value) clearTimeout(hoverTimer.value);
});

// --- Camera Sync Helper ---
function syncCameraToProps() {
  if (!stageRef.value) return;
  stageRef.value.x(props.camera.x);
  stageRef.value.y(props.camera.y);
  stageRef.value.scaleX(props.camera.scale);
  stageRef.value.scaleY(props.camera.scale);
  stageRef.value.draw();
}

// --- Grid Rendering ---
function renderMap() {
  if (!gridLayer.value || !props.showGrid) {
    if (gridLayer.value) gridLayer.value.destroyChildren();
    return;
  }

  gridLayer.value.destroyChildren();
  const { w, h } = props.gridSize;
  const size = GRID_SIZE_PX.value;
  const width = w * size;
  const height = h * size;
  const scale = props.camera.scale || 1;

  gridLayer.value.add(
    new Konva.Rect({
      width,
      height,
      fill: GRID_COLORS.value.bg,
      listening: false,
    }),
  );

  for (let x = 0; x <= width; x += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [x, 0, x, height],
        stroke: x % (size * 5) === 0 ? GRID_COLORS.value.major : GRID_COLORS.value.line,
        strokeWidth: 1 / scale,
        dash: [5 / scale],
      }),
    );
  }
  for (let y = 0; y <= height; y += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: y % (size * 5) === 0 ? GRID_COLORS.value.major : GRID_COLORS.value.line,
        strokeWidth: 1 / scale,
        dash: [5 / scale],
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

  const size = GRID_SIZE_PX.value;
  const offset = (size - 2) / 2;

  store.plannerItems.forEach((item) => {
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
      emit('selectItem', item);
    });

    itemsLayer.value?.add(rect);
  });

  itemsLayer.value.batchDraw();
}

// --- Interaction Logic ---
function getStagePos(clientX: number, clientY: number) {
  if (!stageRef.value) return { x: -1, y: -1 };
  const rect = stageRef.value.container().getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left - stageRef.value.x()) / GRID_SIZE_PX.value),
    y: Math.floor((clientY - rect.top - stageRef.value.y()) / GRID_SIZE_PX.value),
  };
}

// 🔧 FIXED: Uses native MouseEvent properties instead of Konva-specific ones
function handleMouseDown(e: MouseEvent) {
  // Middle Mouse (1) or Left Mouse (0) + Shift to pan
  const isPanningActive = e.button === 1 || (e.button === 0 && e.shiftKey);

  if (!isPanningActive) return;

  isPanning.value = true;
  startPos = { x: e.clientX, y: e.clientY };
  startCamera = { x: stageRef.value!.x(), y: stageRef.value!.y() };
  e.preventDefault(); // Prevents text selection & browser zoom
}

function handleMouseMove(e: MouseEvent) {
  // Pan Logic
  if (isPanning.value && stageRef.value) {
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    emit('update:camera', {
      ...props.camera,
      x: startCamera.x + dx,
      y: startCamera.y + dy,
    });
  }

  // Hover Logic
  if (stageRef.value) {
    const { x, y } = getStagePos(e.clientX, e.clientY);

    if (hoverPos.value.x !== x || hoverPos.value.y !== y) {
      hoverPos.value = { x, y };
    }

    if (hoverTimer.value) clearTimeout(hoverTimer.value);

    if (x >= 0 && x < props.gridSize.w && y >= 0 && y < props.gridSize.h) {
      hoverTimer.value = setTimeout(() => {
        emit('itemHover', x, y, null);
      }, 50);
    }
  }
}

function handleMouseUp() {
  isPanning.value = false;
}

function handleMouseLeave() {
  isPanning.value = false;
  hoverPos.value = { x: -1, y: -1 };
  emit('itemUnhover');
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
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full overflow-hidden bg-neutral-950 cursor-crosshair"
    @mouseleave="handleMouseLeave"
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
