//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document.body);
var $WeekdayContainer = $("#WeekdayContainer");
// for settings
var navbar = $(".navbar");
var modals = $(".modal-content");
//Moment.js, gets us an object of the current date/time
var momentCurrent = moment();
var momentInstance = moment(momentCurrent); //Cloned copy for modifying +- weeks


//Reference to firebase DB, unset if not signed in...
var fireDB;
//Reference to the user's note collection
var userNotesCollection;


//color arrays
var defaultColorAR = ["#3e9ce9", "#e98b3e", "#48992f", "#e9593e", "#5d65ef", "#a81fff", "#ea63b0"];
var complementColorAR = ["#97cdf4", "#f6c555", "#a2e28e", "#e8a09c", "#a3a6f6", "#db85ff", "#ed91c7"];
var backgroundColor = ["#ffffff", "#2d2d2d"];
var textColor = ["#000000", "#ffffff"];


//*******Universal click handler functionality, 
//just add a: data-click="actionName" attribute to the element.*******/
var clickActions = {};
//catch all click events
$docObj.on("click", "*", function (elem) {
    var $this = $(this);

    var actionName = $this.data("click") || false;

    if (typeof clickActions[actionName] === 'function') {
        clickActions[actionName].call(this, elem);
    }
});
//END Universal Click handler

//User Authorization listener
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        console.log("user signed in");
        user.providerData.forEach(function (profile) {
//            console.log("Sign-in provider: " + profile.providerId);
//            console.log("  Provider-specific UID: " + profile.uid);
//            console.log("  Name: " + profile.displayName);
//            console.log("  Email: " + profile.email);
//            console.log("  Photo URL: " + profile.photoURL);

            //swap default place holder icon with actual account photo
            $("#userIcon").attr("src", profile.photoURL);

            //setup database reference if we signed in...
            if (checkDB()) {
                //                fireDB = firebase.database(); //OMG WRONG API NO WONDER
                fireDB = firebase.firestore();
                
                //Initialize first time run
                fireDB.collection("users").doc(profile.uid).get()
                    .then(function (dbUserDoc) {
                        //Checks if the document (the user directory) exists
                        if (dbUserDoc.exists) {
                            //console.log("Doc Data: ", dbUserDoc.data());

                            //Set reference to the collection
                            userNotesCollection = fireDB.collection("users/" + profile.uid + "/notes");
                            
                            //get all notes for the week
                            getAllNotes(momentCurrent.year(), momentCurrent.week(), userNotesCollection);
                            
                            
                            //can also get provider's uid from //firebase.auth().currentUser.providerData[0].uid


                        } else {
                            console.log("user does not exist, creating new...");
                            
                            //Make a blank week document       
                            firstTimeInitializeUser(momentCurrent.year(), momentCurrent.week(), profile);

                        }
                    });

            } //end checkDB
        });

    } else {
        // No user is signed in.
        console.log("no user signed in");
        //      GAuthPopup();
        window.location.href = "index.html";
    }
});

//GET All Notes for the week, populate the slots
function getAllNotes(year, weekNumber, noteCollectionRef) {
    
    console.log("trying to get notes from: "+ year + "-" + weekNumber);
      noteCollectionRef.doc(year + "-" + weekNumber).get().then(function (docs) { //At this level we're reading the document
          if(docs.exists)
          {
              var currWeekData = docs.data();
              
              //console.log(currWeekData.friday);
              //iterate thru afdsgh
              var itemTemplate = $("#itemTaskTemplate").text();
              
              $WeekdayContainer.find(".colorFrameContent")
                  .each(function(index){
                  
                  //Get the day from the topFrame
                  var day = $(this).siblings(".colorFrameTop").attr("data-dayValue").toLowerCase();
                  var $contentContainer = $(this);
                  
                  //If the day was not filled with data, we can skip...
                  if(currWeekData[day] != undefined)
                  {
                      $.each(currWeekData[day].content, function(cIndex, cItem){

                          //Get button's parent and follow the same procedure as add-item
                          $contentContainer.find("#addButton").parent().before(itemTemplate);
                          //using the itemTemplate, insert then select the new element and populate with data(contentItem)...
                          var $newestEntry = $contentContainer.find(".contentExpandedContainer.entry").last();

                          //Text
                          $newestEntry.children("textarea").val(cItem);
                          //Check box
                          $newestEntry.find("input").prop("checked", currWeekData[day].isChecked[cIndex]);
                          //Due Date
                          $newestEntry.attr("data-dueDate", currWeekData[day].dueDate[cIndex]);

                      }); //Inner content populate
                  }
                  
                  //Restore previous progress
                  updateProgressBar($contentContainer);
                  
              }); //Day Slot populate   
              
                //reset calendar functionality
                reapplyAllCalendarDropdown();
                //Load and hide...again
                initialHiddenElements();
          }
//          else
//          {
//              //No notes for this week
//          }
          
    })
    .catch(function(error) {
          alert("Error fetching notes: " + error);
      });
    
}

