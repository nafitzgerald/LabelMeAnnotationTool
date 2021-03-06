// THIS CODE TAKES CARE OF THE BUBBLE THAT APPEARS ON THE ANNOTATION TOOL
// WHEN EDITING OBJECT PROPERTIES

// THINGS THAT WILL BE GOOD TO SIMPLIFY:
//  1- why are there two functions -almost-identical- to close the bubble?
//  2- why is different the way the data is submitted in edit and query? I think with LM_xml data handling this will be simplified.
//  3- I want functions
//        LM_xml.store(obj_index, fieldname, value)
//        LM_xml.getvalue(obj_index, fieldname)
//        LM_xml.sendtoserver
//

// Rewritten: Antonio: 07/01/2013


// *******************************************
// Public methods:
// *******************************************

function mkPopup(left,top) {
    wait_for_input = 1;
    mkBubbleHTML(left,top,'query');
}

function mkEditPopup(left,top,anno) {
    edit_popup_open = 1;
    mkBubbleHTML(left,top,'edit',anno);
}

function mkVerifiedPopup(left,top) {
    edit_popup_open = 1;
    mkBubbleHTML(left,top,'verified');
}

function CloseQueryPopup() {
    wait_for_input = 0;
    var p = document.getElementById('myPopup');
    p.parentNode.removeChild(p);
}

function CloseEditPopup() {
    edit_popup_open = 0;
    var p = document.getElementById('myPopup');
    if(p) p.parentNode.removeChild(p);
}

// *******************************************
// Private methods:
// *******************************************

function mkBubbleHTML(left,top,bubble_type,anno) {
    var html_str;

    // Adjust location to account for the displacement of the arrow:
    left = left - 22;
    if (left<5){left=5;}
    
    // Select the vertical position of the bubble decoration arrow
    if (top>214){
        html_str  = '<div class= "bubble" id="myPopup" style="position:absolute;z-index:5; left:'+left+'px; top:'+top+'px;">';
    }else{
        html_str  = '<div class= "bubble top" id="myPopup" style="position:absolute;z-index:5; left:'+left+'px; top:'+top+'px;">';
    }
    
    // Select the type of bubble (adding new object, editing existing object, ...) 
    switch(bubble_type) {
        case 'query':
            html_str += GetPopupForm("");
            break;
        case 'edit':
            html_str += GetCloseImg() + GetPopupForm(anno);
            break;
        case 'verified':
            html_str += GetCloseImg() + GetVerifiedPopupForm();
            break;
        default:
            alert('Invalid bubble_type');
    }
    html_str += '</div>';

    // Insert bubble in page created HTML
    InsertAfterDiv(html_str,'main_section');
    
    // Place bubble in the right location taking into account the rendered size and the location of the arrow
    if (top>214){  
        h = $("#myPopup").height();
        document.getElementById('myPopup').style.top = (top -h -80) + 'px';
    }else{
        document.getElementById('myPopup').style.top = (top) + 'px';
    }
    
    // Focus the cursor inside the box
    document.getElementById('objEnter').focus();
    document.getElementById('objEnter').select();
}

// ****************************
// Forms:
// ****************************

// Forms to enter a new object
function GetPopupForm(anno) {
    // get object name and attributes from 'anno'
    var obj_name = "";
    var attributes = "";
    var occluded = "";
    var parts = "";
    if (anno) {
        obj_name = anno.GetObjName();
        if (obj_name=="") {obj_name = "?";} // if the object field is empty, but the annotation exists, then it means we are in edit mode.
        attributes = anno.GetAttributes();
        occluded = anno.GetOccluded();
        parts = anno.GetParts();
    }
    
    html_str = "<b>Enter object name</b><br />";
    html_str += HTMLobjectBox(obj_name);

    if (use_attributes) {
        html_str += HTMLoccludedBox(occluded);

        html_str += "<b>Enter attributes</b><br />";
        html_str += HTMLattributesBox(attributes);
    }
    
    if (use_parts) {
        //html_str += "<b>Enter parts</b><br />";
        html_str += HTMLpartsBox(parts);
    }
    
    // Buttons
    html_str += "<br />";
    if (obj_name==""){
        html_str += HTMLdoneButton() + HTMLundocloseButton() + HTMLdeleteButton();
    }else{
        // treat the special case of edditing a polygon:
        html_str += HTMLdoneeditButton() + HTMLadjustpolygonButton() + HTMLdeleteeditButton();
    }

    return html_str;
}


function GetVerifiedPopupForm() {
    return "<b>This annotation has been blocked.</b><br />";
}


// ****************************
// Simple building blocks:
// ****************************

