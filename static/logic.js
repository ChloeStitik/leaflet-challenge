// Store our API endpoint
var queryUrl =
"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"

// Perform a GET request to the query URL/
d3.json(queryUrl).then(function (data) {
  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function bindPopuptoEarthquake(feature, layer) {
    layer.bindPopup(
      `<h3>Location: ${feature.properties.place}<br>` +
      `Magnitude: ${feature.properties.mag}<br>` +
      `Depth: ${feature.geometry.coordinates[2]}</h3><hr><p>${new Date(feature.properties.time)}</p>`);
  }


  function generateEarthquakeRadius(magnitude) {
   
    //Math messes up size if smaller than 1
    //Set default value
    if(magnitude < 1){
      return 2;
    }

    //Multiply by 2 so sizes are easily visible/clickable on map
    return magnitude*2;
  }
  function generateEarthquakeColor(depth) {
    if (depth > 9.0) {
      return "#330000";
    }
    if (depth > 8.0) {
      return "#660000";
    }
    if (depth > 7.0) {
      return "#990000";
    }
    if (depth > 6.0) {
      return "#CC0000";
    }
    if (depth > 5.0) {
      return "#CC6600";
    }
    if (depth > 4.0) {
      return "#FF8000";
    }
    if (depth > 3.0) {
      return "#FF9933";
    }
    if (depth > 2.0) {
      return "#FFB266";
    }
    if (depth > 1.0) {
      return "#FFFF00";
    } else {
      return "#FFFF99";
    }
  }
  function generateEarthquakeStyle(feature) {
    console.log(feature);
    return {
      color: generateEarthquakeColor(feature.geometry.coordinates[2]),
      radius: generateEarthquakeRadius(feature.properties.mag),
    };
  }

  function generateEarthquakeMarker(feature, layer) {
    return L.circleMarker(layer);
  }
  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  var earthquakes = L.geoJSON(data.features, {
    onEachFeature: bindPopuptoEarthquake,
    style: generateEarthquakeStyle,
    pointToLayer: generateEarthquakeMarker,
  });
  console.log(earthquakes);
  // Create the base layers.
  var street = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  var topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  });

  var PUBLIC_API_KEY =
    "pk.eyJ1Ijoic2NvbHNvbjgyIiwiYSI6ImNrdTYzbjhrdjU3ODMyb28yZmlrMHpybjYifQ.jzpQ-HWh3lT55X-v0IQoHA";

  let dark = L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery (c) <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      accessToken: PUBLIC_API_KEY,
    }
  );

  let satellite = L.tileLayer(
    "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery (c) <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      accessToken: PUBLIC_API_KEY,
    }
  );

  // Create a baseMaps object.
  var baseMaps = {
    "Street Map": street,
    "Topographic Map": topo,
    Dark: dark,
    Satellite: satellite,
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load.
  var myMap = L.map("map", {
    center: [20.0, -4.0],
    zoom: 3,
    layers: [satellite, earthquakes],
  });

  var tectonicPlates = new L.LayerGroup();

  d3.json(
    "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
  ).then(function (tectonicPlateData) {
    L.geoJson(tectonicPlateData).addTo(tectonicPlates);
    tectonicPlates.addTo(myMap);
    console.log(tectonicPlates);
  });

  // Create an overlay object to hold our overlay.
  var overlayMaps = {
    // Add Tectonic Plates
    "Tectonic Plates": tectonicPlates,
    Earthquakes: earthquakes,
  };

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control
    .layers(baseMaps, overlayMaps, {
      collapsed: false,
    })
    .addTo(myMap);

  // Set up the legend.
  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");
    var limits = [0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0];
    var colors = [
      "#FFFF99",
      "#FFFF00",
      "#FFB266",
      "#FF9933",
      "#FF8000",
      "#CC6600",
      "#CC0000",
      "#990000",
      "#660000",
      "#330000",
    ];

    // Add the minimum and maximum.
    var legendInfo = `
      <h1>Earthquake Magnitude and Depth</h1>
      <div class="labels">
      </div>
      <table style="width: 100%">`;

    limits.forEach(function (limit, index) {
      legendInfo += '<tr><td style="width: 5%">' + limit + '</td><td style="background-color: ' + colors[index] + '; width: 95%"></td></tr>';
    });

    legendInfo += "</table>";
    div.innerHTML = legendInfo;
    return div;
  };

  // Adding the legend to the map
  legend.addTo(myMap);
});