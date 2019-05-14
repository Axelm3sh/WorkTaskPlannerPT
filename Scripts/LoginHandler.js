//default DOM event occurs when images and everything is loaded
//window.onload = function () {
//
//};

function GAuthPopup() {

    console.log("Running Google Authentication");

    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().useDeviceLanguage();
    provider.addScope("profile");
    provider.addScope("email");

    firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
//        alert("successful login");
        window.location.href = "app.html";

    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...

        alert(errorCode + errorMessage);
    });
}

function userSignOut() {
    firebase.auth().signOut().then(function () {
        // Sign-out successful.
        window.location.href = "index.html";
    }).catch(function (error) {
        // An error happened.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        alert(errorCode + errorMessage);
    });
}