<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { PlannerItem, ItemType } from '@/types/island';
import Konva from 'konva';

// ─── Props & Emits ───────────────────────────────────────────────────────────
const props = defineProps<{
  gridSize: { w: number; h: number };
  items: PlannerItem[];
  camera: { x: number; y: number; scale: number };
  gridSizePx?: number;
  gridSizeName?: string;
}>();

const emits = defineEmits<{
  (e: 'update:camera', camera: typeof props.camera): void;
  (e: 'placeItem', item: Omit<PlannerItem, 'id'>): void;
  (e: 'removeItem', itemId: string): void;
  (e: 'itemHover', x: number, y: number, type: ItemType | null): void;
  (e: 'itemUnhover'): void;
  (e: 'resize'): void;
}>();

// ─── State ───────────────────────────────────────────────────────────────────
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<Konva.Stage | null>(null);
const gridLayer = ref<Konva.Layer | null>(null);
const itemsLayer = ref<Konva.Layer | null>(null);
const ghostLayer = ref<Konva.Layer | null>(null);
const isPanning = ref(false);
const isDragging = ref(false);
let startPos = { x: 0, y: 0 };
let startCamera = { x: 0, y: 0 };
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
const GRID_SIZE_PX = computed(() => props.gridSizePx ?? 32);
const GRID_COLORS = computed(() => ({
  bg: '#0f172a',
  line: 'rgba(148, 163, 184, 0.08)',
  hover: 'rgba(59, 130, 246, 0.3)',
  border: '#334155',
}));

// ─── Konva Lifecycle ─────────────────────────────────────────────────────────
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

  stageRef.value.add(gridLayer.value);
  stageRef.value.add(itemsLayer.value);
  stageRef.value.add(ghostLayer.value);
  stageRef.value.draw();

  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown);
  stageRef.value?.destroy();
  if (hoverTimeout) clearTimeout(hoverTimeout);
});

// ─── Watchers ────────────────────────────────────────────────────────────────
watch(
  () => props.camera,
  (newCam) => {
    if (!stageRef.value) return;
    stageRef.value.x(newCam.x);
    stageRef.value.y(newCam.y);
    stageRef.value.scaleX(newCam.scale);
    stageRef.value.scaleY(newCam.scale);
    stageRef.value.draw();
  },
  { deep: true },
);

watch(
  () => props.items,
  () => renderItems(),
  { deep: true },
);

// ─── Grid Rendering ─────────────────────────────────────────────────────────
function renderGrid() {
  if (!gridLayer.value) return;
  gridLayer.value.destroyChildren();

  const { w, h } = props.gridSize;
  const size = GRID_SIZE_PX.value;
  const width = w * size;
  const height = h * size;
  const scale = props.camera.scale || 1;

  // Background
  gridLayer.value.add(
    new Konva.Rect({
      width,
      height,
      fill: GRID_COLORS.value.bg,
      listening: false,
    }),
  );

  // Grid lines
  for (let x = 0; x <= width; x += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [x, 0, x, height],
        stroke: x % (size * 5) === 0 ? 'rgba(148, 163, 184, 0.15)' : GRID_COLORS.value.line,
        strokeWidth: 1 / scale,
        dash: [5 / scale],
      }),
    );
  }
  for (let y = 0; y <= height; y += size) {
    gridLayer.value.add(
      new Konva.Line({
        points: [0, y, width, y],
        stroke: y % (size * 5) === 0 ? 'rgba(148, 163, 184, 0.15)' : GRID_COLORS.value.line,
        strokeWidth: 1 / scale,
        dash: [5 / scale],
      }),
    );
  }
  gridLayer.value.batchDraw();
}

// ─── Items Rendering ────────────────────────────────────────────────────────
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
  };
  return colors[type] || '#6b7280';
}

function renderItems() {
  if (!itemsLayer.value) return;
  itemsLayer.value.destroyChildren();

  const size = GRID_SIZE_PX.value;
  const offset = (size - 2) / 2;

  props.items.forEach((item) => {
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
    });

    rect.on('dragstart', () => {
      isDragging.value = true;
    });
    rect.on('dragend', () => {
      isDragging.value = false;
    });
    rect.on('click', (e) => {
      e.cancelBubble = true;
      // Handle item selection
    });

    itemsLayer.value?.add(rect);
  });

  itemsLayer.value.batchDraw();
}

