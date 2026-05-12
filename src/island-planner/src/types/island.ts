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
}

export type ItemCategory =
  | 'Residential'
  | 'Commercial'
  | 'Service'
  | 'Landmark'
  | 'Nature'
  | 'Path'
  | 'Decor';

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
  [ItemType.Path]: ['stone', 'wood', 'gravel'],
  [ItemType.Tree]: ['oak', 'pine', 'cherry'],
  [ItemType.Decor]: ['bench', 'lantern', 'planter', 'fountain'],
} as const;

export interface IslandItem {
  id: string;
  type: ItemType;
  variant: string;
  rotation: 0 | 90 | 180 | 270;
  x: number;
  y: number;
  metadata?: Record<string, unknown>;
}

// Helper to get all item types as an array (useful for palette generation)
export const ALL_ITEM_TYPES = Object.values(ItemType) as ItemType[];
