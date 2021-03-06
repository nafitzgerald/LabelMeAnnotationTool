// my_scripts.js
// Modified: 03/05/2007
// This file contains global variables and functions.  This file
// should be minimized and abstracted whenever possible.  It is 
// best to refrain from adding new variables/functions to this
// file.

var wait_for_input;
var edit_popup_open = 0;
var num_orig_anno;
var anno_count = 0;
var global_count = 0;
var req_submit;
var submission_edited = 0; // If polygon has been edited.

// Allowable user actions:
var action_CreatePolygon = 1;
var action_RenameExistingObjects = 0;
var action_ModifyControlExistingObjects = 0;
var action_DeleteExistingObjects = 0;

// Which polygons are visible:
var view_Existing = 1;
var view_Deleted = 0;

// Flag for right-hand object list:
var view_ObjList = true;

// MT variables:
// var LMbaseurl = 'http://old-labelme.csail.mit.edu/developers/brussell/LabelMe-video/tool.html';
// var MThelpPage = 'http://old-labelme.csail.mit.edu/developers/brussell/LabelMe-video/mt_instructions.html';
// var LMbaseurl = 'http://labelme.csail.mit.edu/tool.html';
var LMbaseurl = 'http://' + window.location.host + window.location.pathname;
// var MThelpPage = 'http://labelme.csail.mit.edu/mt_instructions.html';
var MThelpPage = 'annotationTools/html/mt_instructions.html';
var externalSubmitURL = 'http://mturk.com/mturk/externalSubmit';
var externalSubmitURLsandbox = 'http://workersandbox.mturk.com/mturk/externalSubmit';
var mt_N = 'inf';

var object_choices = '...';


// Main entry point for the annotation tool.
function MainInit() {
    main_handler = new handler();
    main_canvas = new canvas('myCanvas_bg');
    main_select_canvas = new canvas('select_canvas');
    main_draw_canvas = new canvas('draw_canvas');
    main_query_canvas = new canvas('query_canvas');
    main_image = new image('im');

    function main_image_onload_helper() {
        main_image.SetImageDimensions();
        var anno_file = main_image.GetFileInfo().GetFullName();
        anno_file = 'Annotations/' + anno_file.substr(0,anno_file.length-4) + '.xml' + '?' + Math.random();
        ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);
    };
    
    main_image.GetNewImage(main_image_onload_helper);
    
    var dirname = main_image.GetFileInfo().GetDirName();
    var imname = main_image.GetFileInfo().GetImName();

    if(document.getElementById('img_url')) {
      imPath = main_image.GetFileInfo().GetImagePath();
        document.getElementById('img_url').onclick = function() {location.href=imPath};
    }

    
  // if(document.getElementById('username_main_div')) write_username();

  WriteLogMsg('*done_loading_' + main_image.GetFileInfo().GetImagePath());
}

// Get the x position of the mouse event.
function GetEventPosX(event) {
  if(IsNetscape()) return event.layerX;
  return event.offsetX;
}

// Get the y position of the mouse event.
function GetEventPosY(event) {
  if(IsNetscape()) return event.layerY;
  return event.offsetY;
}

// If IE, then makes the HTML to show the 'next' icon with the appropriate 
// transparencies; if firefox, then just make an img src to show the image
function ShowUndoImg() {
  var oo = document.createElementNS(xhtmlNS,'img');
  oo.setAttributeNS(null,"id","undo_image_png");
  oo.setAttributeNS(null,"src","Icons/undo.png");
  oo.setAttributeNS(null,"style","cursor:hand; width:3em;");
  document.getElementById('png_undo').appendChild(oo);
}

function RemoveSpecialChars(str) {
  var re = /\$|@|#|~|`|\%|\*|\^|\&|\+|\=|\[|\]|\}|\{|\;|\:|\'|\"|\<|\>|\?|\||\\|\!|\$/g;
  return str.replace(re,"_");
}

