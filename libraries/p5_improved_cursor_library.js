/*
Variables for use:
    improved_cursor / icursor
    p_improved_cursor  / p_icursor
    improved_cursor_at_press / icursor_at_press
    scroll_velocity
    all_cursors
    onMobile

Functions for use:
    setupImprovedCursor
    changeImprovedCursorSettings
    updateScrollVelocity
    drawImprovedCursorOverlay

Callback Functions (you write these yourself):
    cursorPressStart()
    cursorPressEnd()
    cursorClick()
    cursorMove()

    mousePressStart()
    mousePressEnd()
    mouseMove()

    touchPressStart()
    touchPressEnd()
    touchMove()

Known issues:
  - One mouse click required to set onMobile to false when switching from touch to mouse click
  onMobile doesn't technically detect whether onMobile
  - You can teleport the cursor by opening the context menu
  - Touch events are triggered outside of the canvas, but not mouse events (intended behavior)
  - Releasing fingers in same order you pressed them causes cursor to teleport
  - Double tapping the canvas and holding on the second tap will cause the program to lose track of your cursor until you release
  - Before the canvas fully loads, a mobile user can zoom/pan as
  much as they want. Once the canvas loads, you cannot zoom back out
  and the only way to reset it is to clear your cache. One way to
  circumvent this is to load asynchronously so that the canvas
  is onscreen immediately.

IMPORTANT NOTE: all_cursors will not update while a dialogue window is open
So do not trigger dialogue windows while icursor.pressed is true
*/
//Make a global variable for all the default settings
//for this library
all_default_p5_improved_cursor_library_settings = {
  //Set this to true to log mouse/touch events and positions to the console
  log_icursor: false,
  
  disable_context_menu_in_canvas: true,
  
  //With mobile_friendly_canvas, the canvas will be centered on the document,
  //it will fill the screen (except for a margin),
  //and it will have an aspect ratio of your choosing.
  mobile_friendly_canvas: false,
  margin_in_pixels: 20,
  minimum_width_to_height_ratio: 1/3,
  maximum_width_to_height_ratio: 2/3,
  
  maximum_distance_for_click: window.innerWidth/10,
  
  //How fast should the scroll velocity decelerate?
  //(velocity is multiplied by this number once per frame)
  scroll_deceleration: 0.9,
  
  //What button must be pressed (Left, Right, Middle, Any, None) to count as scrolling?
  scroll_on_button: "left",
  
  disable_warnings: false,
  three_finger_console: false, //When true, triple tapping the screen will open a command dialogue window
}
_frameCount_at_last_updateScrollVelocity = 0;
_have_warned_about_updateScrollVelocity = false;
_time_of_last_touch_press_end = 0;
_max_fingers_before_released = 0; //Maximum number of fingers pressed before user releases fingers entirely

// WARN if setupImprovedCursor() has not been called in setup()
_missing_setupImprovedCursor_warning_interval = setInterval( ()=>{
  if(typeof frameCount !== "undefined" && frameCount > 0){
    if(typeof all_p5_improved_cursor_library_settings == "undefined"){
      console.warn("Warning: It appears you have not called setupImprovedCursor() in your setup() function. This is required for the p5_improved_cursor_library")
    }
    //While we're here, use this opportunity to make sure updateScrollVelocity()
    //is called every frame
    //We can add a call to this function in p5's draw() function
    var _old_p5_draw = draw
    draw = function() {
      _old_p5_draw();
      updateScrollVelocity();
      return "the p5_improved_cursor_library has overwritten draw()\nto include a necessary function called updateScrollVelocity()"
    }
    //Also while we're here, set the maximum_distance_for_click
    //setting if not already set.
    if( Number.isNaN(all_p5_improved_cursor_library_settings.maximum_distance_for_click) ){
      all_p5_improved_cursor_library_settings.maximum_distance_for_click = window.innerWidth/10;
    }
    clearInterval(_missing_setupImprovedCursor_warning_interval)
  }
}, 500)

