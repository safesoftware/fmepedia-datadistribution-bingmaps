//
//  maps-controller.js
//  demos
//
//  Created by SHarper on 2012-01-12.
//

function BingMapsManager() {

	this._onDrawMouseMove;
	this._onDrawMouseDown;
	this._onDrawInitMouseMove;
	this._onDrawMouseDoubleClick;
	this.myPoints = [];

	this.bingMap = new VEMap('mapBingMaps');
	this.bingMap.LoadMap(new VELatLong(lat, lon), 11);
	this.drawLayer = new VEShapeLayer();
	this.bingMap.AddShapeLayer(this.drawLayer);

}

/**
 * Fired when the user clicks the draw polygon button
 */
BingMapsManager.prototype.drawPolygon = function() {
	this.drawLayer.DeleteAllShapes();
	// Activate a draw tool: attach events.
	var me = this;
	this._onDrawMouseDown = function(e) {
		me.onDrawMouseDown(e)
	};
	this._onDrawInitMouseMove = function(e) {
		me.onDrawInitMouseMove(e)
	};

	this.bingMap.AttachEvent("onmousedown", this._onDrawMouseDown);
	this.bingMap.AttachEvent("onmousemove", this._onDrawInitMouseMove);
};


/**
 * Called when the mouse is first initialized
 * @param {Object} e
 */
BingMapsManager.prototype.onDrawInitMouseMove = function(e) {
	document.getElementById("mapBingMaps").style.cursor = 'crosshair';

}
/**
 * Called when the user clicks a new point
 * @param {Object} e
 */
BingMapsManager.prototype.onDrawMouseDown = function(e) {
	var x = e.mapX;
	var y = e.mapY;
	var pixel = new VEPixel(x, y);
	var LL = this.bingMap.PixelToLatLong(pixel);
	var me = this;
	
	// Switch to drawing mouse movement handler
	if(this.myPoints.length == 0) {
		this._onDrawMouseMove = this.onDrawMouseMove;
		this.bingMap.DetachEvent("onmousemove", this._onDrawInitMouseMove);
		
		this._onDrawMouseMove = function(e) {
			me.onDrawMouseMove(e)
		};
		
		this.bingMap.AttachEvent("onmousemove", this._onDrawMouseMove);
	}

	this.myPoints.push(LL);

	if(e.rightMouseButton) {
		this.bingMap.DetachEvent("onmousemove", this._onDrawMouseMove);
		this.bingMap.DetachEvent("onmousedown", this._onDrawMouseDown);
		this.bingMap.DetachEvent("onmousemove", this._onDrawInitMouseMove);

		this.drawLayer.DeleteAllShapes();

		var myCurrentShape = new VEShape(VEShapeType.Polygon, this.myPoints);

		// Draw completed shape
		myCurrentShape.HideIcon();
		this.drawLayer.AddShape(myCurrentShape);
		this.createPolygonXMLString(this.myPoints);
		this.myPoints = [];
		// Reset cursor
		document.getElementById("mapBingMaps").style.cursor = 'point';

	}

}
/**
 * Called when the user moves the mouse in draw mode
 * @param {Object} e
 */
BingMapsManager.prototype.onDrawMouseMove = function(e) {

	document.getElementById("mapBingMaps").style.cursor = 'crosshair';
	var x = e.mapX;
	var y = e.mapY;
	pixel = new VEPixel(x, y);
	var LL = this.bingMap.PixelToLatLong(pixel);
	var tempPoints = this.myPoints.slice(0, this.myPoints.length);
	tempPoints.push(LL);

	// Delete the temporary shape (and all others) and draw the new one
	this.drawLayer.DeleteAllShapes();

	// Draw a line
	if(tempPoints.length == 2) {
		var tempShape = new VEShape(VEShapeType.Polyline, tempPoints);
		tempShape.HideIcon();
		this.drawLayer.AddShape(tempShape);
	}
	// Draw a line or polygon
	else if(tempPoints.length > 2) {
		tempShape = new VEShape(VEShapeType.Polygon, tempPoints);

		tempShape.HideIcon();
		this.drawLayer.AddShape(tempShape);
	}
}
/**
 * Called when the user clicks the Clear button
 */
BingMapsManager.prototype.clearPolygon = function() {

	document.getElementById('geom').value = "";
	dataDist.updateQuery();

	this.myPoints = [];
	this.drawLayer.DeleteAllShapes();
	
}
/**
 * Builds up the WKT String which will be passed into the post request and used by FME Server to generate the
 * bounding box.
 */
BingMapsManager.prototype.createPolygonXMLString = function(coords) {

	var header = "Polygon((";
	var footer = "))";
	
	var textString = header;

	for(var i=0; i < coords.length; i++){
        var lat = coords[i].Latitude;
        var lng = coords[i].Longitude;
        textString += lng + ' ';
        textString += lat + ',';
    }

    textString = textString.substring(0,textString.length - 1);
	textString += footer;
	
	//Write text to GEOM object.
	document.getElementById('geom').value = textString;
	dataDist.updateQuery();
}