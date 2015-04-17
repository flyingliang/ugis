var React = require('react')
  , numeral = require('numeral')
  , LayerActions = require('../actions/LayerActions')
  , palette = require('../utils/palette')

var selectedStyle = {
  weight: 3,
  color: '#f00'
}

var unselectedStyle = {
  weight: 3,
  color: palette.green
}

var pointStyle = {
  radius: 3,
  color: palette.green,
  weight: 1,
  opacity: 1,
  fillOpacity: 1
}

var lineStyle = {
  color: "blue",
  weight: 3,
  opacity: 1
}

var WorkSpace = React.createClass({
  componentDidMount: function() {
    this.makeMap()
  },
  componentDidUpdate: function() {
    this.map.invalidateSize()
  },
  updateCoords: function(x, y, z) {
    document.getElementsByClassName('message-bar-item coordinates')[0].innerHTML = 
      'x: ' + numeral(x).format('0,0.0000') + ' ' + 
      'y: ' + numeral(y).format('0,0.0000') + ' ' +
      'z: ' + z
  },
  makeMap: function() {
    var self = this
    this.map = L.map(this.refs.workspace.getDOMNode(), {
      attributionControl: false,
      zoomControl: false
    }).setView([30, 20], 2)
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/fsrw.lkf1pigd/{z}/{x}/{y}.png').addTo(this.map)
    this.workingLayers = L.featureGroup()
    this.map.addLayer(this.workingLayers)
    this.map.on('mousemove', function(e) {
      //self.updateCoords(e.latlng.lng, e.latlng.lat, self.map.getZoom())
    })
    this.map.on('draw:created', function (e) {
      for (var id in this.props.layers) {
        var layer = this.props.layers[id]
        if (layer.selected) {
          layer.geojson.features.push(e.layer.toGeoJSON())
          layer.mapLayer.clearLayers()
          layer.mapLayer = false
          LayerActions.update(layer.id, {geojson: layer.geojson, mapLayer: layer.mapLayer})
        }
      }
    }, this)
    this.map.on('draw:edited', function (e) {
      for (var id in this.props.layers) {
        var layer = this.props.layers[id]
        if (layer.selected) {
          layer.geojson = layer.mapLayer.toGeoJSON()
          layer.mapLayer.clearLayers()
          layer.mapLayer = false
          LayerActions.update(layer.id, {geojson: layer.geojson, mapLayer: layer.mapLayer})
        }
      }
    }, this)
  },
  featureOnClick: function(layer, feature, mapLayer) {
    if (layer.selected) {
      if (!feature.selected) {
        feature.selected = true
      } else {
        feature.selected = false
      }
      if (feature.selected) {
        mapLayer.setStyle(selectedStyle)
      } else {
        mapLayer.setStyle(unselectedStyle)
      }
      LayerActions.update(layer.id, {geojson: layer.geojson})
    }
  },
  styleFeature: function(feature) {
    if (feature.selected) {
      return selectedStyle
    } else {
      if (feature.geometry.type === 'Point') {
        return pointStyle
      } else if (feature.geometry.type === 'LineString') {
        return lineStyle
      } else {
        return unselectedStyle
      }
    }
  },
  addLayers: function(layer) {
    var self = this
    var style = {}
    var zoomToLayers = L.featureGroup()
    var layers = _.values(this.props.layers)
    layers = _.sortBy(layers, 'order')
    layers.forEach(function(layer) {
      if (layer.editGeoJSON) {
        style.marginRight = 400
      }
      if (layer.vector) {
        if (!layer.mapLayer) {
          layer.mapLayer = L.geoJson(layer.geojson, {
            pointToLayer: function(feature, latlng) {
              return L.circleMarker(latlng, pointStyle)
            },
            style: self.styleFeature,
            onEachFeature: function (layer, feature, mapLayer) {
              mapLayer.on('click', this.featureOnClick.bind(this, layer, feature, mapLayer))
            }.bind(self, layer)
          })
        } else {
          layer.mapLayer.setStyle(self.styleFeature)
        }

        if (layer.editing) {
          if (self.drawControl) {
            self.map.removeControl(self.drawControl)
          }
          self.drawControl = new L.Control.Draw({
            draw: {
              polyline: {
                  shapeOptions: unselectedStyle
              },
              polygon: {
                  shapeOptions: unselectedStyle
              },
              rectangle: {
                shapeOptions: unselectedStyle
              },
              circle: false
            },
            edit: {
              featureGroup: layer.mapLayer
            }
          })
          self.map.addControl(self.drawControl)
        } else {
          if (self.drawControl) {
            self.map.removeControl(self.drawControl)
            self.drawControl = false
          }
        }
      } else if (layer.tile) {
        if (!layer.mapLayer) {
          layer.mapLayer = L.tileLayer(layer.tileURL)
        }
      }
      if (layer.enabled) {
        if (layer.vector && layer.zoomTo) {
          zoomToLayers.addLayer(layer.mapLayer)
          layer.zoomTo = false
        }
        if(!self.workingLayers.hasLayer(layer.mapLayer)) {
          self.workingLayers.addLayer(layer.mapLayer)
        }
      } else {
        if(self.workingLayers.hasLayer(layer.mapLayer)) {
          self.workingLayers.removeLayer(layer.mapLayer)
        }
      }
    })
    if (zoomToLayers.getLayers().length) {
      if (zoomToLayers.getBounds().isValid()) {
        this.map.fitBounds(zoomToLayers.getBounds())
      }
      this.map.removeLayer(zoomToLayers)
      zoomToLayers = null
    }
    return style
  },
  render: function() {
    var style = this.addLayers()
    return (
      <div className="work-space" ref="workspace" style={style}>
      </div>
    )
  }
})

module.exports = WorkSpace