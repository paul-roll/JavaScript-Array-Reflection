// ==========================================================================
// Variables
// ==========================================================================

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

let emails = [];
let images = [];


// ==========================================================================
// Functions
// ==========================================================================

async function getImage() {
    const array = await urlToArray('https://picsum.photos/100/100');
    let html = "";
    html += `<img src="${array.image}" alt="">`;
    html += `<p>Image ID: <span id="imageID">${array.id}</span></p>`;
    $("#left").html(html);
}

function displayArrays() {
    let html = "";

    for (let emailIndex = 0; emailIndex < emails.length; emailIndex++) {
        html += `<h2>${emails[emailIndex]}</h2>`;
        html += `<div class="flex-container">`;
        for (let imageIndex = 0; imageIndex < images[emailIndex].length; imageIndex++) {
            html += `<img src="https://picsum.photos/id/${images[emailIndex][imageIndex]}/100/100">`;
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
    for (let i = 0; i < emails.length; i++) {
        if (emails[i] === email) {
            return i;
        }
    }
    emails.push(email);
    images.push([]);
    return emails.length - 1;
}

function addImage(email, image) {
    images[email].push(image);
}


// ==========================================================================
// Events
// ====================================================================

$("#form").submit(async function(e) {
    e.preventDefault();
    $(`#form input[type="submit"]`).prop( "disabled", true );
    addImage(getEmail($("#form #email").val()), $("#imageID").text());
    // $("#form #email").val("");
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

$(document).ready(function(){     
    getImage();
    displayArrays();
});


// ==========================================================================
// Testing
// ==========================================================================

