var map = L.map('weathermap').setView([38, -95], 4);

var basemap = L.esri.basemapLayer('Topographic').addTo(map);

// 2) Make two overlay groups
var weatherLayers = L.layerGroup().addTo(map); // default ON to match your original weather page
var quakesLayer   = L.layerGroup();            // off until user clicks "Quakes"

function getColor(m) {
  return m >= 6 ? '#800026' :  // deep red
         m >= 5 ? '#bd0026' :  // red
         m >= 4 ? '#f03b20' :  // orange-red
         m >= 3 ? '#fd8d3c' :  // orange
         m >= 2 ? '#fecc5c' :  // yellow
         m >= 1 ? '#c2e699' :  // light green
                  '#78c679';   // green
}

// YOUR radius rule
function styleForMag(m) {
  return {
    radius: Math.max(2, m * 3.5),
    fillColor: getColor(m),
    color: '#000',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.85
  };
}

// Legend (top-right)
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

// Show legend ONLY when quakesLayer is on the map
let legendOn = false;
function refreshLegend() {
  if (map.hasLayer(quakesLayer)) {
    if (!legendOn) { legend.addTo(map); legendOn = true; }
  } else {
    if (legendOn) { map.removeControl(legend); legendOn = false; }
  }
}
refreshLegend(); // ensure hidden at load

// Radar WMS
var radarUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';
var radarDisplayOptions = {
  layers: 'nexrad-n0r-900913',
  format: 'image/png',
  transparent: true
};
L.tileLayer.wms(radarUrl, radarDisplayOptions).addTo(weatherLayers);

// Alerts GeoJSON
var weatherAlertsUrl = 'https://api.weather.gov/alerts/active?region_type=land';
$.getJSON(weatherAlertsUrl, function (data) {
  L.geoJSON(data, {
    style: function (feature) {
      var alertColor = 'orange';
      if (feature.properties.severity === 'Severe') alertColor = 'red';
      else if (feature.properties.severity === 'Minor') alertColor = 'yellow';
      else if (feature.properties.severity === 'Extreme') alertColor = 'purple';
      return { color: alertColor };
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(feature.properties.headline || 'No headline');
    }
  }).addTo(weatherLayers);
});

// 4) === EARTHQUAKES (jQuery style to match) ===
var quakesUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
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
      var p = feature.properties || {};
      var magStr = (p.mag != null) ? Number(p.mag).toFixed(1) : 'N/A';
      var place = p.place || 'Unknown location';
      var time = p.time ? new Date(p.time).toLocaleString() : 'Unknown time';
      layer.bindPopup('<strong>M ' + magStr + '</strong><br>' + place + '<br>' + time);
    }
  }).addTo(quakesLayer);
});

// 5) Two-button toggle control (Weather / Quakes)
var ToggleCtl = L.Control.extend({
  options: { position: 'topleft' },
  onAdd: function () {
    var div = L.DomUtil.create('div', 'leaflet-bar');
    div.innerHTML =
      '<button id="btnWeather" style="padding:20px 20px;border:0;background:#fff;border-right:1px solid #ccc;cursor:pointer;">Weather</button>' +
      '<button id="btnQuakes"  style="padding:20px 20px;border:0;background:#f5f5f5;cursor:pointer;">Quakes</button>';
    // prevent map drag when clicking
    L.DomEvent.disableClickPropagation(div);
    return div;
  }
});
map.addControl(new ToggleCtl());

// wire up the buttons
document.getElementById('btnWeather').onclick = function () {
  if (!map.hasLayer(weatherLayers)) map.addLayer(weatherLayers);
  if (map.hasLayer(quakesLayer))    map.removeLayer(quakesLayer);
  // button styles
  this.style.background = '#fff';
  document.getElementById('btnQuakes').style.background = '#f5f5f5';
  refreshLegend(); // update legend visibility
};

document.getElementById('btnQuakes').onclick = function () {
  if (!map.hasLayer(quakesLayer))   map.addLayer(quakesLayer);
  if (map.hasLayer(weatherLayers))  map.removeLayer(weatherLayers);
  // button styles
  this.style.background = '#fff';
  document.getElementById('btnWeather').style.background = '#f5f5f5';
  refreshLegend(); // update legend visibility
};