_clear_cursors_if_frozen_interval = setInterval( ()=> {
  // This interval prevents a glitch where icursor will wrongly
  // think the cursor is pressed after a dialogue window.
  // 
  // If the page is frozen (i.e. if millis() isn't updating) it
  // likely means the user has a dialogue window open. Check every
  // 1/10th second that millis() is still updating, and if not,
  // assume all cursor buttons are no longer pressed.
  //
  //This does NOT prevent the glitch where all_cursors does not
  //update correctly after a dialogue window.
  if(typeof icursor !== "undefined"){
    var now = new Date()
    now = now.getTime()
    if( typeof _p_time_at_inactive_check !== "undefined" && now - _p_time_at_inactive_check > 200 ){
      all_cursors = [];
      icursor.pressed = false;
      if(icursor.leftPressed && typeof cursorPressEnd == "function")cursorPressEnd("left")
      if(icursor.middlePressed && typeof cursorPressEnd == "function")cursorPressEnd("middle")
      if(icursor.rightPressed && typeof cursorPressEnd == "function")cursorPressEnd("right")
      icursor.leftPressed = false;
      icursor.middlePressed = false;
      icursor.rightPressed = false;
    }
    _p_time_at_inactive_check = new Date();
    _p_time_at_inactive_check = _p_time_at_inactive_check.getTime();
  }
  //touchAction should only be none if mobile_friendly_canvas is enabled,
  //but we won't know if that's true until setup(), so for now,
  //disable it to prevent mobile users from scrolling/zooming
  if(typeof document.body !== "undefined" && document.body.style.touchAction !== "none"){
    document.body.style.touchAction = "none"
    var doc_meta = document.querySelector("meta")
    doc_meta.content = "user-scalable=no"
  }
}, 100)


// = = = = = = = = = CURSOR EVENTS ON MOBILE AND PC = = = = = = = = =

function _cursorPressStart(buttonPressed){
  //This is triggered every time a mouse button is pressed (left, right, or middle click)
  //or a finger is pressed (counts as a left click)
  //The buttonPressed argument stores which button ("left", "middle", "right") was pressed
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  icursor_at_press = {x:icursor.x, y:icursor.y}
  if(typeof cursorPressStart == "function")cursorPressStart(buttonPressed);
  else if(typeof cursorPressStart !== "undefined"){
    if(should_warn)console.warn("Warning: cursorPressStart should be a function. You have made it type " + typeof cursorPressStart)
  }
  
}
function _cursorPressEnd(buttonReleased){
  //This is triggered every time a mouse button is released (left, right, or middle click)
  //or a finger is lifted from the screen (counts as ending a left click)
  //The buttonReleased argument stores which button ("left", "middle", "right") was relesased
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  if(typeof cursorPressEnd == "function")cursorPressEnd(buttonReleased);
  else if(typeof cursorPressEnd !== "undefined"){
    if(should_warn)console.warn("Warning: cursorPressEnd should be a function. You have made it type " + typeof cursorPressEnd)
  }
  
  // if(frameCount - _frameCount_at_last_updateScrollVelocity > 2){
  //   if(should_warn)console.warn("Warning: It appears you have not called updateScrollVelocity() in your draw loop. The scroll_velocity variable will not be accurate. Disable this warning with the disable_warnings setting.")
  // }
  
  var dist_func = (x1, y1, x2, y2) => {
    var a = Math.abs(x1 - x2)
    var b = Math.abs(y1 - y2)
    return Math.sqrt(a*a + b*b)
  }
  if(dist_func(icursor_at_press.x, icursor_at_press.y, icursor.x, icursor.y) <= apicls.maximum_distance_for_click ){
    _cursorClick(buttonReleased);
  }
  
}
function _cursorClick(buttonClicked){
  // Triggered ONLY when a cursor press starts and ends in the
  // exact same spot
  var apicls = all_p5_improved_cursor_library_settings
  if(apicls.log_icursor)console.log("Cursor Click x" + icursor.x + " y" + icursor.y)
  if(typeof cursorClick == "function")cursorClick(buttonClicked);
  else if(typeof cursorClick !== "undefined"){
    if(should_warn)console.warn("Warning: cursorClick should be a function. You have made it type " + typeof cursorClick)
  }
}
function _cursorMove(){
  //Triggered every time a mouse cursor or finger moves.
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  if(typeof cursorMove == "function")cursorMove();
  else if(typeof cursorMove !== "undefined"){
    if(should_warn)console.warn("Warning: cursorMove should be a function. You have made it type " + typeof cursorMove)
  }
  
}

