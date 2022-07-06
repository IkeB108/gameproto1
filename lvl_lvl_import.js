
function coordinates_of_character(charIndex){
  if(character_coordinates[charIndex])
  return character_coordinates[charIndex]
  
  return null;
}

function getTileSetGraphic( allMapData ){
  var graphic_name = "tileset_graphic_" + allMapData.tileSet.id
  if(all_graphics[graphic_name] ){
    return all_graphics[graphic_name];
  } else {
    var tileSetData = allMapData.tileSet.tiles
    var tileWidth = allMapData.tileSet.width;
    var tileHeight = allMapData.tileSet.height;
    var paletteHeight = ceil(tileSetData.length / 10)
    var tileGraphic = createGraphics(10 * tileWidth, paletteHeight * tileWidth )
    
    var tilex = 0;
    var tiley = 0;
    for(var i = 0; i < tileSetData.length; i ++){
    // for(var i = 0; i <= 1; i ++){
      var tile = tileSetData[i].data[0]
      var graphic_this_tile = createGraphics(tileWidth, tileHeight)
      graphic_this_tile.loadPixels();
      var pix = graphic_this_tile.pixels
      for(var j = 0; j < tile.length; j ++){
        if(tile[j] == 1){
          pix[j*4] = 255;
          pix[j*4+1] = 255;
          pix[j*4+2] = 255;
          pix[j*4+3] = 255;
        }
      }
      graphic_this_tile.updatePixels();
      
      tileGraphic.image(graphic_this_tile, tilex, tiley)
      
      if(typeof character_coordinates == "undefined")
      character_coordinates = {}
      
      character_coordinates[i] = {x: tilex, y: tiley}
      
      graphic_this_tile.elt.remove()
      
      tilex += tileWidth;
      if(tilex >= tileWidth * 10){
        tilex = 0;
        tiley += tileHeight;
      }
    }
    
    all_graphics[graphic_name] = tileGraphic;
    return tileGraphic;
    
  }
}

function getLayerGraphic( layerIndex , allMapData ){
  var graphic_name = "layer_graphic_" + layerIndex;
  if(all_graphics[graphic_name] ){
    return all_graphics[graphic_name];
  } else {
    var layerObject = allMapData.tileMap.layers[layerIndex]
    var gridw = layerObject.gridWidth;
    var gridh = layerObject.gridHeight;
    var tilew = allMapData.tileSet.width
    var layerGraphic = createGraphics( gridw * tilew, gridh * tilew )
    var layerArray = layerObject.frames[0].data
    var tileSetGraphic = getTileSetGraphic( allMapData );
    for(var y = 0; y < gridh; y ++){
      for(var x = 0; x < gridw; x ++){
        var thisTile = layerArray[y][x]
        var charCoords = coordinates_of_character( thisTile.t )
        if(charCoords !== null){
          layerGraphic.tint( "#" + color_palette[thisTile.fc] )
          // tint( "#FF0000" )
          layerGraphic.image( tileSetGraphic,
            x * tilew,
            y * tilew,
            tilew,
            tilew,
            charCoords.x,
            charCoords.y,
            tilew,
            tilew
          )
        }
      }
    }
    all_graphics[graphic_name] = layerGraphic;
    return layerGraphic;
  }
}

function getMapGraphic( allMapData ){
  var graphic_name = "complete_map_graphic"
  if(all_graphics[graphic_name]) return all_graphics[graphic_name]
  else {
    var layers = allMapData.tileMap.layers;
    var gridw = allMapData.tileMap.layers[0].gridWidth;
    var gridh = allMapData.tileMap.layers[0].gridHeight;
    var tilew = allMapData.tileSet.width
    var completeGraphic = createGraphics(gridw * tilew, gridh * tilew)
    for(var i = 0; i < layers.length; i ++){
      var layerGraphic = getLayerGraphic(i, allMapData)
      completeGraphic.image(layerGraphic, 0, 0)
    }
    all_graphics[graphic_name] = completeGraphic;
    return completeGraphic
  }
}

function getColorPalette( allMapData ){
  var d = allMapData.colorPalette.data
  var ret = [];
  for(var i = 0; i < d.length; i ++){
    var col = d[i].toString(16)
    col = col.slice(2, col.length )
    ret.push( col )
  }
  return ret;
}