// ─── Camera & Interaction ───────────────────────────────────────────────────
// function getStagePos(clientX: number, clientY: number) {
//   if (!stageRef.value) return { x: -1, y: -1 }
//   const stageBounds = stageRef.value.getClientRect()
//   return {
//     x: Math.floor((clientX - stageBounds.left - stageRef.value.x()) / GRID_SIZE_PX.value),
//     y: Math.floor((clientY - stageBounds.top - stageRef.value.y()) / GRID_SIZE_PX.value),
//   }
// }

// function handleMouseDown(e: any) {
//   if (e.evt.button === 2 || e.evt.button === 1) {
//     isPanning.value = true
//     startPos = { x: e.evt.clientX, y: e.evt.clientY }
//     startCamera = { x: stageRef.value!.x(), y: stageRef.value!.y() }
//     e.evt.preventDefault()
//   }
// }

// function handleMouseMove(e: any) {
//   if (isPanning.value) {
//     const dx = e.evt.clientX - startPos.x
//     const dy = e.evt.clientY - startPos.y
//     emit('update:camera', {
//       ...props.camera,
//       x: startCamera.x + dx,
//       y: startCamera.y + dy,
//     })
//   }

//   if (!stageRef.value) return
//   const stageBounds = stageRef.value.getClientRect()
//   const x = Math.floor((e.evt.clientX - stageBounds.left - stageRef.value.x()) / GRID_SIZE_PX.value)
//   const y = Math.floor((e.evt.clientY - stageBounds.top - stageRef.value.y()) / GRID_SIZE_PX.value)

//   if (x >= 0 && x < props.gridSize.w && y >= 0 && y < props.gridSize.h) {
//     hoverTimeout = setTimeout(() => {
//       emit('itemHover', x, y, null)
//     }, 50)
//   } else {
//     if (hoverTimeout) {
//       clearTimeout(hoverTimeout)
//       hoverTimeout = null
//     }
//   }
// }

// function handleMouseUp() {
//   isPanning.value = false
// }

// function handleMouseLeave() {
//   if (hoverTimeout) {
//     clearTimeout(hoverTimeout)
//     hoverTimeout = null
//   }
//   emit('itemUnhover')
// }

// function handleWheel(e: any) {
//   e.evt.preventDefault()
//   const scaleBy = e.evt.deltaY < 0 ? 1.1 : 1 / 1.1
//   const stage = stageRef.value
//   if (!stage) return

//   const oldScale = stage.scaleX()
//   const pointer = stage.getPointerAt()

//   const mousePointTo = {
//     x: (stage.getPointerAt().x - stage.x()) / oldScale,
//     y: (stage.getPointerAt().y - stage.y()) / oldScale,
//   }

//   const newScale = Math.max(0.1, Math.min(oldScale * scaleBy, 5))
//   const dx = e.evt.clientX - mousePointTo.x * newScale
//   const dy = e.evt.clientY - mousePointTo.y * newScale

//   emit('update:camera', {
//     ...props.camera,
//     scale: newScale,
//     x: e.evt.clientX - (dx + stage.x()),
//     y: e.evt.clientY - (dy + stage.y()),
//   })
// }

// function handleStageClick(e: any) {
//   if (isPanning.value) return
//   const pos = getStagePos(e.evt.clientX, e.evt.clientY)
//   if (pos.x < 0 || pos.x >= props.gridSize.w || pos.y < 0 || pos.y >= props.gridSize.h) return

//   // Check if clicking on an item
//   const clickedItem = e.target.find('rect[item]')
//   if (e.evt.button === 0 && !e.target.draggable) {
//     // Place item
//     emit('placeItem', {
//       type: 'path', // Default to path for now, pass from palette
//       variant: 'stone',
//       rotation: 0,
//       x: pos.x,
//       y: pos.y,
//     })
//   } else if (e.evt.button === 2 || e.evt.shiftKey) {
//     // Remove item
//     if (e.target.attrs.id) {
//       emit('removeItem', e.target.attrs.id)
//     }
//   }
// }

function handleResize() {
  if (!stageRef.value || !containerRef.value) return;
  stageRef.value.width(containerRef.value.clientWidth);
  stageRef.value.height(containerRef.value.clientHeight);
  stageRef.value.draw();
}

function handleKeyDown(e: KeyboardEvent) {
  if ((e.key === 'Delete' || e.key === 'Backspace') && isDragging.value) {
    e.preventDefault();
    // Handle delete selected
  }
}

// Expose for parent components
defineExpose({ renderGrid, renderItems, stageRef, containerRef });
</script>

<template>
  <div ref="containerRef" class="w-full h-full overflow-hidden bg-neutral-950 cursor-crosshair">
    <!-- Hover Ghost Layer is managed in Konva, but you can add a DOM overlay here if needed -->
  </div>
</template>
