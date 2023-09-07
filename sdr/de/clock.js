function show(){
    var Digital=new Date()
    var hours=Digital.getUTCHours()
    var minutes=Digital.getUTCMinutes()
    var seconds=Digital.getUTCSeconds()

    if (hours>=24){
        hours="0"
        //this makes the first hour of the day display as "00" UTC (the 2nd "0" is added below).
    }
    // Add leading zeros when needed:
    if (hours<=9)
        hours="0"+hours
    if (minutes<=9)
        minutes="0"+minutes

    var LDigital=new Date()
    var l_hours=LDigital.getHours()
    var l_minutes=LDigital.getMinutes()
    var l_seconds=LDigital.getSeconds()
    if (l_hours>=24){
        l_hours="0"
        //this makes the first hour of the day display as "00" (the 2nd "0" is added below).
    }
    // Add leading zeros when needed:
    if (l_hours<=9)
        l_hours="0"+l_hours
    if (l_minutes<=9)
        l_minutes="0"+l_minutes

    // String with UTC and local time

    document.Tick.Clock.value=" "+hours+""+minutes+" UTC  "+l_hours+""+l_minutes+" Local  (Dein Rechner)               ";
    // Cycle between messages over the course of a minute

    if((seconds) < 7)
       document.Tick.Clock.value+="Nicht das ganze Band sichtbar?"
    else if(seconds < 14)
       document.Tick.Clock.value+="Versuch mal rauszuzoomen!"
    else if(seconds < 18)
       document.Tick.Clock.value+="8 USB Nachteulenrunde"  
    else if(seconds < 24)
       document.Tick.Clock.value+="8 USB Bayernrunde Sonntags ab 10:00"
    else if(seconds < 31)
       document.Tick.Clock.value+="Auf der Funkbasis sind die Wöchentlichen Listen"
    else if(seconds < 38)
       document.Tick.Clock.value+="Aktivitätenticker"
    else if(seconds < 45)
       document.Tick.Clock.value+=""
    else if(seconds < 57)
       document.Tick.Clock.value+="Hilfe benötigt? auf Youtube nach ''WebSDR bedienung'' suchen!"
    else 
       document.Tick.Clock.value+=""

    setTimeout("show()",5000)
}
    show()