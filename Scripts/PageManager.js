//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document.body);
var $WeekdayContainer = $("#WeekdayContainer");
// for settings
var navbar = $(".navbar");
var modals = $(".modal-content");
//Moment.js, gets us an object of the current date/time
var momentCurrent = moment();
var momentInstance = moment(momentCurrent); //Cloned copy for modifying +- weeks

var hammer = new Hammer(document.getElementById("WeekdayContainer"));
hammer.on("swipeleft swiperight", function (ev) {
    console.log(ev.type + " detected");
    
    
});
//Testing hammer function, gestures not yet implemented
//$('.img-item').each(function(){
//    var $this = $(this);
//    var mc = new Hammer(this);
//    mc.on("doubletap", function() {
//        console.log('Double tap!');
//        alert('Double tap!');
//        $this.toggleClass('liked');
//        return false;
//    });
//});

//Reference to firebase DB, unset if not signed in...
var fireDB;
//Reference to the user's note collection
var userNotesCollection;


//color arrays
var defaultColorAR = ["#3e9ce9", "#e98b3e", "#14d19e", "#e9593e", "#5d65ef", "#a81fff", "#ea63b0"];
var complementColorAR = ["#97cdf4", "#f6c555", "#99f299", "#e8a09c", "#a3a6f6", "#db85ff", "#ed91c7"];
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
            console.log("Sign-in provider: " + profile.providerId);
            console.log("  Provider-specific UID: " + profile.uid);
            console.log("  Name: " + profile.displayName);
            console.log("  Email: " + profile.email);
            console.log("  Photo URL: " + profile.photoURL);

            //swap default place holder icon with actual account photo
            $("#userIcon").attr("src", profile.photoURL);

            //setup database reference if we signed in...
            if (checkDB()) {
                //                fireDB = firebase.database(); //OMG WRONG API NO WONDER
                fireDB = firebase.firestore();
       
                fireDB.collection("users").doc(profile.uid).get()
                    .then(function (dbUserDoc) {
                        //Checks if the document (the user directory) exists
                        if (dbUserDoc.exists) {
                            //console.log("Doc Data: ", dbUserDoc.data());

                            //Set reference to the collection
                            userNotesCollection = fireDB.collection("users/" + profile.uid + "/notes");
                            
                            //test
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
    
      noteCollectionRef.doc(year + "-" + weekNumber).get()
          .then(function (docs) { //At this level we're reading the document
          
          if(docs.exists)
          {
              var currWeekData = docs.data();
              
              console.log(currWeekData.friday);
              //iterate thru afdsgh
              var itemTemplate = $("#itemTaskTemplate").text();
              
              $WeekdayContainer.find(".colorFrameContent")
                  .each(function(index){
                  
                  //Get button's parent and follow the same procedure as add-item
                  
                  currWeekData.friday.content
                      .forEach(function(contentItem){
                      
                      //using the itemTemplate, insert then select the new element and populate with data(contentItem)...
                      
                  });
                  
                  
              });
              
              
          }
//          else
//          {
//              //No notes for this week
//          }
          
    })
    .catch(function(error) {
          alert("Error fetching notes: ", error);
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
        
        //Check if we checked off the task
        if($(this).find("input").is(":checked"))
        {
            contentObj[day]["isChecked"][index] = true;
        }
        else
        {
            contentObj[day]["isChecked"][index] = false;
        }
        
        contentObj[day]["content"][index] = $(this).children("textarea").val();
        
    })

    console.log("day contents is: ", contentObj);
    
//    fireDB.collection("users/" + firebase.auth().currentUser.providerData[0].uid + "/notes")
    //userNotesCollection.doc(momentInstance.year()+"-"+ momentInstance.week()).update(contentObj);
    
}

function firstTimeInitializeUser(currYear, currWeek, userProfile) {
    fireDB.collection("users").doc(userProfile.uid).set({
        email: userProfile.email
    });

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
    alert("You clicked on notifications!");
};

clickActions["next-week"] = function (e) {
    //alert("You clicked on next week!");

    displayWeekTop(momentInstance.add(7, "days"));

    clearWeekSlots();
    loadTemplate();
};

clickActions["prev-week"] = function (e) {
    //alert("You clicked on prev week!");

    displayWeekTop(momentInstance.subtract(7, "days"));

    clearWeekSlots();
    loadTemplate();
};

//Jump to current week
clickActions["current-week"] = function (e) {

    displayWeekTop(momentCurrent);

    //Reset momentInstance via explicit clone because add/sub operations persist from other functions.
    momentInstance = moment(momentCurrent);


    clearWeekSlots();
    loadTemplate();
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
};

clickActions["exit-day-slot"] = function (e) {
    var $target = $(e.currentTarget) || $();
    console.log("slot exit clicked: " + e.currentTarget);

    //search for Closest container
    var $currSlot = $target.closest(".colorFrameBase");
    console.log("slot exit parent is: " + $currSlot);
    
    //when we close the current day, write the notes to the DB
    postNotesByDay($currSlot);

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

    e.stopImmediatePropagation();

    calendarDropdown();

    updateProgressBar($target);
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

//reverts all columns to their normal view
function frameNormalizeAll() {
    //revert everything to default
    $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
        $(this).removeClass("shrinkCol");
        $(this).removeClass("expandedCol");
    });

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


function loadTemplate() {
    //TODO: dynamically load in html templates for vertical day slice
    //Use jquery.load( "path/file.html #toSelector");
    //$WeekdayContainer.load("HTML/Template01.html");

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

        //Load// Edit: 7 calls to server doesn't make sense, why not call
        //once outside loop and reuse template?
        //         $tempDaySlot.load("HTML/Template01.html", 
        //         fadeInElement($tempDaySlot));

        //Alternative load, template from script, select from script ID
        //        var rawHtml = $("#Template01").text();
        //        $tempDaySlot.html(rawHtml);

        //Alternative to fadeInElement function, direct chain callback
        $tempDaySlot.html(rawHtml).hide().fadeIn("slow", function () {
            //            postColorFix();

        });

        $tempDaySlot.css("zIndex", 8 - i);
    }

    ColorFix();

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

        //Hide these until we 
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
                $top.addClass("border border-info rounded");
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

function resetSettings() {
    $("#nightMode").prop("checked", false);
    localStorage.setItem("backgroundColor", backgroundColor[0]);
    localStorage.setItem("textColor", textColor[0]);
    loadSettings();
}

// updates progress bar after adding item, removing item, and checking item
function updateProgressBar(target) {

    if (target.attr("id") == "remove-item") {
        target = $(".expandedCol .colorFrameContent");
    }

    var totalEntries = target.closest(".colorFrameContent").find(".entryCheckbox").length;
    var checkedEntries = target.closest(".colorFrameContent").find(".entryCheckbox:checked").length;
    var progressbar = target.closest(".colorFrameContent").siblings().find(".progress-bar");
    var percent = checkedEntries / totalEntries * 100;
    if (isNaN(percent)) //no items in list
    {
        percent = 0;
    }

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