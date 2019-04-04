//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document.body);
var $WeekdayContainer = $("#WeekdayContainer");
var defaultColorAR = ["#3e9ce9", "#e98b3e", "#00c4b1", "#5d65ef", "#a165ed", "#ea63b0", "#e9593e"];
var complementColorAR = ["#97cdf4", "#f6c555", "#00dcd0", "#a3a6f6", "#bd94f1", "#ed91c7", "#e8a09c"];


//universal click handler functionality, 
//just add a: data-click="actionName" attribute to the element.
var clickActions = {};
//catch all click events
$docObj.on("click", "*", function(elem) {
    var $this = $(this);
    
    var actionName = $this.data("click") || false;
    
    if(typeof clickActions[actionName] === 'function')
        {
            clickActions[actionName].call(this, elem);
        }
});

//example, look at index.html nav notification button
clickActions["notification"] = function (e)
{
    alert("You clicked on notifications!");
}


//JQUERY ready is similar to window.onload except it occurs earlier
$docObj.ready(function () {
    console.log("Page has loaded!");
    //    alert("Page loaded, welcome!");
    loadTemplate();
    
});

//default DOM event occurs when images and everything is loaded
window.onload()
{
    postColorFix();
}


function loadTemplate() {
    //TODO: dynamically load in html templates for vertical day slice
    //Use jquery.load( "path/file.html #toSelector");
    //$WeekdayContainer.load("HTML/Template01.html");

    //Append divs with IDs containing daySlot followed by #
    for (var i = 1; i <= 7; i++) {
        //generated divs
        var newHTML = "<div class=\"colorFrameBase card\" $></div>";
        //ex: should be id="daySlot1"
        newHTML = newHTML.replace("$", "id=\"daySlot" + i + "\"");

        //append them to the initial container
        $WeekdayContainer.append(newHTML);

        //each day slot gets loaded up with a template
        var $tempDaySlot = $("#daySlot" + i);
        //For now we can directly change the entire slot container's collr
        $tempDaySlot.css("background-color", defaultColorAR[i - 1]);
        //Load 
        $tempDaySlot.load("HTML/Template01.html", fadeInElement($tempDaySlot));
        $tempDaySlot.css("zIndex", -i);
    }

}

//Quick visual for "loading in" the app
function fadeInElement(param) {
    param.hide();
    param.fadeIn("slow");
    postColorFix();
}

//~Not working, template being loaded out of order or there's a delay between load and callback~
function postColorFix() {

    $WeekdayContainer.find(".colorFrameTop").each(function (index) {
        $(this).css("background-color", defaultColorAR[index - 1]);
    });

    $WeekdayContainer.find(".colorFrameContent").each(function (index) {
        $(this).css("background-color", complementColorAR[index - 1]);
    });
}