function WaitForInput() {
  alert("Need to enter object name.");
}

// Return true if the username is "anonymous".
function IsUserAnonymous() {
  return (username=='anonymous');
}

function IsUserAdmin() {
  var is_admin = false;
  var folder = main_image.GetFileInfo().GetDirName();
  var idx = folder.indexOf('/');
  if((idx != -1) && (folder.substring(0,idx)=='users')) {
    folder = folder.substring(idx+1,folder.length);
    idx = folder.indexOf('/');
    if((idx != -1) && (folder.substring(0,idx)==username)) is_admin = true;
  }
  return (username=='admin') | (username=='mtsupervisor') | is_admin | ((username.indexOf('submitted')!=-1)&(username==folder));
}

function IsCreator(u) {
  return (username==u);
}


function WriteLogMsg(msg) {
  var url = 'annotationTools/perl/write_logfile.cgi';
  var req_submit;
  // branch for native XMLHttpRequest object
  if (window.XMLHttpRequest) {
    req_submit = new XMLHttpRequest();
    req_submit.open("POST", url, true);
    req_submit.send(msg);
  } 
  else if (window.ActiveXObject) {
    req_submit = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_submit) {
      req_submit.open("POST", url, true);
      req_submit.send(msg);
    }
  }
}

function loadXMLDoc() {
  if(wait_for_input) return WaitForInput();
  if(main_draw_canvas.Peek()) {
    alert("Need to close current polygon first.");
    return;
  }

  // Get a new image:
  var p = document.getElementById('main_image');
  p.parentNode.removeChild(p);

  RemoveAnnotationList();

  main_image.GetNewImage();
}

function ShowNextImage() {
  var s = document.getElementById("submitform");
  if(s!=null) s.submit();
}

// Insert HTML code after a div element:
function InsertAfterDiv(html_str,tag_id) {
  if((typeof Range !== "undefined") && !Range.prototype.createContextualFragment) {
    Range.prototype.createContextualFragment = function(html) {
      var frag = document.createDocumentFragment(), 
      div = document.createElement("div");
      frag.appendChild(div);
      div.outerHTML = html;
      return frag;
    };
  }

  var elt = document.getElementById(tag_id);
  var x = document.createRange();
  try {
    x.setStartAfter(elt);
  }
  catch(err) {
    alert(tag_id);
  }
  x = x.createContextualFragment(html_str);
  elt.appendChild(x);
}

function ChangeLinkColorBG(idx) {
  if(document.getElementById('Link'+idx)) {
    var isDeleted = AllAnnotations[idx].GetDeleted();
    if(isDeleted) document.getElementById('Link'+idx).style.color = '#888888';
    else document.getElementById('Link'+idx).style.color = '#0000FF';
  }
}

function ChangeLinkColorFG(idx) {
  document.getElementById('Link'+idx).style.color = '#FF0000';
}


function UpdateCounterHTML() {
    return;
  //var m = main_image.GetFileInfo().GetMode();
  //if((m=='im') || (m=='mt')) return;
  //document.getElementById('anno_count').innerHTML = anno_count;
}

function LoadCounterText() {
  var cookie_counter = getCookie('counter');
  if(cookie_counter > anno_count) anno_count = cookie_counter;

  var objXml = XMLGet('annotationCache/counter');

  if(objXml.status==200) {
    var tmp_count = parseInt(objXml.responseText);
    if(tmp_count > anno_count) {
      anno_count = tmp_count;
      setCookie('counter',anno_count);
    }
    UpdateCounterHTML();
  }
  else if(objXml.status==404) {
    alert('counter file not found');
  }
  else {
    alert('Unknown objXml.status');
  }
}

function XMLGet(fname) {
  var url = 'annotationTools/perl/get_anno_file.cgi';
  // branch for native XMLHttpRequest object
  if (window.XMLHttpRequest) {
    req_anno = new XMLHttpRequest();
    req_anno.open("POST", url, false);
    req_anno.send(fname);
  } 
  else if (window.ActiveXObject) {
    req_anno = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_anno) {
      req_anno.open("POST", url, false);
      req_anno.send(fname);
    }
  }
  return req_anno;
}