// = = = = = = = = = CURSOR EVENTS ON PC ONLY = = = = = = = = =

function _mousePressStart(e){
  //Triggered every time a mouse button is pressed (left, middle, right)
  //The buttonPressed argument stores which button ("left", "middle", "right") was pressed
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  
  
  if(!onMobile){
    if(apicls.log_icursor)console.log("Mouse down x" + round(icursor.x) + " y" + round(icursor.y) )
    // console.log(mousepos)
    icursor.pressed = true;
    if(e.button == 0){var buttonPressed = "left"; icursor.leftPressed = true}
    if(e.button == 1){var buttonPressed = "middle"; icursor.middlePressed = true}
    if(e.button == 2){var buttonPressed = "right"; icursor.rightPressed = true}
    
    _cursorPressStart(buttonPressed);
    
    if(typeof mousePressStart == "function")mousePressStart(buttonPressed);
    else if(typeof mousePressStart !== "undefined"){
      if(should_warn)console.warn("Warning: mousePressStart should be a function. You have made it type " + typeof mousePressStart)
    }
    
    scroll_velocity = {x:0, y:0}
    p_icursor = {...icursor}
  }
  
  if(onMobile && millis() - _time_of_last_touch_press_end > 200){
    //For some inexplicable reason, _mousePressStart is triggered
    //by a mobile user *releasing* their finger if the tap is short and the 
    //cursor doesn't move. When this happens, _touchPressEnd is triggered right
    //before _mousePressStart.
    //So we only know that a user is no longer on mobile if significant
    //time has passed since _touchPressEnd was last triggered.
    
    onMobile = false;
  }
  
}

function _mousePressEnd(e){
  //Triggered every time a mouse button is released (left, middle, right)
  //The buttonPressed argument stores which button ("left", "middle", "right") was released
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  if(!onMobile){
    
    let trigger_mousePressEnd = (buttonReleased) => {
      if(typeof mousePressEnd == "function")mousePressEnd(buttonReleased);
      else if(typeof mousePressEnd !== "undefined"){
        if(should_warn)console.warn("Warning: mousePressEnd should be a function. You have made it type " + typeof mousePressEnd)
      }
    }
    
    if(apicls.log_icursor)console.log("Mouse up x" + round(icursor.x) + " y" + round(icursor.y) )
    // console.log(mousepos)
    icursor.pressed = false;
    if(e.button == 0 && icursor.leftPressed){
      trigger_mousePressEnd("left")
      _cursorPressEnd("left");
      icursor.leftPressed = false
    }
    if(e.button == 1 && icursor.middlePressed){
      trigger_mousePressEnd("middle")
      _cursorPressEnd("middle");
      icursor.middlePressed = false
    }
    if(e.button == 2 && icursor.rightPressed){
      trigger_mousePressEnd("right")
      _cursorPressEnd("right");
      icursor.rightPressed = false
    }
    
  }
}

function _mouseMove(e){
  //Triggered every time a mouse cursor moves (but not a finger on a screen)
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  if(!onMobile){
    _getMousePosFromEvent(e);
    _cursorMove();
    
    if(typeof mouseMove == "function")mouseMove();
    else if(typeof mouseMove !== "undefined"){
      if(should_warn)console.warn("Warning: mouseMove should be a function. You have made it type " + typeof mouseMove)
    }
  }
}


