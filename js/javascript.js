// ==========================================================================
// Variables
// ==========================================================================

const imageUrlToBase64 = async url => {
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


// ==========================================================================
// Functions
// ==========================================================================

async function  getImage() {
    return base64 = await imageUrlToBase64('https://picsum.photos/200/300');
}

async function showImage(base64) {
    const array = await base64;
    $("h1").after(`<img src=" ${array.image}" alt="">`);
    $("img").after(`<p>Image ID: ${array.id}`);
}


// ==========================================================================
// Core Events
// ==========================================================================


// ==========================================================================
// Page Load
// ==========================================================================

$(document).ready(function(){     
    showImage(getImage());
});


// ==========================================================================
// Testing
// ==========================================================================

