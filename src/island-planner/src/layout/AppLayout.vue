<script setup lang="ts">
import { ref } from 'vue';

const isLeftOpen = ref(true);
const isRightOpen = ref(true);
</script>

<template>
  <div
    class="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-200 overflow-hidden font-sans selection:bg-blue-500/30"
  >
    <!-- Header -->
    <header
      class="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 z-20 relative"
    >
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-white tracking-tight">Island Planner</h1>
        <div class="h-5 w-px bg-neutral-700 mx-1 hidden sm:block"></div>
        <span class="text-xs text-neutral-500 hidden sm:block">Tomodachi Life Edition</span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Mobile Menu Toggle -->
        <button
          @click="isLeftOpen = !isLeftOpen"
          class="lg:hidden p-2 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors"
          aria-label="Toggle palette"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <!-- Right Panel Toggle -->
        <button
          @click="isRightOpen = !isRightOpen"
          class="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 transition-colors"
          aria-label="Toggle properties"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        <div class="w-px h-6 bg-neutral-700 mx-1"></div>

        <!-- Header Actions Slot -->
        <slot name="header-actions" />
      </div>
    </header>

    <!-- Main Layout Area -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar (Palette) -->
      <aside
        :class="[
          'fixed inset-y-0 left-0 z-30 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:shrink-0',
          { '-translate-x-full': !isLeftOpen },
        ]"
      >
        <slot name="palette" />
      </aside>

      <!-- Mobile Overlay -->
      <div
        v-if="isLeftOpen"
        class="fixed inset-0 bg-black/60 z-20 lg:hidden"
        @click="isLeftOpen = false"
      />

      <!-- Canvas Area -->
      <main class="flex-1 relative bg-neutral-950 overflow-hidden">
        <slot name="canvas" />
      </main>

      <!-- Right Sidebar (Properties) -->
      <aside
        :class="[
          'fixed inset-y-0 right-0 z-30 w-72 bg-neutral-900 border-l border-neutral-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-80 lg:shrink-0',
          { 'translate-x-full': !isRightOpen },
        ]"
      >
        <slot name="properties" />
      </aside>
    </div>
  </div>
</template>
