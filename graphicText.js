function pixelText(a, b, c, d, e){
  //Parameters: textString, width_in_characters, font_to_use, p5_color
  //(in any order)
  
  // font_to_use is:
  // font = {
  //   image: p5_image,
  //   character_width: 16, //px
  //   key: "abc...",
  //   iterated_drawing_speed: 2, //characters per farme
  // }
  
  var params = [a,b,c,d,e]
  var funcs = [
    (n) => { return typeof n == "string" },
    (n) => { return typeof n == "number" }, //width_in_characters
    (n) => { return typeof n == "object" && n.mode !== undefined }, //color
    (n) => { return typeof n == "object" && n.image !== undefined }, //font_to_use object
  ]
  params = params.itemsThatMeet( funcs )
  var textString = params[0]
  var width_in_characters = params[1]
  var textColor = params[2]
  var font_to_use = params[3]
  var iterate_rendering = font_to_use.iterated_drawing_speed !== undefined;
  
  width_in_characters = width_in_characters || Infinity
  
  if(!font_to_use.image || !font_to_use.character_width || !font_to_use.key ){
    console.error("font_to_use must have the following properties: image, character_width, key")
  }
  
  textString = addLineBreaksForWordWrapping(textString, width_in_characters)
  var graphic_name = "pixel_text_" + textString + "_" + width_in_characters
  
  if(typeof pixel_text_graphics == "undefined"){
    pixel_text_graphics = {};
    mark_pixel_text_graphics_unused = () => {
      var k = Object.keys(pixel_text_graphics)
      for(var i = 0; i < k.length; i ++){
        pixel_text_graphics[k[i]].in_use = false;
      }
    }
    delete_unused_pixel_text_graphics = () => {
      var k = Object.keys(pixel_text_graphics)
      for(var i = 0; i < k.length; i ++){
        if(!pixel_text_graphics[k[i]].in_use){
          pixel_text_graphics[k[i]].canvas.remove()
          delete pixel_text_graphics[k[i]]
        }
      }
    }
    var old_p5_draw = draw;
    draw = function(){
      old_p5_draw();
      delete_unused_pixel_text_graphics();
      mark_pixel_text_graphics_unused();
    }
  }
  
  if(!pixel_text_graphics[graphic_name] ){
    if(Number.isInteger(width_in_characters))
      var gw = font_to_use.character_width * width_in_characters;
    else {
      var longestString = getLongestString(textString.split("\n") )
      var gw = font_to_use.character_width * longestString.length
    }
    var gh = textString.split("\n").length * font_to_use.character_width
    
    pixel_text_graphics[graphic_name] = createGraphics(gw, gh)
    var g = pixel_text_graphics[graphic_name]
    var x = 0;
    var y = 0;
    var cw = font_to_use.character_width
    if(textColor){
      g.tint(textColor)
    }
    if(!iterate_rendering){
      for(var i = 0; i < textString.length; i ++){
        var cc = font_characterToCoordinates( textString[i], font_to_use )
        if( cc ){
          g.image(font_to_use.image, x, y, cw, cw, cc.x, cc.y, cw, cw )
        }
        x += cw;
        if( textString[i] == "\n"){
          x = 0;
          y += cw;
        }
      }
    }
    g.in_use = true;
    return g
  } else {
    var g = pixel_text_graphics[graphic_name]
    if(iterate_rendering){
      for(var i = 0; i < font_to_use.iterated_drawing_speed; i ++){
        if(g.character_rendering === undefined){
          g.character_x = 0;
          g.character_y = 0;
          g.character_rendering = 0;
        }
        if(g.character_rendering !== -1){
          var cc = font_characterToCoordinates( textString[g.character_rendering], font_to_use )
          var cw = font_to_use.character_width
          if( cc ){
            g.image(font_to_use.image, g.character_x, g.character_y, cw, cw, cc.x, cc.y, cw, cw )
          }
          g.character_x += cw;
          if( textString[g.character_rendering] == "\n"){
            g.character_x = 0;
            g.character_y += cw;
          }
          if(g.character_rendering < textString.length)g.character_rendering ++;
          if(g.character_rendering == textString.length)g.character_rendering = -1;
        }
      }
    }
    g.in_use = true;
    return g;
  }
  
  
  _pixel_text_last_font_to_use = font_to_use;
}

function addLineBreaksForWordWrapping(textString, width_in_characters){
  if(typeof width_in_characters == "undefined")return textString;
  var lineLength = 0;
  var newString = ''
  var performed_linebreak = false;
  textString = textString.replaceAll('\n', ' \n ')
  textString = textString.split(' ')
  for(var i = 0; i < textString.length; i ++){
    if(textString[i] == "\n"){
      newString += "\n"
      lineLength  = 0;
    }
    var wordLength = textString[i].length + 1
    if(wordLength > 0 && textString[i] !== '\n'){
      if(lineLength + wordLength > width_in_characters){
        newString += "\n" + textString[i] + " "
        lineLength = wordLength;
      } else {
        newString += textString[i] + " "
        lineLength += wordLength
      }
    }
  }
  return newString;
}

function font_characterToCoordinates(character, fontObject){
  var i = fontObject.key.indexOf(character)
  var w = floor(fontObject.image.width/fontObject.character_width);
  var cw = fontObject.character_width
  if(i < 0){
    // console.warn("Character " + character + " is not part of the given font sheet")
    return null
  }
  var x = i % w
  var y = floor(i/w)
  return {x: x * cw, y: y * cw}
}

function getLongestString(stringsArray){
  var ret = '';
  for(var i = 0; i < stringsArray.length; i ++){
    if(stringsArray[i].length > ret.length)
    ret = stringsArray[i]
  }
  return ret;
}