//typically content is the .colorFrameBase of the day slot...
function postNotesByDay(content)
{
    content = content || $();
    var contentObj = {};
    
    var day = content.find(".colorFrameTop").attr("data-dayValue").toLowerCase();
    
    contentObj[day] = { 
        content:[], 
        isChecked:[], 
        dueDate:[] 
    };
    
    //Iterate thru content and find the input data
    content.find(".contentExpandedContainer.entry").each(function (index) {
        
        //Skip saving empty text boxes
        if( !isNullOrWhitespace($(this).children("textarea").val()) )
        {
            contentObj[day].content.push( $(this).children("textarea").val() );

            //Check if we checked off the task
            if($(this).find("input").is(":checked"))
            {
                contentObj[day].isChecked.push( true );
            }
            else
            {
                contentObj[day].isChecked.push( false );
            }

            //Firebase doesn't like null/undefined data
            if(!isNullOrWhitespace($(this).data("duedate"))) 
            {
                contentObj[day].dueDate.push( $(this).data("duedate") );
            }
            else
            {
                contentObj[day].dueDate.push("none");
            }
        }
        
    });

    //console.log("day contents is: ", contentObj);
    if(contentObj[day].content.length > 0)
    {
        //Merge allows us to create a new document for storage and not overwrite previously exisiting data
        userNotesCollection.doc(momentInstance.year()+"-"+ momentInstance.week()).set(contentObj, {merge:true})
        .then(function()
        {
            console.log("successfully updated notes!");
        })
        .catch(function(err)
        {
            alert("Error occured while Writing notes: ", err);
        });
    }
    else
    {
        //We'll just use an empty BUT NOT UNDEFINED(?) object
        var delObj = {};
        delObj[day] = {
            content: [],
            isChecked: [],
            dueDate: []
        };
        
        //should delete the field
        //fireDB.collection("users/" + firebase.auth().currentUser.providerData[0].uid + "/notes")
        userNotesCollection.doc(momentInstance.year()+"-"+ momentInstance.week())
            .update( delObj )
            .then(function()
                 {
            console.log("Successful deletetion of ", day);
            
        }).catch(function (err) {
            console.log(err);
        });
    }
    
////Firestore FieldValue.delete() can only delete top level of data structure....    
//    else
//    {
//        var delObj = {};
//        
//        delObj[day] = {
//            content: firebase.firestore.FieldValue.delete(),
//            isChecked: firebase.firestore.FieldValue.delete(),
//            dueDate: firebase.firestore.FieldValue.delete()
//        };
//        
//        //should delete the field
//        fireDB.collection("users/" + firebase.auth().currentUser.providerData[0].uid + "/notes")
//        userNotesCollection.doc(momentInstance.year()+"-"+ momentInstance.week())
//            .update( delObj )
//            .then(function()
//                 {
//            console.log("Successful deletetion of ", day);
//            
//        }).catch(function (err) {
//            console.log(err);
//        });
//    }
    
}

