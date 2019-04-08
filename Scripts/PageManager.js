//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document.body);
var $WeekdayContainer = $("#WeekdayContainer");

//color arrays
var defaultColorAR = ["#3e9ce9", "#e98b3e", "#14d19e", "#e9593e", "#5d65ef", "#a81fff", "#ea63b0"];
var complementColorAR = ["#97cdf4", "#f6c555", "#99f299", "#e8a09c", "#a3a6f6", "#db85ff", "#ed91c7"];


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

//JQUERY ready is similar to window.onload except it occurs earlier
$docObj.ready(function () {
    console.log("Page has loaded!");
    //    alert("Page loaded, welcome!");
    
    //Not working yet
//    var now = dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT");
//    $("currentWeek").html(now);
    
    loadTemplate();

});

//default DOM event occurs when images and everything is loaded, not needed most likely
window.onload = function () {
    //postColorFix();
};

//************Click Actions**********
//example, look at index.html nav notification button
clickActions["notification"] = function (e) {
    alert("You clicked on notifications!");
}

clickActions["next-week"] = function (e) {
    alert("You clicked on next week!");
    clearWeekSlots();
    loadTemplate();
}

clickActions["prev-week"] = function (e) {
    alert("You clicked on prev week!");
    clearWeekSlots();
    loadTemplate();
}

//Day Column Expand/Contract function
clickActions["daySlot"] = function (e) {
    console.log("day slot clicked: " + e.currentTarget);
    
    //make JQuery obj from given element
    var $target = $(e.currentTarget) || $();

    //Shrink everything to smaller size
    $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
        $(this).addClass("shrinkCol");
    });

    //Check to see if we should expand or revert to normal
    if ($target.hasClass("expandedCol")) 
    {
        //revert everything to default
        $WeekdayContainer.find(".colorFrameBase").each(function (elem) {
            $(this).removeClass("shrinkCol");
            $(this).removeClass("expandedCol");
        });
    }
    else //convert single clicked row to expanded view
    { 
        $target.removeClass("shrinkCol");
        $target.addClass("expandedCol");
    }

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
        var newHTML = "<div class=\"colorFrameBase card\" $ data-click=\"daySlot\"></div>";
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

}

function clearWeekSlots()
{
    $WeekdayContainer.empty();
}

//Quick visual for "loading in" the app
function fadeInElement(param) {
    //IDE intellisense tip, function was expecting a Jquery object but 
    //we can trick it into thinking it's a Jquery object by setting it to itself OR empty Jquery object (can be extended to any object)
    param = param || $();

    param.hide();
    param.fadeIn("slow");
    postColorFix();
}

//Fixes the colors of the frames once it loads
//Maybe add a color selector thing down the line or parse colors from input
function postColorFix() {

    $WeekdayContainer.find(".colorFrameTop").each(function (index) {
        var $top = $(this);
        
        $top.css("background-color", defaultColorAR[index]);
        //load the day names for the week
        switch(index)
            {
                case 0:
                    $top.html("SUNDAY");
                    break;
                case 1:
                    $top.html("MONDAY");
                    break;
                case 2:
                    $top.html("TUESDAY");
                    break;
                case 3:
                    $top.html("WEDNESDAY");
                    break;
                case 4:
                    $top.html("THURSDAY");
                    break;
                case 5:
                    $top.html("FRIDAY");
                    break;
                case 6: 
                    $top.html("SATURDAY");
                    break;
                default: console.log("Invalid Day!");
            }
    });

    $WeekdayContainer.find(".colorFrameContent").each(function (index) {
        $(this).css("background-color", complementColorAR[index]);
    });
}