// = = = = = = = = = CURSOR EVENTS ON MOBILE ONLY = = = = = = = = =

function _touchPressStart(e){
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  _max_fingers_before_released ++;
  
  //Triggered every time a finger is pressed to the screen (counts as left click)
  //This is how we detect if the user is on a mobile device or not.
  onMobile = true;
  if(apicls.log_icursor)console.log("Touch start x" + round(icursor.x) + " y" + round(icursor.y) )
  _getMousePosFromEvent(e);
  icursor.pressed = true;
  
  var buttonPressed = "left";
  icursor.leftPressed = true
  
  _cursorPressStart(buttonPressed);
  
  if(typeof touchPressStart == "function")touchPressStart(buttonPressed);
  else if(typeof touchPressStart !== "undefined"){
    if(should_warn)console.warn("Warning: touchPressStart should be a function. You have made it type " + typeof touchPressStart)
  }
  
  scroll_velocity = {x:0, y:0}
  p_icursor = {...icursor}
}

function _touchPressEnd(e){
  //Triggered every time a finger is released from the screen (counts as left mouse-button release)
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  _getMousePosFromEvent(e);
  
  if( apicls.three_finger_console && _max_fingers_before_released >= 3  && all_cursors.length == 0 ){
    var output = '';
    var user_command = 'temporary'
    while(user_command !== null && user_command.length > 0){
      user_command = prompt(output + "\nEnter command:")
      output = eval(user_command);
    }
  }
  
  
  if(all_cursors.length == 0){
    if(apicls.log_icursor)console.log("Touch end x" + round(icursor.x) + " y" + round(icursor.y) )
    icursor.pressed = false;
    
    var buttonReleased = "left";
    icursor.leftPressed = false
    
    _cursorPressEnd(buttonReleased);
    
    if(typeof touchPressEnd == "function")touchPressEnd(buttonReleased);
    else if(typeof touchPressEnd !== "undefined"){
      if(should_warn)console.warn("Warning: touchPressEnd should be a function. You have made it type " + typeof touchPressEnd)
    }
    
    _time_of_last_touch_press_end = millis();
    _max_fingers_before_released = 0;
  }
  
}

function _touchMove(e){
  //Triggered every time a finger is dragged on the screen
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  _getMousePosFromEvent(e);
  _cursorMove();
  
  if(typeof touchMove == "function")touchMove();
  else if(typeof touchMove !== "undefined"){
    if(should_warn)console.warn("Warning: touchMove should be a function. You have made it type " + typeof touchMove)
  }
}

// = = = = = = = = = MISCELLANEOUS FUNCTIONS = = = = = = = = =

function _setupCanvas(){
  var apicls = all_p5_improved_cursor_library_settings
  
  //This function is called on startup and every time the window
  //is resized.
  
  // By default, the width-to-height ratio of the canvas
  // is 2/3 (similar to the widest of mobile devices).
  // It will never appear wider than this, even on PC.
  let h = windowHeight - (apicls.margin_in_pixels * 2);
  let w = windowWidth - (apicls.margin_in_pixels * 2);
  if(w/h <= apicls.minimum_width_to_height_ratio)h = w * 1/(apicls.minimum_width_to_height_ratio);
  if(w/h >= apicls.maximum_width_to_height_ratio)w = h * apicls.maximum_width_to_height_ratio;
  resizeCanvas(round(w),round(h))
}

