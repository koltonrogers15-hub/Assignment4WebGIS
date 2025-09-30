var map = L.map('weathermap').setView([38, -95], 4);

var basemap = L.esri.basemapLayer('Topographic').addTo(map);

// add the national precipitation radar layer
var radarUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';
var radarDisplayOptions = {
  layers: 'nexrad-n0r-900913',
  format: 'image/png',
  transparent: true
};
var radar = L.tileLayer.wms(radarUrl, radarDisplayOptions).addTo(map);

// add alerts layer
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
  }).addTo(map);
});
