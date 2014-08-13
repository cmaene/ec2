var style = {
    fillColor: '#000',
    fillOpacity: 0.1,
    strokeWidth: 0
};
// Avoid pink error tiles
OpenLayers.IMAGE_RELOAD_ATTEMPTS = 5;
OpenLayers.Util.onImageLoadErrorColor = "transparent";
//var options = {projection: "EPSG:4326",maxExtent: new OpenLayers.Bounds(-88.595,40.787,-86.595,42.787)};
var map = new OpenLayers.Map('map',{projection: new OpenLayers.Projection("EPSG:900913"),displayProjection: new OpenLayers.Projection("EPSG:4326")});
																																	//var map = new OpenLayers.Map('map');
var nexrad_wms = new OpenLayers.Layer.WMS("Nexrad","http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?",{layers:"nexrad-n0q",transparent:true,format:'image/png',reaspect:false},{isBaseLayer: false, singleTile: true});
//,{isBaseLayer: false, buffer:0, singleTile: true, opacity: 0.8}

var tract10 = new OpenLayers.Layer.WMS("tract10",
    "http://ec2-54-191-32-18.us-west-2.compute.amazonaws.com:8080/geoserver/cite/wms?",
    {layers:"cite:tract10",transparent:true,format:'image/png',reaspect:false},
    {isBaseLayer: false, singleTile: true});

var hospitals = new OpenLayers.Layer.WMS("hospitals",
    "http://ec2-54-191-32-18.us-west-2.compute.amazonaws.com:8080/geoserver/cite/wms?",
    {layers:"cite:hospitalspt",transparent:true,format:'image/png',reaspect:false},
    {isBaseLayer: false, singleTile: true});

var layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
var vector = new OpenLayers.Layer.Vector('vector');
map.addLayers([layer, vector, nexrad_wms]);
//map.addLayers([tract10]);
map.addLayers([hospitals]);


map.setCenter(
    new OpenLayers.LonLat(-87.595, 41.787).transform(
        new OpenLayers.Projection("EPSG:4326"),
		//new OpenLayers.Projection("EPSG:900913")
        map.getProjectionObject()
    ), 12
);

var pulsate = function(feature) {
    var point = feature.geometry.getCentroid(),
        bounds = feature.geometry.getBounds(),
        radius = Math.abs((bounds.right - bounds.left)/2),
        count = 0,
        grow = 'up';

    var resize = function(){
        if (count>16) {
            clearInterval(window.resizeInterval);
        }
        var interval = radius * 0.03;
        var ratio = interval/radius;
        switch(count) {
            case 4:
            case 12:
                grow = 'down'; break;
            case 8:
                grow = 'up'; break;
        }
        if (grow!=='up') {
            ratio = - Math.abs(ratio);
        }
        feature.geometry.resize(1+ratio, point);
        vector.drawFeature(feature);
        count++;
    };
    window.resizeInterval = window.setInterval(resize, 50, point, radius);
};

var geolocate = new OpenLayers.Control.Geolocate({
    bind: false,
    geolocationOptions: {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 7000
    }
});
map.addControl(geolocate);
var firstGeolocation = true;
geolocate.events.register("locationupdated",geolocate,function(e) {
    vector.removeAllFeatures();
    var circle = new OpenLayers.Feature.Vector(
        OpenLayers.Geometry.Polygon.createRegularPolygon(
            new OpenLayers.Geometry.Point(e.point.x, e.point.y),
            e.position.coords.accuracy/2,
            40,
            12
        ),
        {},
        style
    );
    var lat=e.position.coords.latitude;
    var lon=e.position.coords.longitude;
    vector.addFeatures([
        new OpenLayers.Feature.Vector(
            e.point,
            {},
            {
                graphicName: 'cross',
                strokeColor: '#f00',
                strokeWidth: 2,
                fillOpacity: 0,
                pointRadius: 10000
            }
        ),
        circle
    ]);
    var inputdata={};
        inputdata['lat']=lat;
        inputdata['lon']=lon;
    $.post('/app',inputdata, function(inputdata){
       $('#query').html(inputdata);
    });
    if (firstGeolocation) {
       map.zoomToExtent(vector.getDataExtent());
        pulsate(circle);
        firstGeolocation = false;
        this.bind = true;
    }
});
geolocate.events.register("locationfailed",this,function() {
    OpenLayers.Console.log('Location detection failed');
});
document.getElementById('locate').onclick = function() {
    vector.removeAllFeatures();
    geolocate.deactivate();
    geolocate.watch = false;
    firstGeolocation = true;
    geolocate.activate();
};
document.getElementsByClassName('olControlAttribution')[0].style.bottom='1px'

