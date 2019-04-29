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


//var fireDB;


//color arrays
var dayOfTheWeek      = ["SUN",     "MON",     "TUE",     "WED",       "THUR",     "FRI",     "SAT"    ];
var defaultColorAR    = ["#3e9ce9", "#e98b3e", "#14d19e", "#e9593e",   "#5d65ef",  "#a81fff", "#ea63b0"];
var complementColorAR = ["#97cdf4", "#f6c555", "#99f299", "#e8a09c",   "#a3a6f6",  "#db85ff", "#ed91c7"];
var backgroundColor   = ["#ffffff", "#2d2d2d"];
var textColor         = ["#000000", "#ffffff"];


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
        });

    } else {
        // No user is signed in.
        console.log("no user signed in");
        //      GAuthPopup();
        window.location.href = "index.html";
    }
});

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

clickActions["add-item"] = function (e) {
    var $target = $(e.currentTarget) || $();

    var itemTemplate = $("#itemTaskTemplate").text();

    $target.closest(".colorFrameContent").append(itemTemplate);

    e.stopImmediatePropagation();

};

//Removing item row
clickActions["remove-item"] = function (e) {
    console.log("removed item from slot");
    var $obj = $(e.currentTarget) || $();

    $obj.closest(".contentExpandedContainer").remove();

    //should update the progress bar's total too.
    //take completed items in container, divide by total

};

clickActions["check-item"] = function(e) {
    var $obj = $(e.currentTarget) || $();
    var totalEntries = $obj.closest(".colorFrameContent").find(".entryCheckbox").length;
    var checkedEntries = $obj.closest(".colorFrameContent").find(".entryCheckbox:checked").length;
    var progressbar = $obj.closest(".colorFrameContent").siblings().find(".progress-bar");
    var percent = checkedEntries / totalEntries * 100;

    // update progress bar
    progressbar.attr("aria-valuenow", '"' + percent + '"');
    progressbar.css("width", percent + "%");
}

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

    postColorFix();

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
function postColorFix() {

    //raw text for slot exit button
    var slotExitTemplate = $("#slotExitTemplate").text();

    $WeekdayContainer.find(".colorFrameTop").each(function (index) {
        var $top = $(this);

        $top.css("background-color", defaultColorAR[index]);
        //load the day names for the week
        if(index >= 0 && index <= 6) {
            date = momentInstance.add(index, 'days').format("D");
            $top.html(date + " " + dayOfTheWeek[index]).append(slotExitTemplate);
            momentInstance.subtract(index, 'days');
        }
        else {
            console.log("Invalid Day!");
        }
    });

    $WeekdayContainer.find(".colorFrameContent").each(function (index) {
        $(this).css("background-color", complementColorAR[index]);
    });
}

function toggleNightMode() {
    // store colors
    if($("#nightMode").is(":checked")) {
        localStorage.setItem("backgroundColor", backgroundColor[1]);
        localStorage.setItem("textColor", textColor[1]);
    }
    else {
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
    modals.each(function() {
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