function setupImprovedCursor(settings_object){
  //This function is called on startup and creates the event listeners
  //that this library provides.
  
  all_p5_improved_cursor_library_settings = {...all_default_p5_improved_cursor_library_settings}
  if(settings_object)changeImprovedCursorSettings(settings_object);
  var apicls = all_p5_improved_cursor_library_settings
  
  if(apicls.mobile_friendly_canvas){
    pixelDensity(1);
    _setupCanvas();
    window.addEventListener("resize", _setupCanvas)
    canvas.onselectstart = function () { return false }
    
    canvas_is_offcenter = () => {
      var c = canvas.getBoundingClientRect()
      var ret = 
      c.x <= 0 ||
      c.y <= 0 ||
      c.x + c.width >= window.innerWidth ||
      c.y + c.height >= window.innerHeight
      return (ret && !canvas.hidden);
    }
    
    _user_tapped_ok_to_callibrate = false;
    
    check_for_offcenter_canvas = setInterval( ()=> {
      
      if(canvas_is_offcenter() && !_user_tapped_ok_to_callibrate){
        //Opening a dialogue window sometimes fixes the off center
        //canvas.
        var proceed = confirm("Tap OK to callibrate your screen.")
        _user_tapped_ok_to_callibrate = true;
        setTimeout( ()=> {
          //If the dialogue window did not fix the off center canvas,
          //Refreshing the page likely will, so do that.
          if(canvas_is_offcenter())window.location.reload();
        }, 500)
      }
    }, 500)
  }
  
  canvas.addEventListener("mousedown", _mousePressStart)
  canvas.addEventListener("mouseup", _mousePressEnd)
  window.addEventListener("mousemove", _mouseMove)
  canvas.addEventListener("touchstart", _touchPressStart)
  canvas.addEventListener("touchend", _touchPressEnd)
  window.addEventListener("touchmove", _touchMove)
  
  if(apicls.three_finger_console){
    
    handleError = function(evt) {
      if(onMobile){
        if (evt.message) { // Chrome sometimes provides this
          if( evt.filename.endsWith("js") || evt.filename == '' )
          alert("error: "+evt.message +" at linenumber: "+evt.lineno+" of file: "+evt.filename);
        } else {
          alert("error: "+evt.type+" from element: "+(evt.srcElement || evt.target));
        }
      }
    }
    
    window.addEventListener("error", handleError, true);
  }
  
  let trigger_mousePressEnd = (buttonReleased) => {
    if(typeof mousePressEnd == "function")mousePressEnd(buttonReleased);
    else if(typeof mousePressEnd !== "undefined"){
      if(should_warn)console.warn("Warning: mousePressEnd should be a function. You have made it type " + typeof mousePressEnd)
    }
  }
  let trigger_touchPressEnd = (buttonReleased) => {
    if(typeof touchPressEnd == "function")touchPressEnd(buttonReleased);
    else if(typeof touchPressEnd !== "undefined"){
      if(should_warn)console.warn("Warning: touchPressEnd should be a function. You have made it type " + typeof touchPressEnd)
    }
  }
  
  canvas.onmouseout = () => {
    if(apicls.log_icursor)console.log("Cursor has left the canvas.")
    if(icursor.pressed){
      if(apicls.log_icursor)console.log("All button presses have been ended.")
      icursor.pressed = false;
      if(icursor.leftPressed){
        _cursorPressEnd("left");
        if(!onMobile)trigger_mousePressEnd("left");
        if(onMobile)trigger_touchPressEnd("left");
        icursor.leftPressed = false;
      }
      if(icursor.middlePressed){
        _cursorPressEnd("middle");
        if(!onMobile)trigger_mousePressEnd("middle");
        if(onMobile)trigger_touchPressEnd("middle");
        icursor.middlePressed = false;
      }
      if(icursor.rightPressed){
        _cursorPressEnd("right");
        if(!onMobile)trigger_mousePressEnd("right");
        if(onMobile)trigger_touchPressEnd("right");
        icursor.rightPressed = false;
      }
    }
  }
  
  if(apicls.disable_context_menu_in_canvas)
  canvas.addEventListener("contextmenu", event => event.preventDefault() )
  
  if(apicls.mobile_friendly_canvas){
    document.body.setAttribute('style', `
    touch-action: none;
    margin: 0px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    `)
    document.documentElement.style.height = "100%";
    canvas.setAttribute('style', `vertical-align: top;`)
  } else {
    document.body.style.touchAction = "auto"
    var doc_meta = document.querySelector("meta")
    doc_meta.content = "user-scalable=yes"
  }
  
  //When a touch event is detected, onMobile is permanently set to true.
  onMobile = false;
  
  //Use improved_cursor.x and improved_cursor.y instead of mouseX and mouseY
  //or use the abbreviated icursor.x and icursor.y
  improved_cursor = {
    x:null,
    y:null,
    pressed:false,
    leftPressed: false,
    rightPressed: false,
    middlePressed: false
  }
  icursor = improved_cursor;
  p_icursor = {...icursor}
  
  improved_cursor_at_press = {x:null, y:null}
  icursor_at_press = improved_cursor_at_press;
  
  scroll_velocity = {x: 0, y:0}
  
  //When a mobile user presses one or more fingers on screen, each finger position
  //will be pushed to all_cursors and removed when the finger is lifted
  all_cursors = [];
  
}

