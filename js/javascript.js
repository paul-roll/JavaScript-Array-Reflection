// ==========================================================================
// Variables and Prototypes
// ==========================================================================

// Allows objects to be stored session-storage
Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj));
};
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
};

// fetch a picsum image and return an array of its image as a blob, the ID
//      or on error a pointer towards local error.jpg
const urlToArray = async url => {
    const response = await fetch(url);
    if (!response.ok) {
        return {"id":-1, "image":"images/error.jpg"};
    }
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
        try {
            const imageID = response.headers.get("picsum-id");
            const reader = new FileReader() ;
            reader.readAsDataURL(blob) ;
            reader.onload = function(){
                onSuccess({"id":imageID,"image":this.result});
            } ;
        } catch(e) {
            onError(e);
        }
    });
};

// global variables
let currentImage;
let messageBusy = false;
let array = sessionStorage.getObj("array") || []; // set an empty array if session-storage is not found

// ==========================================================================
// Functions
// ==========================================================================

// return true if the imageID exists inside the emailID
function alreadyExists(emailID, imageID) {
    if (emailID !== "currentImage") {
        for (let i = 0; i < array[emailID].images.length; i++) {
            if (parseInt(array[emailID].images[i].id) === parseInt(imageID)) {
                showMessage("Duplicate Image Ignored");
                return true;
            }
        }
    }
    return false;
}

// lock submit, request a new image, set it then unlock submit
async function getImage() {
    $(`#form input[type="submit"]`).prop( "disabled", true );
    currentImage = await urlToArray('https://picsum.photos/100/100');
    setImage();
    $(`#form input[type="submit"]`).prop( "disabled", false );
}

// put the image stored in currentImage onto the sidebar
function setImage() {
    let html = "";
    html += `
        <a oncontextmenu="return false;" class="draggable" id="currentImage" href="https://picsum.photos/id/${currentImage.id}/${window.innerWidth}/${window.innerHeight}" data-lightbox="current" data-title="Image ID: ${currentImage.id}">
            <img src="${currentImage.image}" alt="">
        </a>
    `;
    $("#currentImage").html(html);

}

// put the data stored in array onto the main body
function displayArrays() {
    let html = "";

    // array is empty, placeholder text
    if (!array.length) {
        html += `
            <h2>The array is empty!</h2>
            <p>Submit some images to get started</p>
        `;
    // array has at least 1 item in it
    } else {
        // Loop through array and generate the html
        for (let emailIndex = 0; emailIndex < array.length; emailIndex++) {
            html += `<h2>${array[emailIndex].email}</h2>`;
            html += `<div id="${emailIndex}" class="image-flexbox" oncontextmenu="return false;">`;
            for (let imageIndex = 0; imageIndex < array[emailIndex].images.length; imageIndex++) {
                html += `
                    <a id="${imageIndex}" class="draggable" href="https://picsum.photos/id/${array[emailIndex].images[imageIndex].id}/${window.innerWidth}/${window.innerHeight}" data-lightbox="image-${emailIndex}" data-title="Image ID: ${array[emailIndex].images[imageIndex].id}">
                        <img src="${array[emailIndex].images[imageIndex].image}">
                    </a>
                `;
            }
            html += `</div>`;
        }
    }
    $("#main").html(html);
}

// take string, return id of that email or inject it and generate its ID to return
function getEmail(email) {
    if (!email) {
        email = "NULL";
    }
    for (let i = 0; i < array.length; i++) {
        if (array[i].email === email) {
            return i;
        }
    }
    array.push({"email":email, "images":[]});
    sessionStorage.setObj("array", array);
    fillDropdown();
    return array.length - 1;
}

// push the given image into the given emailID
function addImage(emailID, image) {
    if (!alreadyExists(emailID, image.id)) {
        array[emailID].images.push(image);
        sessionStorage.setObj("array", array);
    }
}

// update input dropdown list
function fillDropdown() {
    let html = "";
    for (let i = 0; i < array.length; i++) {
        html += `<option value="${array[i].email}">`;
    }
    $("#emailList").html(html);
}

// delete an email from the array
function deleteEmail(id) {
    array.splice(id, 1);
    fillDropdown();
}

// show a popup message briefly at the bottom of the screen
function showMessage(message) {
    if (!messageBusy) {
        messageBusy = true;
        $("#message").html(message);
        $("#message").slideDown(500).delay(2000).slideUp(500, function() {
            messageBusy = false;
        });

    }
}

