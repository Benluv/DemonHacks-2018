(function () {
'use strict';

var app_id = "DemoAppId01082013GAL";
var app_code = "AJKnXv84fjrb0KIHawS0Tg";

var queries = {"query":{"fileName":"./query.json","dataset":"561122bec90a46778e08c366ce201402","id":"0178cae13063446dad958ff31badda63"}};

const {query} = queries;

// Initialize communication with the platform, to access your own data, change the values below
// https://developer.here.com/documentation/geovisualization/topics/getting-credentials.html

// We recommend you use the CIT environment. Find more details on our platforms below
// https://developer.here.com/documentation/map-tile/common/request-cit-environment-rest.html

const platform = new H.service.Platform({
    app_id,
    app_code,
    useCIT: true,
    useHTTPS: true
});

// Initialize a map
const pixelRatio = devicePixelRatio > 1 ? 2 : 1;
const defaultLayers = platform.createDefaultLayers({tileSize: 256 * pixelRatio});
const map = new H.Map(
    document.getElementsByClassName('dl-map')[0],
    defaultLayers.normal.basenight,
    {pixelRatio}
);
window.addEventListener('resize', function() {
    map.getViewPort().resize();
});

// Make the map interactive
new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
let ui = H.ui.UI.createDefault(map, defaultLayers);
ui.removeControl('mapsettings');

// Instantiate data lens service
var service = platform.configure(new H.datalens.Service());

let userRadius = prompt("What radius in KM")

// Instantiate a circle object (using the default style):
var circle = new H.map.Circle({lat: 41.8781, lng: -87.6298}, userRadius*1000);
  
// Add the circle to the map:
map.addObject(circle);


// Get query stats
service.fetchQueryStats(query.id, {
    stats: [
        {
            column_stats: {
                count_sum: ['$min', '$max', '$average'],
                lat_avg: ['$min', '$max'],
                lon_avg: ['$min', '$max']
            },
            dynamic: {
                x: '$drop',
                y: '$drop',
                z: 15
            }
        }
    ]
}).then(({stats}) => {

    const columnStats = stats[0].column_stats;

    // Set map bounds
    map.setViewBounds(new H.geo.Rect(
        columnStats.lat_avg.$max,
        columnStats.lon_avg.$min,
        columnStats.lat_avg.$min,
        columnStats.lon_avg.$max
    ), false);

    const colorScale = d3.scaleLinear().range([
        'rgba(30, 68, 165, 0.03)',
        'rgba(87, 164, 217, 0.8)',
        'rgba(202, 248, 191, 0.8)'
    ]).domain([0,.5,1]);

    //init controls
    const bandwidthCtl = new Slider(10);
    const radiusCtl = new Slider(10);

    let bandwidth = [{
            value: 0.5,
            zoom: 4
        },
        {
            value: 4,
            zoom: 17
        }
    ];

    let radius = [{
        value: 0.5
    }]

    const provider = new H.datalens.QueryTileProvider(
        service, {
            queryId: query.id,
            tileParamNames: {
                x: 'x',
                y: 'y',
                z: 'z'
            }
        }
    );

    const layer = new H.datalens.HeatmapLayer(
        provider, {
            rowToTilePoint: function(row) {
                return {
                    x: row.tx,
                    y: row.ty,
                    value: row.count_sum,
                    count: 1
                };
            },
            bandwidth: bandwidth,
            radius: radius,
            valueRange: {
                value: columnStats.count_sum.$average,
                zoom: 4
            },
            colorScale
        }
    );

    map.addLayer(layer);

    //init legend panel
    const panel = new Panel('Density map');
    const bandwidthLabel = new Label();
    const radiusLabel = new Label();
    const colorLegend = new ColorLegend(colorScale);
    ui.addControl('panel', panel);
    panel.addChild(bandwidthLabel);
    panel.addChild(bandwidthCtl);
    panel.addChild(radiusLabel);
    panel.addChild(radiusCtl);
    panel.addChild(colorLegend);

    //connect ui with layer
    function updateBandwidth() {
        let bandwidthCoeff = bandwidthCtl.getValue() >=1 ? bandwidthCtl.getValue()/10: 1;
        bandwidth[0].value = bandwidthCoeff * 0.5;
        bandwidth[1].value = bandwidthCoeff * 4;
        bandwidthLabel.setHTML(`bandwidth: ${bandwidthCoeff}px`);
    }

    function updateRadius() {
        let radiusCoeff = radiusCtl.getValue() >= 1 ? radiusCtl.getValue()/10: 1;
        radius.value = radiusCoeff * 4;
        // Instantiate a circle object (using the default style):
        var circle = new H.map.Circle({lat: 41.8781, lng: -87.6298}, userRadius*1000);
        radiusLabel.setHTML(`radius: ${radiusCoeff}km`)
        // Add the circle to the map:
        map.addObject(circle);
    }

    updateBandwidth();
    layer.addEventListener('update', updateBandwidth);
    updateRadius()
    layer.addEventListener('update', updateRadius);
    panel.addEventListener('change', () => layer.redraw());

});

}());
