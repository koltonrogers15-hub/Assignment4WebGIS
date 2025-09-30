// Make the Leaflet map in the div with id="eqmap"
const map = L.map('eqmap').setView([38, -95], 4);

// Esri raster Topographic basemap (no API key required)
L.esri.basemapLayer('Topographic').addTo(map);


/* === Always-on legend (top-right) === */
function getColor(m) {
  return m >= 6 ? '#800026' :
         m >= 5 ? '#bd0026' :
         m >= 4 ? '#f03b20' :
         m >= 3 ? '#fd8d3c' :
         m >= 2 ? '#fecc5c' :
         m >= 1 ? '#c2e699' :
                  '#78c679';
}

const legend = L.control({ position: 'topright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  const grades = [0, 1, 2, 3, 4, 5, 6];
  const labels = ['0–1', '1–2', '2–3', '3–4', '4–5', '5–6', '6+'];

  div.innerHTML += '<h4>Magnitude</h4>';
  for (let i = 0; i < grades.length; i++) {
    div.innerHTML +=
      `<i style="background:${getColor(grades[i] + 0.001)}"></i> ${labels[i]}<br>`;
  }
  L.DomEvent.disableClickPropagation(div);
  return div;
};
legend.addTo(map);





// USGS GeoJSON feed
const quakesUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

// Load with jQuery (to match your weather page style)
$.getJSON(quakesUrl, function (geojson) {
  L.geoJSON(geojson, {
    pointToLayer: function (feature, latlng) {
      var mag = (feature && feature.properties && feature.properties.mag != null)
        ? Number(feature.properties.mag) : 0;

   const color =
  mag >= 6 ? '#800026' :  // very strong → deep red
  mag >= 5 ? '#bd0026' :  // strong → red
  mag >= 4 ? '#f03b20' :  // moderate → orange-red
  mag >= 3 ? '#fd8d3c' :  // orange
  mag >= 2 ? '#fecc5c' :  // yellow
  mag >= 1 ? '#c2e699' :  // light green
             '#78c679';   // green
      const radius = Math.max(2, mag * 3.5);

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
      layer.bindPopup('<strong>Mw ' + magStr + '</strong><br>' + place + '<br>' + time);
    }
  }).addTo(map); // <— chain directly; no undefined variable
}).fail(function (jqxhr, textStatus, error) {
  console.error('Failed to load earthquakes:', textStatus || error);
});
