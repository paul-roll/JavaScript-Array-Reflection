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
let array = sessionStorage.getObj("array") || {
    "emails": [],
    "images": [],
};


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

    for (let emailIndex = 0; emailIndex < array.emails.length; emailIndex++) {
        html += `<h2>${array.emails[emailIndex]}</h2>`;
        html += `<div id="${emailIndex}" class="flex-container">`;
        for (let imageIndex = 0; imageIndex < array.images[emailIndex].length; imageIndex++) {
            html += `<img id="${imageIndex}" src="${array.images[emailIndex][imageIndex]}">`;
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
    for (let i = 0; i < array.emails.length; i++) {
        if (array.emails[i] === email) {
            return i;
        }
    }
    array.emails.push(email);
    array.images.push([]);
    sessionStorage.setObj("array", array);
    fillDropdown();
    return array.emails.length - 1;
}

function addImage(email, image) {
    array.images[email].push(currentImage.image);
    sessionStorage.setObj("array", array);
}

function fillDropdown() {
    html = "";
    for (let i = 0; i < array.emails.length; i++) {
        html += `<option value="${array.emails[i]}">`;
    }
    $("#emailList").html(html);
}

// ==========================================================================
// Events
// ====================================================================

$("#right").on("click", function(e) {
    if (e.target.nodeName === "IMG") {
        array.images[e.target.parentNode.id].splice(e.target.id, 1);
        if (!array.images[e.target.parentNode.id].length) {
            array.emails.splice(e.target.parentNode.id, 1);
            array.images.splice(e.target.parentNode.id, 1);
            fillDropdown();
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