// return true when email validates OK
function validateEmail(email) {
    if (!email) {
        showMessage("An Email Is Required");
        return false;
    } else if (!email.match(/^[a-zA-Z0-9-!#$%&'*+.\/=?@^_`{|}~]*$/)) {   // Invalid characters in email
        showMessage("Invalid Characters In Email");
        return false;
    } else if (email.length > 254) {  // At most 254 Characters
        showMessage("Email Is Too Long");
        return false;
    } else if (!email.match(/^[a-zA-Z0-9-!#$%&'*+.\/=?^_`{|}~]+@[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}$/)) {   // Far from perfect, catches the general format of emails
        showMessage("Invalid Email");
    } else {
        return true;
    }
}


// ==========================================================================
// Events
// ====================================================================

// set global variable to track the source when moving objects with the draggable class
let dragged;
$("body").on("dragstart", function(e) {
    if ( $(e.target).hasClass("draggable") ) {
        e.dataTransfer = e.originalEvent.dataTransfer;
        e.dataTransfer.setDragImage(e.target, 50, 50);
        dragged = e;
    }
});

$("body").on("dragover", function(e) {
    e.preventDefault();  
});

// set global variable to track the shift key state because aparently the submit event lacks the .shiftKey property.
let shiftKey = false;
$("body").on("keydown", function(e) {
    if (e.shiftKey) {
        shiftKey = true;
    } else {
        shiftKey = false;
    }
});

$("body").on("keyup", function(e) {
    if (e.shiftKey) {
        shiftKey = true;
    } else {
        shiftKey = false;
    }
});

// Drag and Drop completed
$("body").on("drop", function(e) {
    // Valid drag source and destination
    if ( (dragged) && ($(e.target).hasClass("draggable")) && (e.target !== dragged.target) ) {
        // Drag within same email
        if (( e.target.parentNode.id === dragged.target.parentNode.id ) ) {
            // move to same or lower slot
            if ( parseInt(e.target.id) <= parseInt(dragged.target.id) ) {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
                array[dragged.target.parentNode.id].images.splice(parseInt(dragged.target.id) + 1, 1);
            // move to higher slot
            } else {
                array[e.target.parentNode.id].images.splice(parseInt(e.target.id) + 1, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
                array[dragged.target.parentNode.id].images.splice(dragged.target.id, 1);
            }
        // drag from sidebar
        } else if ((dragged.target.parentNode.id === "currentImage")) {
            if (!alreadyExists(e.target.parentNode.id, currentImage.id)) {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, currentImage);
                sessionStorage.setObj("array", array);
                displayArrays();
            }
            if (!e.shiftKey) {
                getImage();
            }
        } else if (!alreadyExists(e.target.parentNode.id, array[dragged.target.parentNode.id].images[dragged.target.id].id)) {
            // Drag to sidebar
            if ( e.target.parentNode.id === "currentImage" ) {
                currentImage = array[dragged.target.parentNode.id].images[dragged.target.id];
                setImage();
            // Drag from email to email
            } else {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
            }
            if (!e.shiftKey) {
                array[dragged.target.parentNode.id].images.splice(dragged.target.id, 1);
                    if (!array[dragged.target.parentNode.id].images.length) {
                    deleteEmail(dragged.target.parentNode.id);
                }
            }
        }
        sessionStorage.setObj("array", array);
        displayArrays();
    }
    dragged = undefined;
});

// right click event to delete or refresh images (menu is supressed with CSS)
$("body").on("mousedown", async function(e) {
    // only fire on the draggable image items
    if ($(e.target).hasClass("draggable")) {
        // right mouse button
        if (event.which === 3) {
            // sidebar clicked, refresh the image
            if (e.target.parentNode.id === "currentImage") {
                await getImage();
            // other images clicked, delete them
            } else {
                array[e.target.parentNode.id].images.splice(e.target.id, 1);
                // delete the email if the last image was deleted
                if (!array[e.target.parentNode.id].images.length) {
                    deleteEmail(e.target.parentNode.id);
                }
                sessionStorage.setObj("array", array);
                displayArrays();
            }
        }
    }
});

// form submit function to add image
$("#form").submit(function(e) {
    e.preventDefault();
    // only submit if email validates
    if(validateEmail($("#form #email").val())) {
        addImage(getEmail($("#form #email").val()),  currentImage );
        displayArrays();
        if (!shiftKey) {
            getImage();
        }
    }
});

// new image button clicked
$("#newImage").on("click", async function() {
    await getImage();
});


// ==========================================================================
// Core Events
// ==========================================================================

// when the window is resized trigger the gallery event that closes it to prevent overflow
$(window).on("resize",function() {
    displayArrays();
    $('#lightbox').find('.lb-close').trigger("click");
});

// ==========================================================================
// Page Load
// ==========================================================================

$(document).ready(async function(){
    // lightbox gallery settingh
    lightbox.option({
        disableScrolling: true,
      });

    // put array on screen and fill the dropdown
    displayArrays();
    fillDropdown();

    // wait for a new image and put it on screen
    await getImage();
    // enable the form submit button (it starts disabled)
    $(`#form input[type="submit"]`).prop( "disabled", false );

});


// ==========================================================================
// Testing
// ==========================================================================

// debug function to delete the array without having to close browser
function reset() {
    showMessage("Array Deleted");
    sessionStorage.removeItem("array");
    array = [];
    displayArrays();
}