function LoadAnnotationSuccess(xml) {
  // Set global variable:
  LM_xml = xml;

  var obj_elts = LM_xml.getElementsByTagName("object");
  var num_obj = obj_elts.length;
  
  AllAnnotations = Array(num_obj);
  num_orig_anno = num_obj;

  // Initialize any empty tags in the XML file:
  for(var pp = 0; pp < num_obj; pp++) {
    var curr_obj = $(LM_xml).children("annotation").children("object").eq(pp);

    // Initialize object name if empty in the XML file:
    if(curr_obj.children("name").length == 0) {
      curr_obj.append($("<name></name>"));
    }

    // Set object IDs:
    if(curr_obj.children("id").length > 0) {
      curr_obj.children("id").text(""+pp);
    }
    else {
      curr_obj.append($("<id>" + pp + "</id>"));
    }

    // Initialize username if empty in the XML file:
    if(curr_obj.children("polygon").children("username").length == 0) {
      curr_obj.children("polygon").append($("<username>anonymous</username>"));
    }
  }
    
  // Add part fields (this calls a funcion inside object_parts.js)
  addPartFields(); // makes sure all the annotations have all the fields.
    

  // loop over annotated objects
  for(var pp = 0; pp < num_obj; pp++) {
    AllAnnotations[pp] = new annotation(pp);
    
    // insert polygon
    var pt_elts = obj_elts[pp].getElementsByTagName("polygon")[0].getElementsByTagName("pt");
    var numpts = pt_elts.length;
    AllAnnotations[pp].CreatePtsX(numpts);
    AllAnnotations[pp].CreatePtsY(numpts);
    for(ii=0; ii < numpts; ii++) {
      AllAnnotations[pp].GetPtsX()[ii] = parseInt(pt_elts[ii].getElementsByTagName("x")[0].firstChild.nodeValue);
      AllAnnotations[pp].GetPtsY()[ii] = parseInt(pt_elts[ii].getElementsByTagName("y")[0].firstChild.nodeValue);
    }
  }

  // Add annotations to the main_canvas:
  for(var pp=0; pp < AllAnnotations.length; pp++) {
    var isDeleted = AllAnnotations[pp].GetDeleted();
    if(((pp<num_orig_anno)&&((view_Existing&&!isDeleted)||(isDeleted&&view_Deleted))) || (pp>=num_orig_anno)) {
      main_canvas.AttachAnnotation(AllAnnotations[pp],'polygon');
    }
  }

  // Render the polygons on the main_canvas:
  main_canvas.RenderAnnotations();

  if(view_ObjList) LoadAnnotationList();
}

// Annotation file does not exist, so load template:
function LoadAnnotation404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404) 
    ReadXML(main_image.GetFileInfo().GetTemplatePath(),LoadTemplateSuccess,LoadTemplate404);
  else
    alert(jqXHR.status);
}

// Annotation template does not exist for this folder, so load default 
// LabelMe template:
function LoadTemplate404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404)
    ReadXML('annotationCache/XMLTemplates/labelme.xml',LoadTemplateSuccess,function(jqXHR) {
	alert(jqXHR.status);
      });
  else
    alert(jqXHR.status);
}

// Actions after template load success:
function LoadTemplateSuccess(xml) {
  LM_xml = xml;
  LM_xml.getElementsByTagName("filename")[0].firstChild.nodeValue = '\n'+main_image.GetFileInfo().GetImName()+'\n';
  LM_xml.getElementsByTagName("folder")[0].firstChild.nodeValue = '\n'+main_image.GetFileInfo().GetDirName()+'\n';
  num_orig_anno = 0;
  if(view_ObjList) LoadAnnotationList();
}


