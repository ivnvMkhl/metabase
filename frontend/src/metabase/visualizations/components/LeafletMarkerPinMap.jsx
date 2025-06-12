import L from "leaflet";
import _ from "underscore";

import LeafletMap from "./LeafletMap";

export const STATIC_TOOLTIP_FIELD_KEY = "$_pin_name";
export const DEFAULT_MAP_PIN_COLOR = "#81827E";

const getIconWithTooltip = (
  text,
  color = DEFAULT_MAP_PIN_COLOR,
  markerKey,
  favGroups,
) => {
  const favMarkers =
    Array.isArray(favGroups) && favGroups.length
      ? favGroups
          .map(
            key =>
              `<div class="custom-map-marker-favorite-label favorite-group-${key}" ></div>`,
          )
          .join("")
      : ``;
  const tooltipHtml = text
    ? `<span class="custom-map-marker-tooltip">${text} ${favMarkers} </span>`
    : "";
  const marketHtml = `
  <div id="${markerKey}" class="custom-map-marker">
    <svg height="32px" width="32px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 viewBox="0 0 512 512"  xml:space="preserve" class="custom-map-marker-icon">
      <g>
        <path class="st0" d="M256,0C160.798,0,83.644,77.155,83.644,172.356c0,97.162,48.158,117.862,101.386,182.495
          C248.696,432.161,256,512,256,512s7.304-79.839,70.97-157.148c53.228-64.634,101.386-85.334,101.386-182.495
          C428.356,77.155,351.202,0,256,0z M256,231.921c-32.897,0-59.564-26.668-59.564-59.564s26.668-59.564,59.564-59.564
          c32.896,0,59.564,26.668,59.564,59.564S288.896,231.921,256,231.921z" fill="${color}"/>
      </g>
    </svg>
    ${tooltipHtml}
    ${favMarkers}
  </div>
  `;

  return L.divIcon({
    className: "custom-map-marker-wrapper",
    html: marketHtml,
    iconSize: [28, 32],
    iconAnchor: [15, 24],
    popupAnchor: [0, -13],
  });
};

export class LeafletMarkerPinMapInternal extends LeafletMap {
  constructor() {
    super();
    this.state = {
      count: 0,
    };
  }

  componentDidMount() {
    super.componentDidMount();

    this.pinMarkerLayer = L.layerGroup([]).addTo(this.map);
    this.componentDidUpdate({}, {});
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    try {
      const { pinMarkerLayer } = this;
      const { points, data, settings } = this.props;

      const staticLabelFielName =
        settings?.["map.staticLabelsColumn"] ?? STATIC_TOOLTIP_FIELD_KEY;
      const prevStaticLabelFielName =
        prevProps?.settings?.["map.staticLabelsColumn"] ??
        STATIC_TOOLTIP_FIELD_KEY;
      const staticLabelChanged =
        staticLabelFielName !== prevStaticLabelFielName;
      const pinColorHasChanged = this.pinColor !== settings?.["map.pinColor"];

      const mappedData = data.rows.map(values =>
        values.reduce(
          (acc, value, index) => ({ ...acc, [data.cols[index].name]: value }),
          {},
        ),
      );

      const handleRerenderMarkers = () => {
        this.pinColor = settings?.["map.pinColor"];
        pinMarkerLayer.clearLayers();
        this.setState(prevState => ({
          ...prevState,
          count: this.state.count + 1,
        }));
      };

      if (staticLabelChanged || pinColorHasChanged) {
        this.pinColor = settings?.["map.pinColor"];
        pinMarkerLayer.clearLayers();
      }
      const markers = pinMarkerLayer.getLayers();
      const max = Math.max(points.length, markers.length);

      for (let i = 0; i < max; i++) {
        if (i >= points.length) {
          pinMarkerLayer.removeLayer(markers[i]);
        }
        if (i >= markers.length) {
          const marker = this._createMarker(
            i,
            staticLabelFielName,
            mappedData?.[i],
            handleRerenderMarkers,
          );
          pinMarkerLayer.addLayer(marker);
          markers.push(marker);
        }

        if (i < points.length) {
          const { lat, lng } = markers[i].getLatLng();
          if (lng !== points[i][0] || lat !== points[i][1]) {
            markers[i].setLatLng(points[i]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.props.onRenderError(err.message || err);
    }
  }

  _createMarker = (
    rowIndex,
    staticLabelFieldName,
    pointData,
    handleRerenderMarkers,
  ) => {
    const { favoriteList } = this.props;
    const markerName = pointData[staticLabelFieldName];
    const ids = favoriteList
      ?.filter(
        ({ code, group_values }) =>
          code === staticLabelFieldName &&
          JSON.parse(group_values)?.includes(markerName),
      )
      .map(({ id }) => id);
    const markerKey = `${rowIndex}-${markerName}`;
    const marker = L.marker([0, 0], {
      icon: getIconWithTooltip(markerName, this.pinColor, markerKey, ids),
    });
    const { onHoverChange, onMarkerClick } = this.props;
    if (onHoverChange) {
      marker.on("mousemove", e => {
        const {
          series: [
            {
              data: { cols, rows },
            },
          ],
        } = this.props;
        const hover = {
          dimensions: cols.map((col, colIndex) => ({
            value: rows[rowIndex][colIndex],
            column: col,
          })),
          element: marker._icon,
        };
        onHoverChange(hover);
      });
      marker.on("mouseout", () => {
        onHoverChange(null);
      });
    }

    if (onMarkerClick) {
      marker.on("click", () => {
        const { clickElement } = this.props;

        if (!clickElement || clickElement.element !== marker._icon) {
          const {
            series: [
              {
                data: { cols, rows },
              },
            ],
          } = this.props;
          const click = {
            dimensions: cols.map((col, colIndex) => ({
              value: rows[rowIndex][colIndex],
              column: col,
            })),
            element: marker._icon,
            handleRerenderMarkers,
            staticLabelFieldName,
          };
          onMarkerClick(click);
        } else {
          onMarkerClick(null);
        }
      });
    }

    // Отключена модалка при клике на пин
    // if (onVisualizationClick) {
    // marker.on("click", () => {
    //   const {
    //     series: [
    //       {
    //         data: { cols, rows },
    //       },
    //     ],
    //   } = this.props;
    //   // if there is a primary key then associate a pin with it
    //   const pkIndex = _.findIndex(cols, isPK);
    //   const hasPk = pkIndex >= 0;
    //   const data = cols.map((col, index) => ({
    //     col,
    //     value: rows[rowIndex][index],
    //   }));
    //   onVisualizationClick({
    //     value: hasPk ? rows[rowIndex][pkIndex] : null,
    //     column: hasPk ? cols[pkIndex] : null,
    //     element: marker._icon,
    //     origin: { row: rows[rowIndex], cols },
    //     settings,
    //     data,
    //   });
    // });
    // }
    return marker;
  };
}
