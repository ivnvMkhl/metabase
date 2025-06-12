import type {
  FavoriteGroup,
  FavoriteGroupListResponse,
} from "metabase-types/api/favorite";

import { Api } from "./api";

export const favoriteApi = Api.injectEndpoints({
  endpoints: builder => ({
    getFavoriteList: builder.query<FavoriteGroupListResponse, void>({
      query: params => ({
        method: "GET",
        url: "/api/favorite",
        params,
      }),
    }),
    getFavorite: builder.query<FavoriteGroup, { id: number }>({
      query: ({ id }) => ({
        method: "GET",
        url: `/api/favorite/${id}`,
      }),
    }),
    deleteFavorite: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        method: "DELETE",
        url: `/api/favorite/${id}`,
      }),
    }),
    createFavorite: builder.mutation<
      FavoriteGroup,
      Pick<
        FavoriteGroup,
        "name" | "color" | "code" | "description" | "group_values" | "is_active"
      >
    >({
      query: body => ({
        method: "POST",
        url: `/api/favorite`,
        body,
      }),
    }),
    updateFavorite: builder.mutation<
      FavoriteGroup,
      Pick<FavoriteGroup, "id"> &
        Partial<
          Pick<
            FavoriteGroup,
            | "name"
            | "color"
            | "code"
            | "description"
            | "group_values"
            | "is_active"
          >
        >
    >({
      query: ({ id, ...body }) => ({
        method: "PUT",
        url: `/api/favorite/${id}`,
        body,
      }),
    }),
  }),
});

export const {
  useGetFavoriteListQuery,
  useGetFavoriteQuery,
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useUpdateFavoriteMutation,
  useLazyGetFavoriteQuery,
  useLazyGetFavoriteListQuery,
} = favoriteApi;
