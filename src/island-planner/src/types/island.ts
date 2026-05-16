// types/island.ts
export enum ItemType {
  House = 'house',
  Restaurant = 'restaurant',
  MiiNewsTower = 'mii_news_tower',
  FoodMarket = 'food_market',
  ClothingStore = 'clothing_store',
  InteriorDecorationStore = 'interior_decoration_store',
  PhotoBooth = 'photo_booth',
  PawnShop = 'pawn_shop',
  Path = 'path',
  Tree = 'tree',
  Decor = 'decor',
  Land = 'land',
  Water = 'water',
}

export interface PlannerItem {
  id: string;
  type: ItemType;
  variant: string;
  rotation: 0 | 90 | 180 | 270;
  x: number;
  y: number;
  metadata?: Record<string, unknown>;
}

export interface PlannerState {
  gridSize: { w: number; h: number };
  items: PlannerItem[];
  camera: { x: number; y: number; scale: number };
  history: { past: PlannerState[]; future: PlannerState[]; maxSteps: number };
}

// ─────────────────────────────────────────────────────────────
// Planner Configuration Constants (for palette & UI logic)
// ─────────────────────────────────────────────────────────────

export type ItemCategory =
  | 'Residential'
  | 'Commercial'
  | 'Service'
  | 'Landmark'
  | 'Nature'
  | 'Path'
  | 'Decor'
  | 'Environment';

export const ITEM_CATEGORIES: Record<ItemType, ItemCategory> = {
  [ItemType.House]: 'Residential',
  [ItemType.Restaurant]: 'Commercial',
  [ItemType.MiiNewsTower]: 'Landmark',
  [ItemType.FoodMarket]: 'Commercial',
  [ItemType.ClothingStore]: 'Commercial',
  [ItemType.InteriorDecorationStore]: 'Service',
  [ItemType.PhotoBooth]: 'Service',
  [ItemType.PawnShop]: 'Service',
  [ItemType.Path]: 'Path',
  [ItemType.Tree]: 'Nature',
  [ItemType.Decor]: 'Decor',
  [ItemType.Water]: 'Environment',
  [ItemType.Land]: 'Environment',
} as const;

export const VARIANT_OPTIONS: Partial<Record<ItemType, string[]>> = {
  [ItemType.House]: ['modern', 'cottage', 'apartment'],
  [ItemType.Restaurant]: ['diner', 'fine_dining', 'ramen_shop'],
  [ItemType.MiiNewsTower]: ['classic', 'modern', 'retro'],
  [ItemType.FoodMarket]: ['outdoor', 'indoor', 'night_market'],
  [ItemType.ClothingStore]: ['boutique', 'thrift', 'luxury'],
  [ItemType.InteriorDecorationStore]: ['ikea_like', 'vintage', 'minimalist'],
  [ItemType.PhotoBooth]: ['classic', 'neon', 'nature'],
  [ItemType.PawnShop]: ['antique', 'modern', 'mystery'],
  [ItemType.Path]: ['stone', 'wood', 'gravel', ''],
  [ItemType.Tree]: ['leaf', 'needle', 'palm'],
  [ItemType.Decor]: ['bench', 'lantern', 'planter', 'fountain'],
} as const;

export const ALL_ITEM_TYPES = Object.values(ItemType) as ItemType[];

export interface ISelectedItemType {
  itemType: ItemType;
  variant: string;
}
