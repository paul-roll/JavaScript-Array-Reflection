// ==========================================================================
// Variables and Prototypes
// ==========================================================================

Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

const urlToArray = async url => {
    const response = await fetch(url);
    if (!response.ok) {
        return {"id":-1, "image":"img/error.jpg"};
    }
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
        try {
            const imageID = response.headers.get("picsum-id");
            const reader = new FileReader() ;
            reader.readAsDataURL(blob) ;
            reader.onload = function(){ onSuccess({"id":imageID,"image":this.result}) } ;
        } catch(e) {
            onError(e);
        }
    });
};

let currentImage;


// sessionStorage.removeItem("array");
let array = sessionStorage.getObj("array") || [];

// ==========================================================================
// Functions
// ==========================================================================

async function getImage() {
    $(`#form input[type="submit"]`).prop( "disabled", true );
    currentImage = await urlToArray('https://picsum.photos/100/100');
    setImage();
    $(`#form input[type="submit"]`).prop( "disabled", false );
}

function setImage() {
    let html = "";
    html += `<img class="draggable" id="currentImage" src="${currentImage.image}" alt="">`;
    // html += `<p>Image ID: <span id="imageID">${currentImage.id}</span></p>`;
    $("#currentImage").html(html);

}

function displayArrays() {
    let html = "";

    for (let emailIndex = 0; emailIndex < array.length; emailIndex++) {
        html += `<h2>${array[emailIndex].email}</h2>`;
        html += `<div id="${emailIndex}" class="image-flexbox">`;
        for (let imageIndex = 0; imageIndex < array[emailIndex].images.length; imageIndex++) {
            html += `<img class="draggable" id="${imageIndex}" src="${array[emailIndex].images[imageIndex].image}">`;
        }
        html += `</div>`;
    }
    $("#right").html(html);
}

// Function: take string, return id of that email or -1 if not found.
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

function addImage(email, image) {
    array[email].images.push(currentImage);
    sessionStorage.setObj("array", array);
}

function fillDropdown() {
    html = "";
    for (let i = 0; i < array.length; i++) {
        html += `<option value="${array[i].email}">`;
    }
    $("#emailList").html(html);
}

function deleteEmail(id) {
    array.splice(id, 1);
    fillDropdown();
}

// ==========================================================================
// Events
// ====================================================================

let dragged;
$("body").on("dragstart", function(e) {
    if ( $(e.target).hasClass("draggable") ) {
        dragged = e;
    }
});

$("body").on("dragover", function(e) {
    e.preventDefault();  
});

$("body").on("drop", function(e) {
    if ( (dragged) && ($(e.target).hasClass("draggable")) && (e.target !== dragged.target) ) {

        if ( e.target.parentNode.id === dragged.target.parentNode.id ) {
            if ( parseInt(e.target.id) <= parseInt(dragged.target.id) ) {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
                array[dragged.target.parentNode.id].images.splice(parseInt(dragged.target.id) + 1, 1);
            } else {
                array[e.target.parentNode.id].images.splice(parseInt(e.target.id) + 1, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
                array[dragged.target.parentNode.id].images.splice(dragged.target.id, 1);
            }
        } else if (dragged.target.parentNode.id === "currentImage") {
            array[e.target.parentNode.id].images.splice(e.target.id, 0, currentImage);

            sessionStorage.setObj("array", array);
            displayArrays();

            getImage();
        } else {

            if ( e.target.parentNode.id === "currentImage" ) {
                currentImage = array[dragged.target.parentNode.id].images[dragged.target.id];
                setImage();
            } else {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.id]);
            }

            array[dragged.target.parentNode.id].images.splice(dragged.target.id, 1);
                if (!array[dragged.target.parentNode.id].images.length) {
                deleteEmail(dragged.target.parentNode.id);
            }
        }
        sessionStorage.setObj("array", array);
        displayArrays();
    }
    dragged = undefined;
});

$("body").on("dblclick", function(e) {
    if ($(e.target).hasClass("draggable")) {

        if (e.target.parentNode.id === "currentImage") {
            getImage();
        } else {
            array[e.target.parentNode.id].images.splice(e.target.id, 1);
            if (!array[e.target.parentNode.id].images.length) {
                deleteEmail(e.target.parentNode.id);
            }
            sessionStorage.setObj("array", array);
            displayArrays();
        }
    } 
});

$("#form").submit(function(e) {
    e.preventDefault();
    addImage(getEmail($("#form #email").val()),  currentImage );
    displayArrays();
    getImage();
});


// ==========================================================================
// Core Events
// ==========================================================================


// ==========================================================================
// Page Load
// ==========================================================================

$(document).ready(async function(){     
    await getImage();
    $(`#form input[type="submit"]`).prop( "disabled", false );
    displayArrays();
    fillDropdown();
});


// ==========================================================================
// Testing
// ==========================================================================

// sessionStorage.removeItem("array");