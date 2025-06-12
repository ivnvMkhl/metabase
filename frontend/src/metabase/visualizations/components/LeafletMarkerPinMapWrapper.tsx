import { forwardRef, useEffect, useState } from "react";

import {
  useGetFavoriteListQuery,
  useUpdateFavoriteMutation,
} from "metabase/api/favorite";
import { SpinnerRoot } from "metabase/components/LoadingSpinner/LoadingSpinner.styled";
import type { FavoriteGroup } from "metabase-types/api/favorite";

import styles from "./LeafletMap.module.css";
import { LeafletMarkerPinMapInternal } from "./LeafletMarkerPinMap";

type ClickInfo = {
  dimensions: { value: string | number | null; column: { name: string } }[];
  element: Element;
  handleRerenderMarkers?: () => void;
  staticLabelFieldName?: string;
};

// eslint-disable-next-line react/display-name
export const LeafletMarkerPinMap = forwardRef((props: any, ref) => {
  const { data: favoriteList, refetch, isLoading } = useGetFavoriteListQuery();
  const [updateFavorite] = useUpdateFavoriteMutation();

  useEffect(() => {
    if (favoriteList) {
      const style = document.createElement("style");
      const nonce =
        (document.querySelector("script[nonce]") as Element & { nonce: string })
          ?.nonce ||
        (document.querySelector("style[nonce]") as Element & { nonce: string })
          ?.nonce;
      style.setAttribute("nonce", String(nonce));
      style.textContent = favoriteList.reduce((acc, favoriteGroup) => {
        return (
          acc +
          `
        .favorite-group-${favoriteGroup.id} {
          background: ${favoriteGroup.color};
        }
      `
        );
      }, "");
      document.head.appendChild(style);
    }
  }, [favoriteList]);

  const [clickElement, setClickElement] = useState<ClickInfo | null>();
  const onMarkerClick = (info: ClickInfo | null) => {
    setClickElement(info);
    // eslint-disable-next-line react/prop-types
    return props?.onHoverChange(info);
  };

  const handleAddFavorite =
    (
      value: string,
      favoriteGroup: FavoriteGroup,
      refreshMapPins?: () => void,
    ) =>
    async () => {
      const prevValues: string[] | null = JSON.parse(
        favoriteGroup.group_values,
      );
      const set = new Set<string>(prevValues ?? []);
      if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      setClickElement(null);
      await updateFavorite({
        id: favoriteGroup.id,
        group_values: JSON.stringify(Array.from(set)),
      });
      await refetch();
      setTimeout(() => {
        refreshMapPins?.();
      }, 10);
    };

  if (isLoading) {
    return <SpinnerRoot />;
  }

  const chartRect = document
    .querySelector(`[data-testid="query-visualization-root"]`)
    ?.getBoundingClientRect();

  const activeFavoriteGroups = favoriteList?.filter(
    ({ code }) => code === clickElement?.staticLabelFieldName,
  );

  return (
    <>
      {!activeFavoriteGroups || activeFavoriteGroups.length === 0
        ? undefined
        : clickElement && (
            <div
              id="test-test"
              className={styles.favoriteMenu}
              style={{
                top:
                  Number(clickElement?.element?.getBoundingClientRect().top) -
                  Number(chartRect?.top) +
                  30,
                left:
                  Number(clickElement?.element?.getBoundingClientRect().left) -
                  Number(chartRect?.left) +
                  15,
              }}
            >
              {activeFavoriteGroups.map(favoriteGroup => {
                const dimensions = clickElement.dimensions.reduce<
                  Record<string, string>
                >(
                  (acc, { value, column }) => ({
                    ...acc,
                    [column.name]: String(value),
                  }),
                  {},
                );
                const isExistColumn = favoriteGroup.code in dimensions;

                if (!isExistColumn) {
                  return;
                }
                const targetValue = dimensions[favoriteGroup.code];
                const isIncludedInFavorites = JSON.parse(
                  favoriteGroup.group_values,
                )?.includes(targetValue);
                return (
                  <div
                    key={favoriteGroup.id}
                    className={styles.favoriteMenuItem}
                  >
                    <div
                      className={styles.colorMarker}
                      style={{ background: favoriteGroup.color }}
                    />
                    <div
                      className={styles.favoriteMenuLabel}
                      onClick={handleAddFavorite(
                        targetValue,
                        favoriteGroup,
                        clickElement.handleRerenderMarkers,
                      )}
                    >
                      {isIncludedInFavorites ? "Удалить из " : "Добавить в "}
                      {favoriteGroup.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      <LeafletMarkerPinMapInternal
        {...props}
        onMarkerClick={onMarkerClick}
        id="test-chart"
        ref={ref}
        favoriteList={favoriteList}
        clickElement={clickElement}
      />
    </>
  );
});
