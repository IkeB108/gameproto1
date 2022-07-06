function preload() {
  myMapJson = loadJSON("road3.json")
}
function setup() {
  //canvas is automatically created by p5js
  let mySettings = {
    mobile_friendly_canvas: true,
    minimum_width_to_height_ratio: 13/8,
    maximum_width_to_height_ratio: 3/1,
  }
  setupImprovedCursor(mySettings);
  
  screen_is_vertical = () => {
    return windowWidth/windowHeight < 3/4
  }
  
  images_to_load = [
    "fontSheet_basic",
  ]
  
  loaded_images = [];
  
  currentScreen = "loading"
  
  checkForLoadComplete = () => {
    if(loaded_images.length == images_to_load.length){
      fontSheets = {
        basic: {
          image: loaded_images[0],
          key: "\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂¡¢£¤¥¦§¨©ª«¬-®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſƒơƷǺǻǼǽǾǿȘșȚțɑɸˆˇˉ˘˙˚˛˜˝;΄΅Ά·ΈΉΊΌΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώϐϴЀЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяѐёђѓєѕіїјљњћќѝўџҐґ־אבגדהוזחטיךכלםמןנסעףפץצקרשתװױײ׳״ᴛᴦᴨẀẁẂẃẄẅẟỲỳ‐‒–—―‗‘’‚‛“”„‟†‡•…‧‰′″‵‹›‼‾‿⁀⁄⁔⁴⁵⁶⁷⁸⁹⁺⁻ⁿ₁₂₃₄₅₆₇₈₉₊₋₣₤₧₪€℅ℓ№™Ω℮⅐⅑⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞←↑→↓↔↕↨∂∅∆∈∏∑−∕∙√∞∟∩∫≈≠≡≤≥⊙⌀⌂⌐⌠⌡─│┌┐└┘├┤┬┴┼═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬▀▁▄█▌▐░▒▓■□▪▫▬▲►▼◄◊○●◘◙◦☺☻☼♀♂♠♣♥♦♪♫✓ﬁﬂ�! ",
          character_width: 16,
          iterated_drawing_speed: 4, //characters per frame
        }
      }
      setTimeout( ()=> {currentScreen = "start"}, 400)
    }
  }
  
  myMap = ``
  
  loadFailureCallback = (e) => {console.error(e)}
  
  for(var i = 0; i < images_to_load.length; i ++){
    var new_image = loadImage( images_to_load[i] + '.png', checkForLoadComplete, loadFailureCallback )
    loaded_images.push(new_image)
  }
  
  checkForLoadComplete();
  
  pixelTextGraphics = {};
  
  textSize(30);
  textFont("Courier");
  textAlign(CENTER,CENTER)
  
  all_graphics = {};
  color_palette = getColorPalette( myMapJson );
  
  imageMode(CENTER,CENTER)
  
  player = {
    x: 10,
    y: 10,
    timeOfMove: 0,
    last_horizontal_direction: "right"
  }
  player_has_moved = false;
  player_has_reached_house = false;
  noSmooth()
  
  tileDisplaySize = width/20;
  
}

function draw() {
  background(0);
  // drawImprovedCursorOverlay();
  if(currentScreen == "loading"){
    fill(255);
    text("Loading... " + loaded_images.length + "/" + images_to_load.length, width/2, height/2)
    if(frameCount == 5)mapGraphic = getMapGraphic(myMapJson);
  }
  if(currentScreen == "play"){
    // image( pixelText(30, myMap, fontSheets.basic, color(100,100,255), true ), 0, 0)
    var w = myMapJson.tileMap.layers[0].gridWidth * tileDisplaySize
    var h = myMapJson.tileMap.layers[0].gridHeight * tileDisplaySize
    var mapx = (player.x * tileDisplaySize * -1) + width/2 + (tileDisplaySize/2)
    var mapy = (player.y * tileDisplaySize * -1) + height/2 + (tileDisplaySize/2)
    image( mapGraphic, mapx, mapy, w, h )
    
    if(!(onMobile && screen_is_vertical()) ){
      updatePlayer()
    }
    drawPlayer()
    
    if(!player_has_moved){
      if(onMobile)var t = "Tap and drag\nin a direction\nto move"
      else var t = "Press the\narrow keys\nto move"
    } else {
      if(!player_has_reached_house)
      var t = "Find the\nyellow house"
      if(player_has_reached_house)
      var t = "The End.\nTap anywhere\nto continue"
    }
    var img = pixelText(t, fontSheets.basic, color(0) )
    var w = width/2;
    var h = (w/img.width) * img.height
    tint(255, map( sin(frameCount/10), -1, 1, 100, 255) )
    image (img, width/2, height*(1/5), w, h)
    noTint()
    
  }
  if(currentScreen == "end"){
    var t = "That is all for now. Thank you! Click or tap anywhere to visit a short survey"
    var img = pixelText(t, 20, fontSheets.basic, color(255) )
    var w = width * (3/4);
    var h = (w/img.width) * img.height
    image (img, width/2, height/2, w, h)
  }
  if(currentScreen == "start"){
    var t = "This is a very basic prototype for a game. Try it on a mobile device or on a PC. Click or tap anywhere to continue"
    var img = pixelText(t, 20, fontSheets.basic, color(255) )
    var w = width * (3/4);
    var h = (w/img.width) * img.height
    image (img, width/2, height/2, w, h)
  }
  warnIfVerticalScreen();
}