//Initializes a blank week document
function initWeekDoc(currYear, currWeek, userProfile)
{
    //Blank fields for the content
    var initDoc = {
        sunday: {content: [], isChecked: [], dueDate: []},
        monday: {content: [], isChecked: [], dueDate: []},
        tuesday: {content: [], isChecked: [], dueDate: []},
        wednesday: {content: [], isChecked: [], dueDate: []},
        thursday: {content: [], isChecked: [], dueDate: []},
        friday: {content: [], isChecked: [], dueDate: []},
        saturday: {content: [], isChecked: [], dueDate: []}
    };
    
    //var test = initDoc["sunday"]["isChecked"][0];
    fireDB.collection("users").doc(userProfile.uid).collection("notes").doc(currYear+"-"+currWeek).set(initDoc);
}

function firstTimeInitializeUser(currYear, currWeek, userProfile) {
    fireDB.collection("users").doc(userProfile.uid).set({
        email: userProfile.email
    });

    //Create the blank document for this week
    initWeekDoc(currYear, currWeek, userProfile);
}

//Checks to see if the reference to the DB is set or not, returns false if current user is not authenticated or when the refernce is not set. Otherwise it is true.
function checkDB() {
    var value = false;

    if (firebase.auth().currentUser !== null) {
        if (fireDB !== null) {
            value = true;
        } else {
            value = false;
        }
    }

    return value;
}

//Check for null or whitespace in string
 function isNullOrWhitespace( input ) {
     return !input || input.replace(/\s/g, '').length < 1;
 }


//JQUERY ready is similar to window.onload except it occurs earlier
$docObj.ready(function () {
    console.log("Page has loaded!");
    //    alert("Page loaded, welcome!");

    loadSettings();

    //Display current date at the top of the week using a cloned object from Moment.js
    displayWeekTop(momentInstance);

    loadTemplate();

});


//default DOM event occurs when images and everything is loaded, used for firebase because it's loaded first before jquery.
window.onload = function () {
    //postColorFix();

};

//************Click Actions**********
//example, look at index.html nav notification button
clickActions["notification"] = function (e) {
    //alert("You clicked on notifications!");
};

clickActions["next-week"] = function (e) {
    //alert("You clicked on next week!");

    closeOpenNotes();
    
    displayWeekTop(momentInstance.add(7, "days"));

    clearWeekSlots();
    loadTemplate();
    
    getAllNotes(momentInstance.year(), momentInstance.week(), userNotesCollection);
};

clickActions["prev-week"] = function (e) {
    //alert("You clicked on prev week!");

    closeOpenNotes();
    
    displayWeekTop(momentInstance.subtract(7, "days"));

    clearWeekSlots();
    loadTemplate();
    
    getAllNotes(momentInstance.year(), momentInstance.week(), userNotesCollection);
};

//Jump to current week
clickActions["current-week"] = function (e) {

    closeOpenNotes();
    
    displayWeekTop(momentCurrent);

    //Reset momentInstance via explicit clone because add/sub operations persist from other functions.
    momentInstance = moment(momentCurrent);


    clearWeekSlots();
    loadTemplate();
    
    getAllNotes(momentInstance.year(), momentInstance.week(), userNotesCollection);
};

//Day Column Expand/Contract function
clickActions["day-slot"] = function (e) {
    console.log("day slot clicked: " + e.currentTarget);

    //make JQuery obj from given element
    var $target = $(e.currentTarget) || $();

    //Don't do anything if it has been already expanded
    if (!$target.hasClass("expandedCol")) {
        //Normalize all in case they clicked on another slot
        frameNormalizeAll();

        //toggleExpansion($target);
        frameExpansion($target);

        $target.find(".contentExpandedContainer").each(function (index) {
            $(this).data("visible", true); //data-visible is used for queries
            fadeInElement($(this));
        });

        $target.find(".contentShortContainer").each(function (index) {
            $(this).data("visible", false);
            $(this).hide();
        });
    }
   
    //e.stopImmediatePropagation();
};

