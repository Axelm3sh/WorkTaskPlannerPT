//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document);
var $WeekdayContainer = $("#WeekdayContainer");
//var defaultColorAR = []{"#10000"  };


$docObj.ready(function () 
              {
    console.log("Page has loaded!");
    alert("Page loaded, welcome!");
    loadTemplate();
});


function loadTemplate() 
{
    //TODO: dynamically load in html templates for vertical day slice
    //Use jquery.load( "path/file.html #toSelector");
    //$WeekdayContainer.load("HTML/Template01.html");

    //Append divs with IDs containing daySlot followed by #
    for (var i = 1; i <= 7; i++) 
    {
        //generated divs
        var newHTML = "<div class=\"colorFrameBase\" $></div>";
        //ex: should be id="daySlot1"
        newHTML = newHTML.replace("$", "id=\"daySlot" + i + "\"");
        
        //append them to the initial container
        $WeekdayContainer.append(newHTML);
        
        //each day slot gets loaded up with a template
        var $tempDaySlot = $("#daySlot"+i);
        $tempDaySlot.css("background-color", "rgba()");
        $tempDaySlot.load("HTML/Template01.html");
        $tempDaySlot.css("zIndex", -i);
    }
}
