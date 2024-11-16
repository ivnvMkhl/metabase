import L from "leaflet";
import _ from "underscore";

import { isPK } from "metabase-lib/v1/types/utils/isa";

import LeafletMap from "./LeafletMap";

const STATIC_TOOLTIP_FIELD_KEY = "$_pin_name";

const getIconWidthTooltip = text => {
  const CUSTOM_MARKER = `
  <div class="custom-map-marker">
    <img src="app/assets/img/pin.png" width="28" height="32"/>
    <span class="custom-map-marker-tooltip">${text}</span>
  </div>
  `;

  return L.divIcon({
    className: "custom-map-marker-wrapper",
    html: CUSTOM_MARKER,
    iconSize: [28, 32],
    iconAnchor: [15, 24],
    popupAnchor: [0, -13],
  });
};

const MARKER_ICON = L.icon({
  iconUrl: "app/assets/img/pin.png",
  iconSize: [26, 40],
  iconAnchor: [15, 24],
  popupAnchor: [0, -13],
});

export default class LeafletMarkerPinMap extends LeafletMap {
  componentDidMount() {
    super.componentDidMount();

    this.pinMarkerLayer = L.layerGroup([]).addTo(this.map);
    this.componentDidUpdate({}, {});
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    try {
      const { pinMarkerLayer } = this;
      const { points, data } = this.props;
      const columnsMetadata = data.cols;
      const pinNameIndex = columnsMetadata.findIndex(
        col => col.name === STATIC_TOOLTIP_FIELD_KEY,
      );
      const markerNames =
        pinNameIndex > -1 ? data.rows.map(row => row[pinNameIndex]) : undefined;

      const markers = pinMarkerLayer.getLayers();
      const max = Math.max(points.length, markers.length);
      for (let i = 0; i < max; i++) {
        if (i >= points.length) {
          pinMarkerLayer.removeLayer(markers[i]);
        }
        if (i >= markers.length) {
          const marker = this._createMarker(i, markerNames?.[i]);
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

  _createMarker = (rowIndex, markerName) => {
    const marker = L.marker([0, 0], {
      icon: markerName ? getIconWidthTooltip(markerName) : MARKER_ICON,
    });

    const { onHoverChange, onVisualizationClick, settings } = this.props;
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
    if (onVisualizationClick) {
      marker.on("click", () => {
        const {
          series: [
            {
              data: { cols, rows },
            },
          ],
        } = this.props;
        // if there is a primary key then associate a pin with it
        const pkIndex = _.findIndex(cols, isPK);
        const hasPk = pkIndex >= 0;

        const data = cols.map((col, index) => ({
          col,
          value: rows[rowIndex][index],
        }));

        onVisualizationClick({
          value: hasPk ? rows[rowIndex][pkIndex] : null,
          column: hasPk ? cols[pkIndex] : null,
          element: marker._icon,
          origin: { row: rows[rowIndex], cols },
          settings,
          data,
        });
      });
    }
    return marker;
  };
}