function _getMousePosFromEvent(e){
  var canvasBounding = canvas.getBoundingClientRect();
  icursor.x = e.clientX - canvasBounding.x;
  icursor.y = e.clientY - canvasBounding.y;
  if(e.touches){ //This is a touch event, not a mouse event
    if(e.touches.length > 0){ //This is a touch start event.
      icursor.x = e.touches[0].clientX - canvasBounding.x;
      icursor.y = e.touches[0].clientY - canvasBounding.y;
    } else { //This is a touch end event
      icursor.x = e.changedTouches[0].clientX - canvasBounding.x;
      icursor.y = e.changedTouches[0].clientY - canvasBounding.y;
    }
  }
  _update_all_cursors(e);
}

function _update_all_cursors(e){
  var canvasBounding = canvas.getBoundingClientRect();
  
  if(!onMobile){
    all_cursors = [ icursor ]
  }
  if(onMobile){
    all_cursors = [];
    for(var i = 0; i < e.touches.length; i ++){
      all_cursors.push( {
        x: e.touches[i].clientX - canvasBounding.x,
        y: e.touches[i].clientY - canvasBounding.y,
        pressed: true
      } )
    }
  }
}

function updateScrollVelocity(){
  //This function should be called in draw()
  //if you plan to use scroll_velocity in your sketch.
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  
  scroll_velocity.x *= apicls.scroll_deceleration;
  scroll_velocity.y *= apicls.scroll_deceleration;
  if( abs(scroll_velocity.x) < 0.01) scroll_velocity.x = 0;
  if( abs(scroll_velocity.y) < 0.01) scroll_velocity.y = 0;
  
  if( (apicls.scroll_on_button == "left" && icursor.leftPressed) ||
      (apicls.scroll_on_button == "right" && icursor.rightPressed) ||
      (apicls.scroll_on_button == "middle" && icursor.middlePressed) || 
      (apicls.scroll_on_button == "any" && icursor.pressed) ||
      (apicls.scroll_on_button == "none")){
        
        scroll_velocity = {
          x: icursor.x - p_icursor.x,
          y: icursor.y - p_icursor.y,
        }
      
  }
  
  p_icursor = {...icursor}
  // if(frameCount - _frameCount_at_last_updateScrollVelocity > 1 && !_have_warned_about_updateScrollVelocity){
  //   if(should_warn)console.warn("Warning: It appears you have called updateScrollVelocity() somewhere other than your draw loop, where it is supposed to be called. Disable this warning with the disable_warnings setting.")
  //   _have_warned_about_updateScrollVelocity = true
  // }
  
  _frameCount_at_last_updateScrollVelocity = frameCount;
}

