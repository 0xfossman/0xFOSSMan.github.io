// Funktionen zum ändern und speichern des Designes by 13IR115
function changeDesign(design) {
    var body = document.body;
    var tabBoxes = document.getElementsByClassName('tab_box');
    var ctlDivs = document.getElementsByClassName('ctl'); // Zugriff auf alle classes mit 'ctl'
    var iframe = document.getElementById("kopf").contentWindow;
    var links = document.getElementsByTagName("a");
    // Zugriff auf das Fenster des Iframe

    // Ändern des Body-Styles
    body.style.backgroundColor = getBackgroundColor(design);
    body.style.color = getTextColor(design);
    //iframe.style.backgroundColor = getBackgroundColor(design);
    //iframe.style.color = getTextColor(design);
    // body.style.a.color = getTextColor(design);

    // Ändern des Styles aller tab_box-Elemente
    for (var i = 0; i < tabBoxes.length; i++) {
        tabBoxes[i].style.backgroundColor = getBackgroundColor(design);
        tabBoxes[i].style.color = getTextColor(design);
    }

    // Ändern des Styles der ctl-Divs
    for (var i = 0; i < ctlDivs.length; i++) {
        ctlDivs[i].style.backgroundColor = getBackgroundColor(design);
        ctlDivs[i].style.color = getTextColor(design);
    }

    // Ändern des Styles der Link
    for(var i=0;i<links.length;i++)
    {
        if(links[i].href){links[i].style.color = getTextColor(design);}
    }  

    // Speichern des Designs im Local Storage
    localStorage.setItem('selectedDesign', design);

    // Aktuellen Design-Text aktualisieren
    var selectedDesignDisplay = document.getElementById("currentDesignDisplay");
    selectedDesignDisplay.textContent = "Aktuelles Design: " + getDesignName(design);
}

function getBackgroundColor(design) {
    switch (design) {
        case 'design1':
            return 'white';
        case 'design2':
            return 'black';
        case 'design3':
            return 'gray';
        case 'design4':
            return 'lightblue'; // Hintergrundfarbe für "Standard" (design4)
        case 'design5':
            return '#282a36';
        case 'design6':
            return'#221300';
        default:
            return 'black'; // Standardwert für nicht erwartete Designs
    }
}

function getTextColor(design) {
    switch (design) {
        case 'design1':
            return 'black';
        case 'design2':
            return '#FFFFFF';
        case 'design3':
            return 'orange';
        case 'design4':
            return 'black'; // Textfarbe für "Standard" (design4)
        case 'design5':
            return '#bd93f9';
        case 'design6':
            return '#ffa400';
        default:
            return '#777777'; // Standardwert für nicht erwartete Designs
    }
}

function getDesignName(design) {
    switch (design) {
        case 'design1':
                return 'Weiß/Schwarz';
        case 'design2':
                return 'Schwarz/Weiß';
        case 'design3':
                return 'Grau/Orange';
        case 'design4':
                return 'Türkis/Schwarz';
        case 'design5':
                return 'Dracula';
        case 'design6':
                return 'Solar Eclipse';
        default:
                return 'Schwarz/Weiß';
    }
}
// Laden des gespeicherten Designs aus dem Local Storage und Anwendung des Designs
var selectedDesign = localStorage.getItem('selectedDesign');
if (selectedDesign) {
    changeDesign(selectedDesign);
}

// Aktuelles Design anzeigen
document.addEventListener("DOMContentLoaded", function () {
    var selectedDesign = localStorage.getItem('selectedDesign');
    var selectedDesignDisplay = document.getElementById("currentDesignDisplay");
    selectedDesignDisplay.textContent = "Aktuelles Design: " + getDesignName(selectedDesign);
});


// Event Listener für Designoptionen
var designOptions = document.getElementsByClassName("designOption");
var iframe = document.getElementById("myIframe").contentWindow; // Zugriff auf das Fenster des Iframe

for (var i = 0; i < designOptions.length; i++) {
    designOptions[i].addEventListener("click", function () {
        var design = this.getAttribute("data-design");
        changeDesign(design);
        iframe.postMessage(design, "*"); // Sende das Design an das Iframe-Fenster
    });
}


openTab(1); // Tab 1 öffnen