clickActions["exit-day-slot"] = function (e) {
    var $target = $(e.currentTarget) || $();
    console.log("slot exit clicked: " + e.currentTarget);

    //search for Closest container
    var $currSlot = $target.closest(".colorFrameBase");
    console.log("slot exit parent is: " + $currSlot);
    
    //when we close the current day, write the notes to the DB
    postNotesByDay($currSlot);
    
    //Inner code uses the children of the slot to find closest
    updateProgressBar($currSlot);

    //toggleExpansion($currSlot);
    frameNormalizeAll();

    //Find the expanded items and hide them
    $currSlot.find(".contentExpandedContainer").each(function (index) {
        $(this).hide();
        $(this).data("visible", false);
    });

    //fade back in the abbreviated list
    $currSlot.find(".contentShortContainer").each(function (index) {
        fadeInElement($(this));
    });

    //Stop it from bubbling up to "daySlot" event
    e.stopImmediatePropagation();
};

//Adds a typey note to the day
clickActions["add-item"] = function (e) {
    var $target = $(e.currentTarget) || $();

    var itemTemplate = $("#itemTaskTemplate").text();

//    $target.closest(".colorFrameContent").append(itemTemplate);
    $target.parent().before(itemTemplate);

    calendarDropdown();

    updateProgressBar($target);
    
    e.stopImmediatePropagation();    
};

//Removing item row
clickActions["remove-item"] = function (e) {
    console.log("removed item from slot");
    var $obj = $(e.currentTarget) || $();

    $obj.closest(".contentExpandedContainer").remove();

    //should update the progress bar's total too.
    //take completed items in container, divide by total
    updateProgressBar($obj); // not working
};

// Checking a task as finished
clickActions["check-item"] = function (e) {
    var $obj = $(e.currentTarget) || $();

    updateProgressBar($obj);
};

//Auto expansion/normalization, given a ColorFrameBase
function toggleExpansion(element) {
    //trick IDE autocomplete
    var $target = element || $();


    //Check to see if we should expand or revert to normal
    if ($target.hasClass("expandedCol")) {
        frameNormalizeAll($target);
    } else //convert single clicked row to expanded view
    {
        frameExpansion($target);
    }
}

//Function call that clicks the exit button of an open day
function closeOpenNotes()
{
    $WeekdayContainer.find(".expandedCol").find(".colorFrameTop").find("span").click();
}

var hammer = new Hammer(document.getElementById("WeekdayContainer"),{
	recognizers: [
		[Hammer.Swipe,{ direction: Hammer.DIRECTION_HORIZONTAL }],
	]
});
hammer.options.domEvents=true;
                        
hammer.on("swipeleft swiperight", function (ev) {
    
    console.log(ev.type + " detected");//debug
    
    var currItem = $WeekdayContainer.find(".colorFrameBase.expandedCol");
    if(currItem.length > 0) //technically this should only be 1 item, the expanded item...
    {
        var currentSlotName = currItem.attr("id");
        var currentSlotNumber = Number(currentSlotName[currentSlotName.length-1]); //Might return NaN if used incorrectly
        //Detect type of swipe
        switch(ev.type)
        {
            //go to next day
            case "swiperight":
                closeOpenNotes();
                if(currentSlotNumber >= 7)//Wrap to beginning
                    {
                        $("#"+currentSlotName.substr(0, currentSlotName.length-1)+1).click();
                    }
                else
                {
                    currentSlotNumber++;
                    $("#"+currentSlotName.substr(0, currentSlotName.length-1)+currentSlotNumber).click();
                }
                
                break;
            case "swipeleft"://previous day
                closeOpenNotes();
                if(currentSlotNumber <= 1)//Wrap to end
                    {
                        $("#"+currentSlotName.substr(0, currentSlotName.length-1)+7).click();
                    }
                else
                    {
                        currentSlotNumber--;
                        $("#"+currentSlotName.substr(0, currentSlotName.length-1)+currentSlotNumber).click();
                    }
                break;
            default: //Some other swipe or action
                break;
        }
    }
    
});

