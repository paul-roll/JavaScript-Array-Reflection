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
        return {"id":-1, "image":"images/error.jpg"};
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
let messageBusy = false;


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
    html += `
        <a href="https://picsum.photos/id/${currentImage.id}/${window.innerWidth}/${window.innerHeight}" data-lightbox="current" data-title="Image ID: ${currentImage.id}">
            <img oncontextmenu="return false;" class="draggable" id="currentImage" src="${currentImage.image}" alt="">
        </a>
    `;
    $("#currentImage").html(html);

}

function displayArrays() {
    let html = "";

    if (!array.length) {
        html += `
            <h2>The array is empty!</h2>
            <p>Submit some images to get started</p>
        `;
    } else {
        for (let emailIndex = 0; emailIndex < array.length; emailIndex++) {
            html += `<h2>${array[emailIndex].email}</h2>`;
            html += `<div id="${emailIndex}" class="image-flexbox">`;
            for (let imageIndex = 0; imageIndex < array[emailIndex].images.length; imageIndex++) {
                html += `
                    <a href="https://picsum.photos/id/${array[emailIndex].images[imageIndex].id}/${window.innerWidth}/${window.innerHeight}" data-lightbox="image-${emailIndex}" data-title="Image ID: ${array[emailIndex].images[imageIndex].id}">
                        <img oncontextmenu="return false;" class="draggable" id="${imageIndex}" src="${array[emailIndex].images[imageIndex].image}">
                    </a>
                `;
            }
            html += `</div>`;
        }
    }
    $("#main").html(html);
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


function showMessage(message) {
    if (!messageBusy) {
        messageBusy = true;
        $("#message").html(message);
        $("#message").slideDown(500).delay(2000).slideUp(500, function() {
            messageBusy = false;
        });

    }
}

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
    } else if (!email.match(/^[a-zA-Z0-9-!#$%&'*+.\/=?@^_`{|}~]+@[a-zA-Z0-9-.]+\.[a-zA-Z]{2,}$/)) {   // Far from perfect, catches the general format of emails
        showMessage("Invalid Email");
    } else {
        return true;
    }
}


// ==========================================================================
// Events
// ====================================================================

let dragged;
$("body").on("dragstart", function(e) {
    if ( $(e.target.children[0]).hasClass("draggable") ) {
        dragged = e;
    }
});

$("body").on("dragover", function(e) {
    e.preventDefault();  
});

$("body").on("drop", function(e) {
    if ( (dragged) && ($(e.target).hasClass("draggable")) && (e.target !== dragged.target.children[0]) ) {
        if ( e.target.parentNode.parentNode.id === dragged.target.parentNode.id ) {
            if ( parseInt(e.target.id) <= parseInt(dragged.target.children[0].id) ) {
                array[e.target.parentNode.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.children[0].id]);
                array[dragged.target.parentNode.id].images.splice(parseInt(dragged.target.children[0].id) + 1, 1);
            } else {
                array[e.target.parentNode.parentNode.id].images.splice(parseInt(e.target.id) + 1, 0, array[dragged.target.parentNode.id].images[dragged.target.children[0].id]);
                array[dragged.target.parentNode.id].images.splice(dragged.target.children[0].id, 1);
            }
        } else if (dragged.target.parentNode.id === "currentImage") {
            array[e.target.parentNode.parentNode.id].images.splice(e.target.id, 0, currentImage);

            sessionStorage.setObj("array", array);
            displayArrays();

            getImage();
        } else {

            if ( e.target.parentNode.parentNode.id === "currentImage" ) {
                currentImage = array[dragged.target.parentNode.id].images[dragged.target.children[0].id];
                setImage();
            } else {
                array[e.target.parentNode.parentNode.id].images.splice(e.target.id, 0, array[dragged.target.parentNode.id].images[dragged.target.children[0].id]);
            }

            array[dragged.target.parentNode.id].images.splice(dragged.target.children[0].id, 1);
                if (!array[dragged.target.parentNode.id].images.length) {
                deleteEmail(dragged.target.parentNode.id);
            }
        }
        sessionStorage.setObj("array", array);
        displayArrays();
    }
    dragged = undefined;
});

$("body").on("mousedown", async function(e) {
    if ($(e.target).hasClass("draggable")) {
        if (event.which === 3) {
            if (e.target.parentNode.parentNode.id === "currentImage") {
                await getImage();
            } else {
                array[e.target.parentNode.parentNode.id].images.splice(e.target.id, 1);
                if (!array[e.target.parentNode.parentNode.id].images.length) {
                    deleteEmail(e.target.parentNode.parentNode.id);
                }
                sessionStorage.setObj("array", array);
                displayArrays();
            }
        }
    }
});

$("#form").submit(function(e) {
    e.preventDefault();
    if(validateEmail($("#form #email").val())) {
        addImage(getEmail($("#form #email").val()),  currentImage );
        displayArrays();
        getImage();
    }
});

$("#newImage").on("click", async function() {
    await getImage();
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
// showMessage("Generating new image");