function InsertServerLogData(modifiedControlPoints) {
  var old_pri = LM_xml.getElementsByTagName("private");
  for(ii=0;ii<old_pri.length;ii++) {
    old_pri[ii].parentNode.removeChild(old_pri[ii]);
  }
  
  // Add information to go into the log:
  var elt_pri = LM_xml.createElement("private");
  var elt_gct = LM_xml.createElement("global_count");
  var elt_user = LM_xml.createElement("pri_username");
  var elt_edt = LM_xml.createElement("edited");
  var elt_onm = LM_xml.createElement("old_name");
  var elt_nnm = LM_xml.createElement("new_name");
  var elt_mcp = LM_xml.createElement("modified_cpts");
  
  var txt_gct = LM_xml.createTextNode(global_count);
  var txt_user = LM_xml.createTextNode(username);
  var txt_edt = LM_xml.createTextNode(submission_edited);
  var txt_onm = LM_xml.createTextNode(old_name);
  var txt_nnm = LM_xml.createTextNode(new_name);
  var txt_mcp = LM_xml.createTextNode(modifiedControlPoints);
  var txt_pri = LM_xml.createTextNode(ref);
  
  LM_xml.documentElement.appendChild(elt_pri);
  elt_pri.appendChild(elt_gct);
  elt_pri.appendChild(elt_user);
  elt_pri.appendChild(elt_edt);
  elt_pri.appendChild(elt_onm);
  elt_pri.appendChild(elt_nnm);
  elt_pri.appendChild(elt_mcp);
  elt_pri.appendChild(txt_pri);
  
  elt_gct.appendChild(txt_gct);
  elt_user.appendChild(txt_user);
  elt_edt.appendChild(txt_edt);
  elt_onm.appendChild(txt_onm);
  elt_nnm.appendChild(txt_nnm);
  elt_mcp.appendChild(txt_mcp);
}

function PermissionError() {
  var m = main_image.GetFileInfo().GetMode();
  if((m=='im') || (m=='mt')) {
    alert('This polygon was entered by another user.  You can only modify polygons that you have entered.');
  }
  else {
    alert('This polygon was entered by another user.  You can only modify polygons that you have entered.  Do not forget to sign in if you want to be able to edit your annotations');
  }
}

function GetTimeStamp() {
  var url = 'annotationTools/perl/get_timestamp.cgi';
  // branch for native XMLHttpRequest object
  if (window.XMLHttpRequest) {
    req_anno = new XMLHttpRequest();
    req_anno.open("POST", url, false);
    req_anno.send();
  } 
  else if (window.ActiveXObject) {
    req_anno = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_anno) {
      req_anno.open("POST", url, false);
      req_anno.send();
    }
  }

  if(req_anno.status==200) return req_anno.responseText;
  return '';
}


// Set object list choices for points and lines:
function SetObjectChoicesPointLine(anno) {
  // If point has been labeled, then make autocomplete have "point"
  // be option:
  var isPoint = 0;
  if((anno.GetPtsX().length==1) && (object_choices=='...')) {
    object_choices = 'point';
    object_choices = object_choices.split(/,/);
    isPoint = 1;
  }
  
  // If line has been labeled, then make autocomplete have "line"
  // and "horizon line" be options:
  var isLine = 0;
  if((anno.GetPtsX().length==2) && (object_choices=='...')) {
    object_choices = 'line,horizon line';
    object_choices = object_choices.split(/,/);
    isLine = 1;
  }
  
  return (isPoint || isLine);
}

// Returns true if the point (x,y) is close to polygon p.
function IsNearPolygon(x,y,p) {
  var sx = x / main_image.GetImRatio();
  var sy = y / main_image.GetImRatio();
  
  var pt = AllAnnotations[p].ClosestPoint(sx,sy);
  var minDist = pt[2];
  
  // This is the sensitivity area around the outline of the polygon.
  // Also, when you move the mouse over the sensitivity area, the area 
  // gets bigger so you won't move off of it on accident.
  var buffer = 5;
  if(selected_poly != -1) buffer = 13;
  
  // Note: need to multiply by im_ratio so that the sensitivity area 
  // is not huge when you're zoomed in. 
  return ((minDist*main_image.GetImRatio()) < buffer);
}
    
