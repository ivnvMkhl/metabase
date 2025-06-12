export type FavoriteGroupListResponse = FavoriteGroup[];

export type FavoriteGroup = {
  id: number;
  name: string;
  color: string;
  code: string;
  description?: string;
  group_values: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};
