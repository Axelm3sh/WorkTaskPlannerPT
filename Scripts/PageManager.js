//$-prefix variables are Jquery objects, you can use this variable to do Jquery functions on the doc
var $docObj = $(document);

$docObj.ready(function() {
    console.log("Page has loaded!");
    alert("Page loaded, welcome!");
    loadTemplate();
});


function loadTemplate()
{
    //TODO: dynamically load in html templates for vertical day slice
    //Use jquery.load( "path/file.html #toSelector");
    $(".colorFrameBase").load("HTML/Template01.html");
}