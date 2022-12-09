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
    currentImage = await urlToArray('https://picsum.photos/100/100');
    setImage();
}

function setImage() {
    let html = "";
    html += `<img id="currentImage" src="${currentImage.image}" alt="">`;
    html += `<p>Image ID: <span id="imageID">${currentImage.id}</span></p>`;
    $("#left").html(html);
}

function displayArrays() {
    let html = "";

    for (let emailIndex = 0; emailIndex < array.length; emailIndex++) {
        html += `<h2>${array[emailIndex].email}</h2>`;
        html += `<div id="${emailIndex}" class="flex-container">`;
        for (let imageIndex = 0; imageIndex < array[emailIndex].images.length; imageIndex++) {
            html += `<img id="${imageIndex}" src="${array[emailIndex].images[imageIndex]}">`;
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
    array[email].images.push(currentImage.image);
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
$("#right").on("dragstart", function(e) {
    dragged = [];
    dragged[0] = e.target.parentNode.id;
    dragged[1] = e.target.id;
});

$("#right").on("dragover", function(e) {
    e.preventDefault();  
});

$("#right").on("drop", function(e) {
    if ( (dragged) && (e.target.nodeName === "IMG") ) {
        console.log( `${dragged[0]}-${dragged[1]} to ${e.target.parentNode.id}-${e.target.id}` );


        if ( e.target.parentNode.id === dragged[0] ) {
            if ( parseInt(e.target.id) <= parseInt(dragged[1]) ) {
                array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged[0]].images[dragged[1]]);
                array[dragged[0]].images.splice(parseInt(dragged[1]) + 1, 1);
            } else {
                array[e.target.parentNode.id].images.splice(parseInt(e.target.id) + 1, 0, array[dragged[0]].images[dragged[1]]);
                array[dragged[0]].images.splice(dragged[1], 1);
            }
        } else {
            array[e.target.parentNode.id].images.splice(e.target.id, 0, array[dragged[0]].images[dragged[1]]);
            array[dragged[0]].images.splice(dragged[1], 1);
                if (!array[dragged[0]].images.length) {
                deleteEmail(dragged[0]);
            }
        }
        sessionStorage.setObj("array", array);
        displayArrays();
    }
    dragged = undefined;
});


$("#right").on("dblclick", function(e) {
    if (e.target.nodeName === "IMG") {
        array[e.target.parentNode.id].images.splice(e.target.id, 1);
        if (!array[e.target.parentNode.id].images.length) {
            deleteEmail(e.target.parentNode.id);
        }
        sessionStorage.setObj("array", array);
        displayArrays();
    } 
});

$("#form").submit(async function(e) {
    e.preventDefault();
    $(`#form input[type="submit"]`).prop( "disabled", true );
    addImage(getEmail($("#form #email").val()),  currentImage.image );
    displayArrays();
    await getImage();
    $(`#form input[type="submit"]`).prop( "disabled", false );
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