// Shows the box to enter the object name
function HTMLobjectBox(obj_name) {
    var html_str="";
        
    html_str += '<input name="objEnter" id="objEnter" type="text" style="width:220px;" tabindex="0" value="'+obj_name+'" title="Enter the object\'s name here. Avoid application specific names, codes, long descriptions. Use a name you think other people would agree in using. "';
        
    html_str += ' onkeyup="var c;if(event.keyCode)c=event.keyCode;if(event.which)c=event.which;if(c==13)';
        
    // if obj_name is empty it means that the box is being created
    if (obj_name==''){
            // If press enter, then submit; if press ESC, then delete:
            html_str += 'main_handler.SubmitQuery();if(c==27)main_handler.WhatIsThisObjectDeleteButton();" ';
    }else{
            // If press enter, then submit:
            html_str += 'main_handler.SubmitEditLabel();" ';
    }
    
    // if there is a list of objects, we need to habilitate the list
    if(object_choices=='...') {
        html_str += '/>'; // close <input
    }else{
        html_str += 'list="datalist1" />'; // insert list and close <input
        
        html_str += '<datalist id="datalist1"><select style="display:none">';
        for(var i = 0; i < object_choices.length; i++) {
            html_str += '<option value="' + object_choices[i] + '">' + object_choices[i] + '</option>';
        }
        html_str += '</select></datalist>';
    }
        
    html_str += '<br />';
        
    return html_str;
}

// ****************************
// ATTRIBUTES:
// ****************************
// ?attributes=object:car;brand:seat/ford;color:...;comments:...

// is the object occluded?
function HTMLoccludedBox(occluded) {
    var html_str="";
    
    // by default, the value of occluded is "no"
    if (!(occluded=="no" || occluded=="yes")) {occluded="no";}
    
    // the value of the selection is inside a hidden field:
    html_str += 'Is occluded? <input type="hidden" name="occluded" id="occluded" value="'+occluded+'"/>';
    
    // generate radio button
    if (occluded=='yes')
    {
        html_str += '<input type="radio" name="rboccluded" id="rboccluded" value="yes" checked="yes" onclick="document.getElementById(\'occluded\').value=\'yes\';" />yes';
        html_str += '<input type="radio" name="rboccluded" id="rboccluded" value="no"  onclick="document.getElementById(\'occluded\').value=\'no\';" />no';
    }
    else
    {
        html_str += '<input type="radio" name="rboccluded" id="rboccluded" value="yes"  onclick="document.getElementById(\'occluded\').value=\'yes\';" />yes';
        html_str += '<input type="radio" name="rboccluded" id="rboccluded" value="no" checked="yes"  onclick="document.getElementById(\'occluded\').value=\'no\';" />no';
    }
    html_str += '<br />';
    
    return html_str;
}

// Boxes to enter attributes
function HTMLattributesBox(attList) {    
    return '<textarea name="attributes" id="attributes" type="text" style="width:220px; height:3em;" tabindex="0" title="Enter a comma separated list of attributes, adjectives or other object properties">'+attList+'</textarea>';
}


// ****************************
// PARTS:
// ****************************
function HTMLpartsBox(parts) {
    var html_str="";
    if (parts.length>0) {
        if (parts.length==1) {
            html_str = 'Object has 1 part.';
        } else {
            html_str = 'Object has '+parts.length+' parts.';
        }
    } else {
        html_str = 'Object has no parts (you can add parts using the right panel).';
    }
    
    return html_str;
}


// ****************************
// show basic buttons
// ****************************
function HTMLdoneButton() {
    return '<input type="button" value="Done" title="Press this button after you have provided all the information you want about the object." onclick="main_handler.SubmitQuery();" tabindex="0" /> ';
}

function HTMLdoneeditButton() {
    return '<input type="button" value="Done" title="Press this button when you are done editing." onclick="main_handler.SubmitEditLabel();" tabindex="0" /> ';
}

function HTMLundocloseButton() {
    return '<input type="button" value="Undo close" title="Press this button if you accidentally closed the polygon. You can continue adding control points." onclick="main_handler.WhatIsThisObjectUndoCloseButton();" tabindex="0" /> ';
}

function HTMLdeleteButton() {
    return '<input type="button" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.WhatIsThisObjectDeleteButton();" tabindex="0" /> ';
}

function HTMLdeleteeditButton() {
    return '<input type="button" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.EditBubbleDeleteButton();" tabindex="0" /> ';
}

function HTMLadjustpolygonButton() {
    return '<input type="button" value="Adjust polygon" title="Press this button if you wish to update the polygon\'s control points." onclick="main_handler.EditBubbleAdjustPolygon();" /> ';
}

// show small icon on the top-right to close the window
function GetCloseImg() {
    return '<img style="border: 0pt none; width:14px; height:14px; z-index:4; -moz-user-select:none; position:absolute; cursor:pointer; right:8px;'+
    'top: 8px;" src="Icons/close.png" height="14" width="14" onclick="main_handler.SelectedToRest()" />';
}




