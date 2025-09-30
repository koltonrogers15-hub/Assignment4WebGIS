// Make the Leaflet map in the div with id="eqmap"
const map = L.map('eqmap').setView([38, -95], 4);

// Esri raster Topographic basemap (no API key required)
L.esri.basemapLayer('Topographic').addTo(map);

// USGS GeoJSON feed
const quakesUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// Load with jQuery (to match your weather page style)
$.getJSON(quakesUrl, function (geojson) {
  L.geoJSON(geojson, {
    pointToLayer: function (feature, latlng) {
      var mag = (feature && feature.properties && feature.properties.mag != null)
        ? Number(feature.properties.mag) : 0;

      const color =
        mag >= 5 ? '#d73027' :
        mag >= 4 ? '#fc8d59' :
        mag >= 3 ? '#fee08b' :
        mag >= 2 ? '#91cf60' :
                   '#1a9850';

      const radius = Math.max(2, mag * 2.5);

      return L.circleMarker(latlng, {
        radius: radius,
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.6
      });
    },
    onEachFeature: function (feature, layer) {
      const p = feature.properties || {};
      const magStr = (p.mag != null) ? Number(p.mag).toFixed(1) : 'N/A';
      const place = p.place || 'Unknown location';
      const time = p.time ? new Date(p.time).toLocaleString() : 'Unknown time';
      layer.bindPopup('<strong>M ' + magStr + '</strong><br>' + place + '<br>' + time);
    }
  }).addTo(map); // <— chain directly; no undefined variable
}).fail(function (jqxhr, textStatus, error) {
  console.error('Failed to load earthquakes:', textStatus || error);
});