//reverts all columns to their normal view
function frameNormalizeAll() {
    //revert everything to default
    $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
        $(this).removeClass("shrinkCol");
        $(this).removeClass("expandedCol");
    });

    //small fade effect
    $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
        $(this).find(".contentShortContainer").each(function (i) {
            $(this).fadeIn("fast");
            $(this).data("visible", true);
        });

        $(this).find(".contentExpandedContainer").each(function (i) {
            $(this).fadeOut("fast");
            $(this).data("visible", false);
        });

    });


}

//convert single clicked column to expanded view
function frameExpansion($target) {
    $target = $target || $();

    //Shrink everything to smaller size
    $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
        $(this).addClass("shrinkCol");
    });

    //remove shrink from target and only keep expand
    $target.removeClass("shrinkCol");
    $target.addClass("expandedCol");

}


//Updates the top navbar area with the current date
function displayWeekTop(dateObject) {
    dateObject = dateObject || moment();

    //Using Moment.js
    var now = moment(dateObject).utcOffset(0, true).format("dddd, Do of MMMM, YYYY");
    $("#currentWeek").html(now);

}

//Day slot template load
function loadTemplate() {

    //Load template once
    var rawHtml = $("#Template01").text();

    //Append divs with IDs containing daySlot followed by #
    for (var i = 1; i <= 7; i++) {
        //generated divs
        var newHTML = $("#dayContainerTemplate").text();
        //ex: should be id="daySlot1"
        newHTML = newHTML.replace("$", "id=\"daySlot" + i + "\"");

        //append them to the initial container
        $WeekdayContainer.append(newHTML);

        //each day slot gets loaded up with a template
        var $tempDaySlot = $("#daySlot" + i);

        //Alternative to fadeInElement function, direct chain callback
        $tempDaySlot.html(rawHtml).hide().fadeIn("slow", function () {
            //            ColorFix();

        });

        $tempDaySlot.css("zIndex", 8 - i);
    }

    //Initialize the color of the container
    ColorFix();

    //New elements added inside so hide them
    initialHiddenElements();

}

//Clears out the currently displayed day slots in preparation for a refresh, should only be called if we're switching weeks
function clearWeekSlots() {
    $WeekdayContainer.empty();
}

function initialHiddenElements() {
    //
    $WeekdayContainer.find(".contentExpandedContainer").each(function (index) {

        //if($(this).data("visible") == false)

        //Hide these until we actually need them
        $(this).hide();
        $(this).data("visible", false);

    });
}

//Quick visual for "loading in" the app
function fadeInElement(param) {
    //IDE intellisense tip, function was expecting a Jquery object but 
    //we can trick it into thinking it's a Jquery object by setting it to itself OR empty Jquery object (can be extended to any object)
    param = param || $();

    //param.hide();
    param.fadeIn("slow");
    //postColorFix();
}

//Fixes the colors of the frames once it loads
//Maybe add a color selector thing down the line or parse colors from input
//Also sets other variables during the date calculation
function ColorFix() {

    //raw text for slot exit button
    var slotExitTemplate = $("#slotExitTemplate").text();
    //Separate object from the top nav weekday instance
    var momentCalc = moment(momentInstance);

    //Note: "index" is a value from 0-6, should calculate offsets accordingly
    $WeekdayContainer.find(".colorFrameTop").each(function (index) {
        var $top = $(this);

        $top.css("background-color", defaultColorAR[index]);
        //load the day names for the week
        if (index >= 0 && index <= 6) {

            //Moment.js calculates day offset
            momentCalc.day(index);
            
            $top.html(momentCalc.format("ddd Do")).append(slotExitTemplate);
            
            //Insert the day value for searching down the line
            $top.attr("data-dayValue", momentCalc.format("dddd"));

            if (momentCurrent.isSame(momentCalc)) {
                $top.addClass("border border-white rounded text-white");
            }

            //Reset for the next iteration
            momentCalc = moment(momentInstance);

        } else {
            console.log("Invalid Day!");
        }
    });

    $WeekdayContainer.find(".colorFrameContent").each(function (index) {
        $(this).css("background-color", complementColorAR[index]);
    });
}