function changeImprovedCursorSettings(new_settings){
  //Replace the current settings with any new
  //ones given.
  var apicls = all_p5_improved_cursor_library_settings
  var should_warn = !apicls.disable_warnings;
  
  if(typeof new_settings == "object"){
    //Replace all current settings with the ones that have
    //been given to us
    var apicls = all_p5_improved_cursor_library_settings
    var dpicls = all_default_p5_improved_cursor_library_settings
    
    var k = Object.keys(new_settings)
    for(var i = 0; i < k.length; i ++ ){
      //Make sure the setting given to us is of the right type
      if(typeof new_settings[ k[i] ] == typeof dpicls[ k[i] ] ){
        //Setting is of the right type
        apicls[ k[i] ] = new_settings[ k[i] ]
      } else {
        if(typeof dpicls[ k[i] ] == "undefined"){
          if(should_warn)console.warn("Warning: " + k[i] + " is not an icursor setting")
        } else {
          console.error("Error: icursor setting " + k[i] + " must be of type " + typeof dpicls[ k[i] ])
        }
      }
      if( (k[i] == "scroll_deceleration") && !(new_settings[ k[i] ] >= 0 && new_settings[ k[i] ] <= 1 ) ){
        if(should_warn)console.warn("Warning: icursor setting " + k[i] + " should be a value between 0 and 1. You have set it to " + new_settings[ k[i] ])
      }
      if( k[i] == "scroll_on_button" && !(["left", "middle", "right", "none", "any"].includes(new_settings[ k[i] ]) ) ){
        if(should_warn)console.warn("Warning: icursor setting scroll_on_button must be a string 'left', 'middle', 'right', 'none', or 'any'. You have set it to '" + new_settings[ k[i] ] + "'. It is now defaulted to 'left'")
        apicls.scroll_on_button = "left"
      }
    }
  } else if(should_warn){
    if(typeof new_settings == "undefined")console.warn("Warning: You have not passed any settings to changeImprovedCursorSettings()")
    else console.warn("Warning: an object must be passed into changeImprovedCursorSettings. You have passed a(n) " + typeof new_settings)
  }
}

function drawImprovedCursorOverlay(){
  //Call this function at the END of the draw() loop
  if(typeof _scroll_item_for_improved_cursor_overlay == "undefined"){
    _scroll_item_for_improved_cursor_overlay = {x: width/2, y: height/2}
  }
  var _scroll_item = _scroll_item_for_improved_cursor_overlay
  push();
  background(0, 100);
  fill(255);
  
  
  let icursor_text = "icursor = {\n"
  let k = Object.keys(icursor);
  for(var i = 0; i < k.length; i ++){
    icursor_text += "  " + k[i] + ": " + icursor[ k[i] ] + "\n"
  }
  icursor_text += "}\n"
  let svx = round(scroll_velocity.x * 100)/100
  let svy = round(scroll_velocity.y * 100)/100
  icursor_text += "scroll_velocity = {\n  x:" + svx + "\n  y:" + svy + "\n}\n"
  icursor_text += "onMobile = " + onMobile
  textSize( (20/600) * width )
  text(icursor_text, 60 * (width/600), 60 * (width/600) )
  
  var cursor_colors = [
    color("white"),
    color("red"),
    color("orange"),
    color("yellow"),
    color("green"),
    color("blue"),
    color("purple")
  ]
  strokeWeight(5);
  let d = width * (2/5)
  for(var i = 0; i < all_cursors.length; i ++){
    noStroke();
    fill( cursor_colors[i % cursor_colors.length] )
    ellipse(all_cursors[i].x, all_cursors[i].y, d)
    stroke(0); 
    line(all_cursors[i].x - (d/4), all_cursors[i].y, all_cursors[i].x + (d/4), all_cursors[i].y )
    line(all_cursors[i].x, all_cursors[i].y - (d/4), all_cursors[i].x, all_cursors[i].y + (d/4) )
  }
  
  fill(255,255,0); noStroke();
  rect(_scroll_item.x, _scroll_item.y, width/20, width/20)
  
  _scroll_item.x += scroll_velocity.x
  _scroll_item.y += scroll_velocity.y
  if(_scroll_item.x < 0)_scroll_item.x = width;
  if(_scroll_item.x > width)_scroll_item.x = 0;
  if(_scroll_item.y < 0)_scroll_item.y = height;
  if(_scroll_item.y > height)_scroll_item.y = 0;
  pop();
}