// Render filled polygons for selected objects:
function selectObject(idx) {
  if(selected_poly==idx) return;
  unselectObjects();
  selected_poly = idx;
  if(view_ObjList) ChangeLinkColorFG(idx);
  AllAnnotations[selected_poly].FillPolygon();
  
  // Select object parts:
  var selected_poly_parts = getPartChildrens(idx);
  for (var i=0; i<selected_poly_parts.length; i++) {
    AllAnnotations[selected_poly_parts[i]].FillPolygon();
  }
}

// Stop fill polygon rendering for selected objects:
function unselectObjects() {
  if(selected_poly == -1) return;
  if(view_ObjList) ChangeLinkColorBG(selected_poly);
  AllAnnotations[selected_poly].UnfillPolygon();
  
  // Unselect object parts:
  var selected_poly_parts = getPartChildrens(selected_poly);
  for (var i=0; i<selected_poly_parts.length; i++) {
    AllAnnotations[selected_poly_parts[i]].UnfillPolygon();
  }
  
  // Reset selected_poly variable:
  selected_poly = -1;
}

// Deletes the currently selected polygon from the canvas.
function DeleteSelectedPolygon() {
  if(selected_poly == -1) return;
  
  if((IsUserAnonymous() || (!IsCreator(AllAnnotations[selected_poly].GetUsername()))) && (!IsUserAdmin()) && (selected_poly<num_orig_anno) && !action_DeleteExistingObjects) {
    alert('You do not have permission to delete this polygon');
    return;
  }
  
  if(AllAnnotations[selected_poly].GetVerified()) {
    main_handler.RestToSelected(selected_poly,null);
    return;
  }
  
  if(selected_poly>=num_orig_anno) {
    anno_count--;
    setCookie('counter',anno_count);
    UpdateCounterHTML();
  }
  
  submission_edited = 0;
  old_name = AllAnnotations[selected_poly].GetObjName();
  new_name = AllAnnotations[selected_poly].GetObjName();
  
  // Write to logfile:
  WriteLogMsg('*Deleting_object');
  InsertServerLogData('cpts_not_modified');
  
  // Set <deleted> in LM_xml:
  $(LM_xml).children("annotation").children("object").eq(selected_poly).children("deleted").text('1');
  
  // Write XML to server:
  WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
  
  //     SubmitAnnotations(0);
  
  // Need to keep track of the selected polygon since it gets reset
  // in the next step:
  var ndx = selected_poly;
  
  // Unselect the object:
  unselectObjects();
  if(view_ObjList) {
    RemoveAnnotationList();
    LoadAnnotationList();
  }
  
  // Delete the polygon from the canvas:
  AllAnnotations[ndx].DeletePolygon();
}


// UTILITIES    
function CheckXMLExists() {
  if(req_submit.readyState==4) {
    if(req_submit.status != 200) {
      alert("The XML annotation file does not exist yet.  Please label an object and try again");
    }
    else {
      window.open(main_image.GetFileInfo().GetAnnotationPath());
    }
  }
}

function GetXMLFile() {
  var xml_url = main_image.GetFileInfo().GetAnnotationPath();

  // Check if VRML file exists:
  if (window.XMLHttpRequest) {
    req_submit = new XMLHttpRequest();
    req_submit.onreadystatechange = CheckXMLExists;
    req_submit.open("GET", xml_url, true);
    req_submit.send('');
  } 
  else if (window.ActiveXObject) {
    req_submit = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_submit) {
      req_submit.onreadystatechange = CheckXMLExists;
      req_submit.open("GET", xml_url, true);
      req_submit.send('');
    }
  }
}