//Toggles nav night mode
function toggleNightMode() {
    // store colors
    if ($("#nightMode").is(":checked")) {
        localStorage.setItem("backgroundColor", backgroundColor[1]);
        localStorage.setItem("textColor", textColor[1]);
    } else {
        localStorage.setItem("backgroundColor", backgroundColor[0]);
        localStorage.setItem("textColor", textColor[0]);
    }
    loadSettings();
}

//Local settings for nightmode
function loadSettings() {
    // set colors from local storage
    var bgc = localStorage.getItem("backgroundColor");
    var tc = localStorage.getItem("textColor");

    $docObj.css("background-color", bgc);
    navbar.css("color", tc);
    modals.each(function () {
        $(this).css("background-color", bgc);
        $(this).css("color", tc);
    });

    // if dark mode, set slider to checked
    if (localStorage.getItem("backgroundColor") === backgroundColor[1]) {
        $("#nightMode").prop("checked", true);
    }
}

//Reset local settings
function resetSettings() {
    $("#nightMode").prop("checked", false);
    localStorage.setItem("backgroundColor", backgroundColor[0]);
    localStorage.setItem("textColor", textColor[0]);
    loadSettings();
}

// updates progress bar after adding item, removing item, and checking item
function updateProgressBar(target) {

    if (target.attr("id") == "remove-item") 
    {
        target = $(".expandedCol .colorFrameContent");
    }

    var statusText = "No tasks made.";
    
    var $statusTarget = target.closest(".colorFrameContent");
    
    //Find entries in the slot
    var totalEntries = $statusTarget.find(".entryCheckbox").length;
    var checkedEntries = $statusTarget.find(".entryCheckbox:checked").length;
    if(totalEntries > 0)
    {
        if(checkedEntries != totalEntries)
        {
            var unfinished = totalEntries - checkedEntries;
            if(unfinished > 1)
            {
                statusText = "<strong class=\"text-dark\">You have " + unfinished + " unfinished tasks!</strong>";
            }
            else
            {
                statusText = "<strong>You have " + unfinished + " unfinished task!</strong>";
            }
        }
        else
        {
            statusText = "<strong class=\"text-success\">All tasks completed! Hurray!</strong>";
        }
    }
    
    //Convert to percentage for progress bar
    var progressbar = $statusTarget.siblings().find(".progress-bar");
    var percent = checkedEntries / totalEntries * 100;
    if (isNaN(percent)) //no items in list
    {
        percent = 0;
    }
    
    //Update the abbreviated status panel
    $statusTarget.find(".contentShortContainer").html(statusText);
    
    progressbar.attr("aria-valuenow", '"' + percent + '"');
    progressbar.css("width", percent + "%");
}

// provide functionality to calendar button
function calendarDropdown() {
    var calendar = $(".expandedCol .colorFrameContent #due-date").last();

    calendar.datepicker({
        format: "yyyy-mm-dd",
        todayHighlight: true,
        clearBtn: true,
        startDate: "0d"
    }).on("changeDate", function (ev) {
        var strDate = ev.date.toISOString();
        strDate = strDate.substring(0, strDate.indexOf("T"));

        // add date attribute to container
        calendar.closest(".contentExpandedContainer").attr("data-duedate", strDate);
    });
}

function reapplyAllCalendarDropdown()
{
    $WeekdayContainer.find(".fa.fa-calendar").parent()
        .each(function(index, item)
          {
        var calendar = $(item);
        
        calendar.datepicker({
            format: "yyyy-mm-dd",
            todayHighlight: true,
            clearBtn: true,
            startDate: "0d"
        }).on("changeDate", function (ev) {
            var strDate = ev.date.toISOString();
            strDate = strDate.substring(0, strDate.indexOf("T"));

            // add date attribute to container
            calendar.closest(".contentExpandedContainer").attr("data-duedate", strDate);
        });
    });
}