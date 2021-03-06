var React = require('react')
  , FixedDataTable = require('fixed-data-table')
  , LayerActions = require('../actions/LayerActions')

var Table = FixedDataTable.Table
var Column = FixedDataTable.Column

var AttributeTable = React.createClass({
  rowGetter: function(rowIndex) {
    return this.rowValues[rowIndex]
  },
  rowClassNameGetter: function(rowIndex) {
    var feature = this.props.layer.geojson.features[rowIndex]
    return feature.selected ? 'selected' : null
  },
  onRowClick: function(e, rowIndex) {
    var feature = this.props.layer.geojson.features[rowIndex]
    feature.selected = !feature.selected
    LayerActions.update(this.props.layer.id, {geojson: this.props.layer.geojson})
  },
  makeTable: function() {
    this.tableWidth = $('.work-space').innerWidth() - 4
    this.tableHeight = 200
    var indexColumnWidth = 30
    var columnLabels = _.pluck(this.props.layer.geojson.features, 'properties')
    columnLabels = columnLabels.map(function(c) { return _.keys(c) })
    columnLabels = _.uniq(_.flatten(columnLabels))
    var columnWidth = (this.tableWidth - indexColumnWidth)/columnLabels.length
    this.columns = columnLabels.map(function(label, idx) {
      return <Column
               label={label}
               width={columnWidth}
               dataKey={idx+1}
               key={idx+1} />
    })
    this.columns.unshift(
      <Column
        label={'idx'}
        width={indexColumnWidth}
        dataKey={0}
        key={0} />
    )

    this.rowValues = this.props.layer.geojson.features.map(function(f, idx) {
      var row = _.values(f.properties)
      row.unshift(idx)
      return row
    })
  },
  render: function() {
    this.makeTable()
    return (
      <div className="attribute-table">
        <Table
            rowHeight={20}
            rowGetter={this.rowGetter}
            rowClassNameGetter={this.rowClassNameGetter}
            onRowClick={this.onRowClick}
            rowsCount={this.props.layer.geojson.features.length}
            width={this.tableWidth}
            maxHeight={this.tableHeight}
            headerHeight={20}>
            {this.columns}
          </Table>
      </div>
    )
  }
})

module.exports = AttributeTable