function updatePlayer(){
  var moveValid = frameCount - player.timeOfMove >= 10
  var directions = [];
  
  if(keyIsDown(UP_ARROW))directions.push("up")
  if(keyIsDown(DOWN_ARROW))directions.push("down")
  if(keyIsDown(LEFT_ARROW))directions.push("left")
  if(keyIsDown(RIGHT_ARROW))directions.push("right")
  
  var far_dist = dist(icursor.x, icursor.y, icursor_at_press.x, icursor_at_press.y) >= width/10;
  if(onMobile && icursor.pressed && far_dist){
    var ao = angleOf(icursor_at_press, icursor)
    if( ao.isBetween(225,315) ) directions.push("left")
    if( ao.isBetween(45,135) ) directions.push("right")
    if( ao.isBetween(316,360) || ao.isBetween(0, 45) ) directions.push("up")
    if( ao.isBetween(136, 225) ) directions.push("down")
  }
  
  if(directions.length > 0 && moveValid){
    player.timeOfMove = frameCount;
    player_has_moved = true;
    if(directions.includes("left") ){player.x --; player.last_horizontal_direction = "left"}
    if(directions.includes("right") ){player.x ++; player.last_horizontal_direction = "right"}
    if(directions.includes("up") )player.y --;
    if(directions.includes("down") )player.y ++;
  }
  
  player.x = constrain(player.x, -19, 20)
  player.y = constrain(player.y, -19, 20)
  
  if(player.x.isBetween(-9, -6) && player.y.isBetween(-11, -8)){
    player_has_reached_house = true;
  }
}

function cursorClick(buttonClicked){
  if( !(onMobile && screen_is_vertical() ) ) {  
    if(currentScreen == "end")window.location = "https://forms.gle/5e7dApREHpn4duN36"
    if(currentScreen == "play" && player_has_reached_house){
      currentScreen = "end"
    }
    if(currentScreen == "start"){
      currentScreen = "play";
    }
  }
}

function warnIfVerticalScreen(){
  if(onMobile && screen_is_vertical() ){
    if(currentScreen !== "loading"){
      background(0,200)
      var img = pixelText("Please rotate your device\nto be horizontal", fontSheets.basic)
      var w = width;
      var h = (w/img.width) * img.height
      image (img, width/2, height/2, w, h)
    }
  }
}

function drawPlayer(){
  var amp_x = 64;
  var amp_y = 24;
  if(player.last_horizontal_direction == "left"){
    push();
    translate(width/2, height/2)
    scale(-1, 1)
    image( getTileSetGraphic( myMapJson ), 0, 0, tileDisplaySize, tileDisplaySize, amp_x, amp_y, 8, 8 )
    pop();
  }
  else
  image( getTileSetGraphic( myMapJson ), width/2, height/2, tileDisplaySize, tileDisplaySize, amp_x, amp_y, 8, 8 )
}

function graphicIsBlank(graphic){
  graphic.loadPixels();
  var isBlank = true;
  var p = graphic.pixels;
  for(var i = 0; i < p.length; i += 4){
    if(p[i] !== 0 || p[i+1] !== 0 || p[i+2] !== 0)isBlank = false;
  }
  return isBlank;
}

function mapJsonToText(jsonObj){
  var json_characters_key = ""
  var layers = jsonObj.tileMap.layers
  var ret_layers = [];
  for(var l = 0; l < layers.length; l ++){
    var new_layer = '';
    
    ret_layers.push(new_layer)
  }
}
