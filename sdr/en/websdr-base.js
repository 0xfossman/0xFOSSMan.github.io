var qqq=-1;
// WebSDR JavaScript part
// Copyright 2007-2014, Pieter-Tjerk de Boer, pa3fwm@websdr.org; all rights reserved.
// Naturally, distributing this file by the original WebSDR server software to original WebSDR clients is permitted.

//
// *******   IMPORTANT - SEE "websdr-band_configs.js" for per-band configuration of waterfall/smeter calibration, default zooming, mode, frequency, and sample rate correction

// variables governing what the user listens to:
var lo=-2.7,hi=-0.3;   // edges of passband, in kHz w.r.t. the carrier
var mode="LSB";            // 1 if AM, 0 otherwise (SSB/CW); or text "AM", "FM" etc
var old_mode="";       // used to detect mode change
var band=0;            // id of the band we're listening to
var oldband = 0;       // used to detect change of band
var freq=bandinfo[0].vfo;  // frequency (of the carrier) in kHz
var memories = [ ];
var audbtn_txt="";     // Part of informing user that button may need to be pressed to get audio
var abtn_flag=0;

// used to set larger audio buffer than default
var buffinit=0;
// used to coordinated sequences that should occur only once, when changing bands
var bchange=0;

// variables governing what the user sees:

var Views={ allbands:0, othersslow:1, oneband:2, blind:3 };
var view=Views.oneband;  // Was Views.blind;  KA7OEI 20180110
var nwaterfalls=0;
var waterslowness=8;  // Originally 4 - KA7OEI 20180110
//BANDWIDTH EMERGENCY
//var waterslowness=16;

var waterheight=100;
var watermode=1;
var scaleheight=14;



// information about the available "virtual" bands:
// contains: effsamplerate, effcenterfreq, zoom, start, minzoom, maxzoom, samplerate, centerfreq, vfo, scaleimgs, realband
var bi = new Array();
// number of bands:
var nvbands=nbands;

// references to objects on the screen:
var scaleobj;
var scaleobjs = new Array();
var scaleimgs0 = new Array();
var scaleimgs1 = new Array();
var passbandobj;
var edgelowerobj;
var edgeupperobj;
var carrierobj;
var smeterobj;
var numericalsmeterobj;
var smeterpeakobj;
var numericalsmeterpeakobj;
var kbnm="";
var bdnm="";
var waterfallapplet = new Array();
var soundapplet = null;

// timers:
var interval_updatesmeter;
var interval_ajax3;
var timeout_idle;
var setfreqif_fut_timer;  // timer for typing in the frequency field
var ltomult=3;  //Multiplier for idle timer w/lto



// misc
var serveravailable=-1;  // -1 means yet to be tested, 0 and 1 mean false and true
var smeterpeaktimer=2;
var smeterpeak=0;    
var smeterexp=0;
var smeterhold=0;
var allloadeddone=false;
var waitingforwaterfalls=0;  // number of waterfallapplets that are still in the process of starting
var band_fetchdxtimer=new Array();
var hidedx=0;
var usejavawaterfall=1;
var usejavasound=1;
var javaerr=0;
var isTouchDev = false;
var is_mute = false;
var mute_stat = " ";
var vfoval="A";		// VFO A/B holders
var vfo_info="A";
var vfo_alt="B";
var vfoa_freq=-999;		// Holders for VFO A and B
var vfob_freq=-999;
var mode_a="";			// Mode holders for VFO A and B
var mode_b="";
var ltotrue=0;                 // indicate LTO
var url_tune=0;			// set TRUE if the frequency/mode was specified in the URL upon startup
var url_zoom=0;			// Used with URL-specified zoom
var init_zoomlevel=-1		// used in conjunction with URL-specified zoom level
var init_squelch=-1;		// used in conjunction with URL-specified squelch state setting
var dxlabelcount=10;             // delay on start-up to force turn-on of labels
var nodxlabel=0;		// "no dx labels" is false by default (e.g. there will be DX labels)
var freq_server=0;
var hookparam_init=0;
var do10hz=0;			// True if frequency is to be displayed with 10 Hz resolution (via URL)
var do_usbcw=0;			// True if CW is to be received on USB instead of LSB (via URL)
var do_kbd=0;			// True if keyboard control is to be allowed (via URL)
var aud_chan=0;			// Used to URL-configure audio channel

// derived quantities:
var khzperpixel=bandinfo[band].samplerate/1024;
var passbandobjstart=0;    // position (in pixels) of start of passband on frequency axis, w.r.t. location of carrier
var passbandobjwidth=0;    // width of passband in pixels
var centerfreq=bandinfo[band].centerfreq;

////////////////////////////////
// control panel
////////////////////////////////


function debug(a)
{
//   console.debug(a);
}


// from http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel
function cancelEvent(e)
{
  e = e ? e : window.event;
  if(e.stopPropagation) e.stopPropagation();
  if(e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.cancel = true;
  e.returnValue = false;
  return false;
}


function timeout_idle_do()
{
   try { clearInterval(interval_updatesmeter); } catch (e) {} ;
   try { clearTimeout(interval_ajax3); } catch (e) {} ;
   var i;
   try { for (i=0;i<nwaterfalls;i++) waterfallapplet[i].destroy(); } catch (e) {} ;
   try { soundapplet.destroy(); } catch (e) {};
   // made the idle time-out message more informative.  KA7OEI - 20180301
   var ltoflg=1;
   if(ltotrue) ltoflg=ltomult;
   document.body.innerHTML="Idle timeout due to lack of user activity. \nThe system hasn't seen any input from you (tuning, waterfall, adjustment, etc.) for more than "+(idletimeout/60000*ltoflg)+" minutes.\n";
}


function timeout_idle_restart()
{
   if (!idletimeout) return;
   try { clearTimeout(timeout_idle); } catch(e) {};
   if(!ltotrue)  timeout_idle=setTimeout('timeout_idle_do();',idletimeout);
   else   timeout_idle=setTimeout('timeout_idle_do();',idletimeout*ltomult);
}

function send_soundsettings_to_server()
{
  var n=encodeURIComponent(document.usernameform.username.value)
  if(n) n=n.replace(/[^ -~]/g, "");
  if(bdnm!="") n=bdnm;
  kbnm=n;
  //
  // do sample rate correction - KA7OEI 20201213
  var frq=freq;  // get desired tuner frequency
  frq+=freq_corr[band]/1000;  // frequency offset correction from "band-config.js"
  var e=bi[band];  // get band data
  var c=e.centerfreq;  // get center frequency of the band
  var af=frq-c;   // calculate audio frequency
  af=af*sr_corr[band];   // apply sample rate correction to audio frequency
  frq = c+af;     // calculate tuner frequency from rate-corrected audio frequency
  //
  frq+=sam_offset;  // offset for synchronous detector (when active) to put carrier into passband - must be "invisible" to user
  var fff=frq-Math.trunc(frq);  // extract decimal fraction
  var tstep=bi[band].tuningstep*1000;

  var fff3=fff*1000%tstep;      // convert to Hz and do modulus of the tuning step

  if(fff3>tstep/2)  {   // is the current frequency in the upper half of the frequency step?
     var fff4=fff3-tstep;
     var fff5=tstep/1000;
  }
  else  {
     var fff4=fff3;
     var fff5=0;
  }
  //  
  if(mode=="USB")   shift_afreq(fff4);	// apply audio shift for fraction
  else if((mode=="LSB") || (mode=="CW"))  shift_afreq(-fff4);	// apply audio shift for fraction - backwards in LSB and CW (which uses LSB)

  frq=frq-(fff3/1000) + fff5; // send only increments of tuning step to server to avoid rounding off

  freq_server=frq;   // save copy of frequency
  //
  //
  var m=mode;
  if (m=="USB") m=0,set_ssb_stepbutton();
  else if (m=="LSB") m=0,set_ssb_stepbutton();
  else if (m=="CW") m=0,set_ssb_stepbutton();
  else if (m=="AM") m=1,set_am_stepbutton();
  else if (m=="FM") m=4,set_fm_stepbutton();
  try {
     soundapplet.setparam(
         "f="+frq
        +"&band="+band
        +"&lo="+lo
        +"&hi="+hi
        +"&mode="+m
//        +"&name="+encodeURIComponent(document.usernameform.username.value) 
        +"&name="+n
        );
  } catch (e) {};

  agc_reset=1;  // Reset "alt_agc" if frequency is changed
  force_unlock();	// force unlock if in SAM when frequency is changed

// send mode to allow de-emphasis to be used for FM

  timeout_idle_restart()

  vfo_ab(9);  // Update VFO holders
}



function draw_passband()
{
   passbandobjstart=Math.round((lo-0.045)/khzperpixel);
   passbandobjwidth=Math.round((hi+0.045)/khzperpixel)-passbandobjstart;
   if (passbandobjwidth == 0) passbandobjwidth = 1;
   passbandobj.style.width=passbandobjwidth+"px";
   if (!scaleobj) return;

   var x=(freq-centerfreq)/khzperpixel+512;
   var maxx = parseInt(scaleobj.style.width);
   if (isTouchDev && x > maxx) x = maxx;
   var y=scaleobj.offsetTop+15;
   passbandobj.style.top=y+"px";
   edgelowerobj.style.top=y+"px";
   edgeupperobj.style.top=y+"px";
   carrierobj.style.top=y+"px";
   carrierobj.style.left=x+"px";
   x=x+passbandobjstart;
   passbandobj.style.left=x+"px";
   edgelowerobj.style.left=(x-11)+"px";
   edgeupperobj.style.left=(x+passbandobjwidth)+"px";
}


function iscw()
{
   return hi-lo < 1.0;
}

function nominalfreq()
{
   if (iscw()) return freq+(hi+lo)/2;

   return freq;
}

function freq2x(f,b)
{
   return (f-bi[b].effcenterfreq)*1024/bi[b].effsamplerate+512;
}

function setwaterfall(b,f)
// adjust waterfall so passband is visible
{
   if (waitingforwaterfalls>0) return;
   var x = freq2x(f,b);
   if (x<0 || x>=1024) wfset_freq(b, bi[b].zoom, f);
}


function dx(freq,mode,text)
// called by updates fetched from the server
{
   dxs.push( { freq:freq, mode:mode, text:text } );
}

function setfreqm(b,f,mo)
{
   setband(b);
   set_mode(mo);
   //
   if((mo=="sam-l") || (mo=="sl")) {
      set_syncam("sam-l");
      mo="sam-l";
   }
   else if((mo=="sam-u") || (mo=="su")) {
      set_syncam("sam-u");
      mo="sam-u";
   }
   //
   if (iscw()) f-=(hi+lo)/2;
   setfreq(f);
   lmode=mo;
}


function showdx(b)
{
   var s='';
   if (!hidedx) {
      var mems=memories.slice();
      for (i=0;i<mems.length;i++) mems[i].nr=i;
      mems.sort(function(a,b){return a.nomfreq-b.nomfreq});
      for (i=0;i<dxs.length;i++) {
         var x = freq2x(dxs[i].freq,b);
         var nextx;
         if (x>1024) break;
         if (i<dxs.length-1) nextx=freq2x(dxs[i+1].freq,b);
         else nextx=1024;
         if (nextx>=1024) nextx=1280;
         if (x<0) continue;
         var fr=dxs[i].freq;
         var mo=dxs[i].mode;
// Offset DX tag text:  Place "tilde" (~) at END of tag followed by number of pixels to shift to the LEFT  (KA7OEI 20200121)
//

	var dxtext=dxs[i].text;
	var j=0;
	var sx=0;
	//
	j = dxtext.indexOf("~");	// look for tilde (~)
	if(j>0)	{	// was is present?
           var offs=dxtext.substring(j+1);	// extract portion after tilde (number of pixels to shift left)
           var offval=offs.match(/\d+/g);	// extract number
	   //
	   if(offval < 0) 			// limit results
	      offval = 0;
	   else if(offval > 125)
	      offval = 125;
	   //
           sx=x-offval;				// offset "X" position
	    if(sx<0) sx=0;
           dxtext=dxtext.substring(0,j);	// remove portion before tilde
	}
	else	{
	   sx=x;
	   dxtext=dxs[i].text;
	}
//
         s+='<div title="" class="statinfo2" style="max-width:'+(nextx-sx)+'px;left:'+(sx-6)+'px;top:'+(44-scaleheight)+'px;">';
         s+='<div class="statinfo1"><div class="statinfo0" onclick="setfreqm(b,'+fr+','+"'"+mo+"'"+');"><small>'+dxtext+'</small><\/div><\/div><\/div>';
         s+='<div title="" class="statinfol" style="width:1px;height:44px;position:absolute;left:'+x+'px;top:-'+scaleheight+'px;"><\/div>';
      }
      for (i=0;i<mems.length;i++) if (mems[i].band==b) {
         var x=freq2x(mems[i].nomfreq,b);
         var nextx;
         if (x>1024) break;
         if (i<mems.length-1) nextx=freq2x(mems[i+1].nomfreq,b);
         else nextx=1024;
         if (nextx>=1024) nextx=1280;
         if (x<0) continue;
         var fr=mems[i].freq;
         var mo=mems[i].mode;
         s+='<div title="" class="statinfo2l" style="max-width:'+(nextx-x)+'px;left:'+(x-6)+'px;top:'+(64-scaleheight)+'px;">';
         var l=mems[i].label;
         if (!l || l=='') l='mem '+mems[i].nr;
         s+='<div class="statinfo1l"><div class="statinfo0l" onclick="setfreqm(b,'+fr+','+"'"+mo+"'"+');">'+l+'<\/div><\/div><\/div>';
         s+='<div title="" class="statinfoll" style="width:1px;height:64px;position:absolute;left:'+x+'px;top:-'+scaleheight+'px;"><\/div>';
      }
   }
   document.getElementById('blackbar'+band2id(b)).innerHTML=s;
   if (s!='') {
      document.getElementById('blackbar'+band2id(b)).style.height='78px';
   } else {
      document.getElementById('blackbar'+band2id(b)).style.height='30px';
   }
}

function fetchdx(b)
{
  var xmlHttp;
  try { xmlHttp=new XMLHttpRequest(); }
    catch (e) { try { xmlHttp=new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) { try { xmlHttp=new ActiveXObject("Microsoft.XMLHTTP"); }
        catch (e) { alert("Dein Browser unterstützt nicht AJAX!"); return false; } } }
  xmlHttp.onreadystatechange=function()
    {
    if(xmlHttp.readyState==4)
      {
        if (xmlHttp.responseText!="") {
          eval(xmlHttp.responseText);
          showdx(b);
        }
      }
    }
  var url="/~~fetchdx?min="+(bi[b].effcenterfreq-bi[b].effsamplerate/2)+"&max="+(bi[b].effcenterfreq+bi[b].effsamplerate/2);
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
}


function setscaleimgs(b,id)
{
   var e=bi[b];
   var st=e.start>>(e.maxzoom-e.zoom);
   if (st<0) scaleimgs0[id].src="scaleblack.png";
   else scaleimgs0[id].src = e.scaleimgs[e.zoom][st>>10];
   if (e.scaleimgs[e.zoom][1+(st>>10)]) scaleimgs1[id].src = e.scaleimgs[e.zoom][1+(st>>10)];
   else scaleimgs1[id].src="scaleblack.png";
   st+=1024;
   scaleimgs0[id].style.left = (-(st%1024))+"px";
   scaleimgs1[id].style.left = (1024-(st%1024))+"px";
}


// this function is called from java when the scrollwheel is moved to change the zoom
function zoomchange(id,zoom,start)
{
   var b=id2band(id);
   var e=bi[b];
   var oldzoom=e.zoom;
   e.effsamplerate = e.samplerate/(1<<zoom);
   e.effcenterfreq = e.centerfreq - e.samplerate/2 + (start*(e.samplerate/(1<<e.maxzoom))/1024) + e.effsamplerate/2;
   e.zoom=zoom;
   e.start=start;
   setscaleimgs(b,id);
   if (b==band) {
      khzperpixel = bi[band].effsamplerate/1024;
      centerfreq = bi[band].effcenterfreq;
      updbw();
   }
   if (!hidedx) {
      clearTimeout(band_fetchdxtimer[b]);
      if (zoom!=oldzoom) {
         dxs=[]; document.getElementById('blackbar'+id).innerHTML=""; 
         fetchdx(b);
      } else {
         {
            showdx(b);
            band_fetchdxtimer[b] = setTimeout('dxs=[]; fetchdx('+b+');',400);
         }
      }
   }
}


var dont_update_textual_frequency=false;

function setfreq(f)
{
   try { clearTimeout(setfreqif_fut_timer); } catch (e) {} ;
   freq=f;
   //
   show_vfo_info();
   //

   document.getElementById("dummyforie").style.display = 'none'; document.getElementById("dummyforie").style.display = 'block';  // utter nonsense, but forces IE8 to update the screen :(
   send_soundsettings_to_server();
   if (view!=Views.blind) draw_passband();
   if (dont_update_textual_frequency) return;
   var nomfreq=nominalfreq();
   var freqfix=3;
   if(do10hz)  freqfix=2;
   if (freq.toFixed) document.freqform.frequency.value=nomfreq.toFixed(freqfix);
   else document.freqform.frequency.value=nomfreq+" kHz";


}

function setfreqb(f)
// sets frequency but also autoselects band
{
   if (iscw()) f-=(hi+lo)/2;
   var e=bi[band];
   if (f>e.centerfreq-e.samplerate/2-4 && f<e.centerfreq+e.samplerate/2+4) {
      // new frequency is in the current band
      setwaterfall(band,f);
      setfreq(f);
      return;
   }
   // new frequency is not in the current band: then search through all bands until we find the right one (if any)
   for (i=0;i<nvbands;i++) {
      e=bi[i];
      c=e.centerfreq;
      w=e.samplerate/2+4;
      if (f>c-w && f<c+w) {
         e.vfo=f;
         setband(i);
         return;
      } 
   }
}



function setfreqif(str)
// called when frequency is entered textually
{
   f=parseFloat(str);
   if(typeof from_mhz_freq !== 'undefined') {	// enable if defined - also solves problem with "websdr-band_configs" loading after this file
      if(from_mhz_freq && (f<from_mhz_freq)) {
	   f*=1000;	// Convert to kHz if a number < "from_mhz_freq" is entered
           str=f.toFixed(2);
      }
   }
   if (!(f>0)) return;
   dont_update_textual_frequency=true;
   setfreqb(f);
   dont_update_textual_frequency=false;
   document.freqform.frequency.value=str;
}

function setfreqif_fut(str)
// called when typing in the frequency field; schedules a frequency update in the future, in case no more key presses follow soon
{
   try { clearTimeout(setfreqif_fut_timer); } catch (e) {} ;
   setfreqif_fut_timer = setTimeout('setfreqif('+str+')',3000);
   url_tune = 1;   // cancel "freq_once" auto tuning if frequency manually entered
}

// added a function to switch to a frequency directly by 13IR115
function setFrequency(frequency, mode) {
   if (iscw()) frequency -= (hi + lo) / 2;
   var e = bi[band];
   if (frequency >= e.centerfreq - e.samplerate / 2 - 4 && frequency <= e.centerfreq + e.samplerate / 2 + 4) {
      // Neue Frequenz liegt im aktuellen Band
      setwaterfall(band, frequency);
      setfreq(frequency);
      setMode(mode);
      return;
   }
   // Neue Frequenz liegt nicht im aktuellen Band: Durchsuche alle Bänder, bis das richtige (falls vorhanden) gefunden wird
   for (i = 0; i < nvbands; i++) {
      e = bi[i];
      c = e.centerfreq;
      w = e.samplerate / 2 + 4;
      if (frequency >= c - w && frequency <= c + w) {
         e.vfo = frequency;
         setband(i);
         setMode(mode);
         return;
      }
   }
}
// added a function to switch to a frequency directly by 13IR115
function setMode(mode) {
   switch (mode.toUpperCase()) {
      case "USB":
         setmf("usb", 0.15, 2.86);
         break;
      case "LSB":
         setmf("lsb", -2.86, -0.15);
         break;
      case "AM":
         setmf("am", -4, 4);
         break;
      case "CW":
         setmf("cw", -0.95, -0.55);
         break;
      case "FM":
         setmf("fm", -5.5, 5.5);
         break;
      case "SAM-U":
         set_syncam("sam-u");
         break;
      case "SAM-L":
         set_syncam("sam-l");
         break;
   }
}
// added a function to switch to a frequency directly by 13IR115
function setFrequencyAndMode(frequency, mode) {
   setFrequency(frequency, mode);
}

function setmf(m, l, h)   // "set mode and filter"
{
   mode=m.toUpperCase();
   if(mode=="FM")   {
      // Force "RF AGC" button checked and bail out if in FM mode
      try { document.getElementById("id_autogain").checked = true;  } catch(e) {};
      set_agcmode(10000);	// force to RF AGC mode
      is_ssb=0;
   }
   else if(mode=="AM")   {
      gaincomp=gaincomp_am;	// set gain compensation value for AM
      is_ssb=0;
   }
   else if ((mode=="USB") || (mode=="LSB") || (mode=="CW") || (mode=="SAM-L") || (mode=="SAM-U")) {
      gaincomp=gaincomp_ssb; 	// set gain compensation value for SSB/CW
      is_ssb=1;
      //
      if(mode=="SAM-L") mode="LSB";
      else if(mode=="SAM-U") mode="USB";
   }
   //
   if(mode=="CW")   {
	if(do_usbcw) {		// Do CW with USB?
                var tl = l;	// Yes - Hi and Lo need to be swapped - temp variable
		l=Math.abs(h);	// Remove negative number
                h=Math.abs(tl);
	}
   }
   //
   if((mode !="SAM-L") && (mode != "SAM-U")) {
      sam_offset=0;
      set_sam(0);
   }

   gainvar=gaincomp;
   //
   lo=l;
   hi=h;
   updbw();
}

function set_mode(m)      // ...with appropriate filter
{
   switch (m.toUpperCase()) {
// Modified default USB/LSB a.l.a. KFS WebSDR - KA7OEI 20180304
      // case "USB": setmf("usb", 0.3,  2.7); break;
      //case "LSB": setmf("lsb", -2.7, -0.3); break;
      case "USB": setmf("usb", 0.15,  2.86); break;
      case "LSB": setmf("lsb", -2.86, -0.15); break;
      case "AM":  setmf("am", -4,  4); break;
      case "CW":  setmf("cw", -0.95,  -0.55); break;
      case "FM":  setmf("fm", -5.5,  5.5); break;
      case "SAM-U":  set_syncam("sam-u"); break;
      case "SAM-L":  set_syncam("sam-l"); break;

//      case "FM":  setmf("fm", -8,  8); break;
   }
}


function freqstep(st)
// do a frequency step, suitable for the current mode
// sign of st indicates direction
// magnitude of st is 1,2 or 3 for small, medium, or large step, with large being one channel (where applicable)
{
   var f=nominalfreq();
   
// Added 20180214 - KA7OEI - Code for the "= kHz" button
// "st" == "9" means to "snap" to the nearest integer kHz frequency

   if (st == "9") {
      if(mode=="CW") {
         f = Math.round(f);
         setfreq(f-(hi+lo)/2);
      }
      else  {
         f = Math.round(f);
         setfreq(f);
      }
   }
   else {
//    var steps_ssb= [bandinfo[band].tuningstep, 0.5, 2.5 ];
    var steps_ssb= [0.001, 0.01, 0.05, 0.5, 2.5 ];

    var steps_am5= [0.1, 1, 5, 10, 50];
//   var steps_am9= [0.1, 1, 9, 0, 50];
// Added 10 kHz steps for U.S. MWBC bandplan  - 20180220 KA7OEI
   var steps_am10= [0.1, 1, 5, 10, 50];
    var steps_fm= [1, 5, 10, 12.5, 50 ];
    var steps=steps_ssb;

    var grid=false;
    var i=Math.abs(st)-1;   
    if (mode=="AM") {
	// added 10 kHz steps for U.S. MWBC bandplan - 20180220 KA7OEI
      if (freq<1800) steps=steps_am10; else steps=steps_am5;
//      if (freq<1800) steps=steps_am9; else steps=steps_am5;
       if (i>=1) grid=true;
    }
    if (mode=="FM") {
       steps=steps_fm;

       if (i>=1) grid=true;
    }
    var d=steps[i];
    var f=(st>0)?f:-f;
    if (!grid) f=f+d;
    else f=d*Math.ceil(f/d+0.1);
    f=(st>0)?f:-f;
    if (iscw()) f-=(hi+lo)/2;
    // limit frequency when tuning to current band - KA7OEI 20180222
    setfreq_lim(f);
   }
}


    // limit frequency when tuning to current band - KA7OEI 20180222
function setfreq_lim(f)
{
    // Prevent from tuning out of currently-set band - KA7OEI 20180220 
    if(f >(bandinfo[band].centerfreq + (bandinfo[band].samplerate/2) + bandinfo[band].maxlinbw))
	f = bandinfo[band].centerfreq + (bandinfo[band].samplerate/2) + bandinfo[band].maxlinbw;
    else if(f <(bandinfo[band].centerfreq - (bandinfo[band].samplerate/2) - bandinfo[band].maxlinbw))
	f = bandinfo[band].centerfreq - (bandinfo[band].samplerate/2) - bandinfo[band].maxlinbw;
    //
    // prevent negative frequency from being set - KA7OEI 20180220
    if(f<0) f = 0;
    //
    setfreq(f);
}


function setfreqtune(s)
{
   var param = new RegExp("([0-9.]*)([^&#]*)").exec(s);
   if (!param[1]) return;
   if (param[2]) set_mode(param[2]);
   setfreqif(param[1]);
}



function mem_recall(i)
{
   setband(memories[i].band);
   mode=memories[i].mode;
   lo=memories[i].lo;
   hi=memories[i].hi;
   updbw();
   setfreq(memories[i].freq);
   setwaterfall(band,memories[i].freq);
}

function mem_erase(i)
{
   var b=memories[i].band;
   memories.splice(i,1);
   mem_show();
   showdx(b);
   try { localStorage.setItem('memories',JSON.stringify(memories)); } catch (e) {};
}

function mem_store(i)
{
   var nomf=nominalfreq();
   var l;
   try { l=memories[i].label;} catch(e){ l=''; };
   memories[i]={freq:freq, nomfreq:nomf, band:band, mode:mode, lo:lo, hi:hi, label:l };
   mem_show();
   showdx(memories[i].band);
   try { localStorage.setItem('memories',JSON.stringify(memories)); } catch (e) {};
}

function mem_label(i,nw)
{
   memories[i].label=nw;
   showdx(memories[i].band);
   try { localStorage.setItem('memories',JSON.stringify(memories)); } catch (e) {};
}

function mem_show()
{
   var i;
   var s="";
   for (i=0;i<memories.length;i++) {
      var m="";
      m=memories[i].mode;
      s+='<tr>';
      s+='<td><input type="button" title="recall" value="recall" onclick="mem_recall('+i+')"><input type="button" title="erase" value="erase" onclick="mem_erase('+i+')"><input type="button" title="store" value="store" onclick="mem_store('+i+')"></td>';
      s+='<td>'+memories[i].nomfreq.toFixed(2)+' kHz '+m+'</td>';
      s+='<td><input title="label for this memory location" type="text" size=6 onchange="mem_label('+i+',this.value)" value="'+memories[i].label+'"></td>';
      s+='</tr>';
   }
   s+='<tr>';
   s+='<td><input type="button" disabled title="recall" value="recall" onclick="mem_recall('+i+')"><input type="button" disabled title="erase" value="erase" onclick="mem_erase('+i+')"><input type="button" title="store" value="store" onclick="mem_store('+i+')"></td>';
   s+='<td>(new)</td>';
   s+='</tr>';
   document.getElementById('memories').innerHTML='<table>'+s+'</table>';
}



function wfset_freq(b, zoom, f)
{
   // set waterfall for band 'b' to given zoomlevel and centerfrequency
   var id=band2id(b);
   var e=bi[b];
   var effsamplerate = e.samplerate/(1<<zoom);
   var start = ( f - e.centerfreq + e.samplerate/2 - effsamplerate/2 )*1024/(e.samplerate/(1<<e.maxzoom));
   waterfallapplet[id].setzoom(zoom, start);
   timeout_idle_restart()
   force_unlock();	// force SAM unlock when zooming
}

function wfset(cmd)
{
   var b=band;
   var e=bi[b];
   var id=band2id(b);
   timeout_idle_restart()
   if (cmd==0) {
      // zoom in
// modified to zoom on tuned frequency when zooming in - KA7OEI 20180222
      var x=(freq-centerfreq)/khzperpixel+512;
      //var x=512;
      waterfallapplet[id].setzoom(-2, x);
      return;
   }
   if (cmd==1) {
      // zoom out
      //var x=(freq-centerfreq)/khzperpixel+512;
      var x=512;
      waterfallapplet[id].setzoom(-1, x);
      return;
   }
   if (cmd==2) {
      // zoom in deep with current listening frequency centered
      wfset_freq(b, e.maxzoom, freq);
   }
   if (cmd==4) {
      // zoom fully out
      waterfallapplet[id].setzoom(0, 0);
   }
}


function setview(v)
{
   timeout_idle_restart()
   if ((v==Views.allbands && view==Views.othersslow) || (view==Views.allbands && v==Views.othersslow)) {
      // no need to restart the applets in this case
      view=v;   
      createCookie("view",view,3652);
      waterfallspeed(waterslowness);
      return;
   }

   if (view==Views.blind) {
      var els = document.getElementsByTagName('*');
      for (i=0; i<els.length; i++) {
         if (els[i].className=="hideblind") els[i].style.display="inline";
         if (els[i].className=="showblind") els[i].style.display="none";
      }
   }
   for (i=0;i<nwaterfalls;i++) waterfallapplet[i].destroy();

   view=v;   
   createCookie("view",view,3652);

   document_waterfalls();  // (re)start the waterfall applets

   if (view==Views.blind) {
      var els = document.getElementsByTagName('*');
      for (i=0; i<els.length; i++) {
         if (els[i].className=="showblind") els[i].style.display="inline";
         if (els[i].className=="hideblind") els[i].style.display="none";
      }
      return;
   }

   sethidedx(hidedx);
}

// Disabled this function because it didn't work as it should (mode "reversed" at time) KA7OEI
function islsbband(b)
{
   // returns true if default SSB mode for this band should be LSB
//   var e=bi[b];
//   if (e.centerfreq>3500 && e.centerfreq<4000) return 1;
//   if (e.centerfreq>1800 && e.centerfreq<2000) return 1;
//   if (e.centerfreq>7000 && e.centerfreq<7400) return 1;
   return 0;
}

function setband(b)
{
   if (b<0 || b>=nvbands) return;
   bi[band].vfo=freq;
  
   if (islsbband(band)!=islsbband(b)) {
      // if needed, exchange LSB/USB 
      var tmp=hi;
      hi=-lo;
      lo=-tmp;
      if (mode=="USB") mode="LSB";
      else if (mode=="LSB") mode="USB";
   }

   band=b;
   var e=bi[b];
   if (nbands>1) document.freqform.group0[band].checked=true;
   if (view==Views.allbands || view==Views.othersslow) {
      scaleobj = scaleobjs[b];
   } else if (view==Views.oneband) {
      scaleobj = scaleobjs[0];
      setscaleimgs(b,0);
      if (waitingforwaterfalls==0) waterfallapplet[0].setband(b, e.maxzoom, e.zoom, e.start);
      if (!hidedx) {
         clearTimeout(band_fetchdxtimer[b]);
         dxs=[]; document.getElementById('blackbar0').innerHTML=""; 
         fetchdx(b);
       }
   }
   setwaterfall(b,e.vfo);
   centerfreq = e.effcenterfreq;
   khzperpixel = e.effsamplerate/1024;
   setfreq(e.vfo);
   waterfallspeed(waterslowness);
}


function sethidedx(h)
{
   hidedx=h;
   if (view==Views.oneband) {
      if (hidedx) {
         dxs=[]; document.getElementById('blackbar0').innerHTML=""; 
         clearTimeout(band_fetchdxtimer[band]);
         document.getElementById('blackbar0').style.height='30px';
      } else {
         showdx(band);
         fetchdx(band);
      }
   } else {
      for (b=0;b<nvbands;b++) {
         if (hidedx) {
            dxs=[]; document.getElementById('blackbar'+band2id(b)).innerHTML=""; 
            clearTimeout(band_fetchdxtimer[b]);
            document.getElementById('blackbar'+band2id(b)).style.height='30px';
         } else {
            showdx(b);
            fetchdx(b);
         }
      }
   }
}


function test_serverbusy()
{
   try { soundapplet.app.l=1; } catch (e) {};
   try { serveravailable=soundapplet.getid(); } catch (e) {};
   if (serveravailable==0) {
      try { clearInterval(interval_updatesmeter); } catch (e) {} ;
      try { clearTimeout(interval_ajax3); } catch (e) {} ;
      var i;
      try { for (i=0;i<nwaterfalls;i++) waterfallapplet[i].destroy(); } catch (e) {} ;
      try { soundapplet.destroy(); } catch (e) {};
      document.body.innerHTML=busystring; //"Sorry, the WebSDR server is too busy right now; please try again later.  For 80 or 40 meters, try Northern Utah WebSDR's #3 server (Blue) or for 40 meters try WebSDR #4 (Magenta) as alternates - GO TO sdrutah.org \n";
   }
}


var sgraph={
   prevt: 0,
   e0: 80,     // current lower end of scale
   e1: -190,   // current upper end of scale
   d0: 80,     // current estimate of lowest value of interest
   d1: -190,   // current estimate of highest value of interest
   width: 200,
   cnt: 0
};

function s2y(s)
{
   return sgraph.cv.height-(s-sgraph.e0)/(sgraph.e1-sgraph.e0)*sgraph.cv.height;
}

function updatesmeter()
{

if(!hookparam_init) hookparam_init=init_hookaudio_params();   // do initialization of "hooked" audio functions

   if((isaudio_now) && (audbtn_txt != ""))  {
      audbtn_txt="";  // Make warning text disappear if audio starts
      document.getElementById('audiowarn').innerHTML=audbtn_txt;
   }

   var v=document.getElementById('sgraphchoice').value;
   var v2=v;

   // Force more buffering than default
   //
   if(buffinit<1){	// Let it go through a cycle or two before changing buffer
     buffinit++;
   }
   else if(buffinit<3) {   // Change the buffer size once
     set_buffer1(1);		// reinit for buffer size of 2000
     buffinit++;
   }

   //
   // Do the following thing(s) only ONCE when a band is changed
   //
   if(band != oldband)
      bchange=0;
   //
   oldband=band;
   //
   if(bchange <= 4)   {
      bchange++;
   }
   else if(bchange==5) {
      bchange++;
      //
      if((freq_once[band] != -1) && (!url_tune))   {	// is a start-up frequency defined and there is NOT a frequency/mode in the URL?
	var ff=freq_once[band];				// yes - tune to the specified frequency
	setfreqb(ff)
        freq_once[band] = 0;				// cancel future tuning
        //
        if(mode_once[band] != "")   {                   // is a mode specified?
           var m=mode_once[band];                       // yes - set to that mode
           set_mode(m);
           mode_once[band] = "";                        // null it out so that it only can happen this once.
        }
      }
      else if(url_tune)	{		// Frequency/mode specified in URL - do NOT go to default frequency
         freq_once[band] = 0;
         url_tune = 0;
      }
//
      if((zoom_once[band] >= 0) && (url_zoom != -1))   {	// Is there an initial zoom to do and no URL-specified zoom level??
         var zz = zoom_once[band];	// yes - get number of zoom levels
         for(i=zz; i>0; i--)  wfset(0); // do the number of zoom levels
         zoom_once[band] = -1;		// cancel future auto-zoom levels for this band
      }

   }
   

   //
   // do URL-specified zoom level - 20211107 KA7OEI
   if( (allloadeddone) && (!waitingforwaterfalls)) {   // do URL zoom once things have started
      if(init_zoomlevel !== 0)   {	// only if non-zero zoom is specified
	      for(i=init_zoomlevel; i>0; i--)  wfset(0);
      }
      init_zoomlevel = -1;
   }

   // do URL-specified squelching - 20211107 KA7OEI
   if((init_squelch > 0) && (allloadeddone)) {	// set squelch state specifed by URL once sound has started
      setsquelch(1);
      init_squelch = -1;
      document.getElementById("squelchcheckbox").checked = true;  // check "squelch" box
   }

   // set audio channel according to URL parameter
   if(soundapplet && aud_chan)	{
      if(aud_chan==-1) {	// -1 = left
         if(soundapplet) soundapplet.setstereo(0);
      }
      else if(aud_chan==1) { // 1 = right
         if(soundapplet) soundapplet.setstereo(1);
      }
      aud_chan=0;	// done - cancel
   }


   if (!allloadeddone) return;

    // tracking attenuation of remote receiver - 20211112 KA7OEI
      //
      if((attval[band] > 0) && (attval[band] <= 39))	// Is the attenuation value for that band valid? (RSP1a can apply 0-39 dB)
	s += 100 * attval[band];			// yes - offset current S-meter reading by that amount.

   // Allow URL disabling of DX labels, and fix problem where DX labels do not reliably appear when page is loaded
   if(dxlabelcount>1)	// decrement if nonzero
	dxlabelcount--;
   if(dxlabelcount==1)  { // Turn on labels when count = 1
        dxlabelcount = 0;
        if(nodxlabel==1)  {
           try { document.getElementById("hidedxbox").checked = true;  } catch(e) {};
           sethidedx(1);	// URL specifed for NO DX labels

        }
        else sethidedx(0)              // turn on DX labels
   }	


   do_deviation_meter();  // fetch "raw" audio from the server and do numerical display of deviation and apparent SNR when in FM mode

   if(databcnt==1) { databcnt++;  waterfallspeed(64);  }

   update_ncofreq(); // get update of oscillator frequency when in Synchronous AM mode

   if(old_mode !== mode)  {   // detect mode change
      modeinfo(mode);  // Update mode info in audio processing
      // Updated on-screen indication of currently-selected mode - KA7OEI 20190227
      document.getElementById("displaymode").innerHTML=mode;
      document.getElementById("displaymode2").innerHTML=mode;

      old_mode=mode;

   }

   disp_syncmode();  // Update screen to show current synchronous AM mode, if active

   // Select "alt AGC" if selected via URL:
   if(altagcenb)   {
      altagcenb = 0;	// clear flag so this happens only once
      set_agcmode(100);	// set to "audio AGC" mode
      // Force "Alt AGC" button checked
      try { document.getElementById("id_altagc").checked = true;  } catch(e) {};  // force "Audio AGC" button to be checked
   }      
	

   try {
      var s=soundapplet.smeter();
   } catch (e) { s=0; };

// Offset of S-meter on a per-band basis (SEE:  "websdr-band_configs.js") to allow waterfall brightness adjustment - KA7OEI
   s=s+(smeter_offset[band]*100);

   sval=s;	// get copy of offset S-meter reading
   alt_agc();   // Do "alternate" gain control function, passing along S-meter value BEFORE offset

   var c=''+(s/100.0-127).toFixed(1);

   smtr=Number(c);  // save a copy of the scaled S-meter value

   if (c.length<6) c='&nbsp;&nbsp;'+c;
   numericalsmeterobj.innerHTML = c;
   if (s>=0) smeterobj.style.width= s*0.0191667+"px";
   else smeterobj.style.width="0px";


   // Did s-meter squelch setting change?

   if(sigsquelch_set != old_sigsquelch_set) {  // yes - update value
      set_sigsquelch(sigsquelch_set);
      old_sigsquelch_set=sigsquelch_set;
   }
   // do S-meter based muting/squelch
   //
   if(!is_mute) {   // is audio muting NOT active?
      if(smtr < sigsquelch_set) sigmute(1);  // Yes - operate s-meter based muting - if signal is weak - mute
      else sigmute(0);
   }

//
// Variable rate S-meter peak decay - 20181216 KA7OEI
//
   smeterpeaktimer++;		// decay acceleration timer
   //
   if(s-0.1 > smeterpeak)  {	// if new peak, get it and reset timer
//      smeterpeak=s;
      smeterhold=s;
      smeterexp=s;
      smeterpeaktimer=0;
   }
   else	{	// do variable-decay peak S-meter
      if(smeterpeaktimer>50)	// limit maximum value
	smeterpeaktimer=50;
      //
      if(smeterpeaktimer>5)	{		// cause a short "dead-time" where no decay happens
//         smeterpeak = smeterpeak-((smeterpeaktimer-5)*(smeterpeaktimer-5))/2;  // scaled exponential decay
         smeterexp = smeterexp-((smeterpeaktimer-5)*(smeterpeaktimer-5))/2;  // scaled exponential decay
      }
      if(smeterpeaktimer>20)
         smeterhold = smeterhold-(smeterpeaktimer-20)/2;
      //
//      if(smeterpeak < s-0.1)	// trap values that might be lower than actual S-meter
//	smeterpeak=s;
      //
     if(smeterexp < s-0.1)
        smeterexp=s;

     if(smeterhold < s-0.1)
        smeterhold=s;
   }

   if(v2>30)		// are we in "average" (very slow) mode?
      smeterpeak=smeterhold;		// yes - take average reading
   else
      smeterpeak=smeterexp;		// take "exponential decay" mode
   //
   if (smeterpeak>=0) smeterpeakobj.style.width= smeterpeak*0.0191667 +"px";
      else smeterpeakobj.style.width="0px";
   var c=''+(smeterpeak/100.0-127).toFixed(1);
   if (c.length<6) c='&nbsp;&nbsp;'+c;
   numericalsmeterpeakobj.innerHTML = c;

   if (serveravailable<0) test_serverbusy();

   // rest of this function is for drawing the signal strength plot

//   var v=document.getElementById('sgraphchoice').value;
//   var v2=v;
   if(v>30)		// offset speed values from graphing mode
	v=v-30;
   if(v>10)
       v=v-10;
   //
   if (!(v>0)) {
      if (sgraph.cv) {
         sgraph.ct.clearRect(0,0,sgraph.cv.width, sgraph.cv.height);
         sgraph.cv.style.display='none';
         sgraph.cv=null;
         sgraph.e0=80;
         sgraph.e1=-190;
      }
      return;
   }

   if (!sgraph.cv) {
      sgraph.cv=document.getElementById('sgraph');
      sgraph.cv.style.display='';
      sgraph.ct=sgraph.cv.getContext("2d");
   }
   var cv=sgraph.cv;
   var ct=sgraph.ct;
   sgraph.width=cv.width-50;

   if(v2<=10)
      s=s/100.0-127;
   else
      s=smeterpeak/100.0-127;
   //
   // try to estimate the useful range of values, without storing all datapoints, and rescale the plot if needed
   if (sgraph.d0>s) sgraph.d0=s; else sgraph.d0+=0.1/v;
   if (sgraph.d1<s) sgraph.d1=s; else sgraph.d1-=0.1/v;
   var redrawaxis=0;
   if (sgraph.d0>sgraph.e0+15 || sgraph.d0<sgraph.e0) { 
      var e0=10*Math.floor(sgraph.d0/10)-5;
      if (e0>sgraph.e0) ct.drawImage(cv, 0,0, sgraph.width,cv.height*(sgraph.e1-e0)/(sgraph.e1-sgraph.e0), 0,0,sgraph.width,cv.height);
      else {
         var f=(sgraph.e1-sgraph.e0)/(sgraph.e1-e0);
         ct.drawImage(cv, 0,0, sgraph.width,cv.height, 0,0,sgraph.width,cv.height*f);
         ct.fillStyle="white";
         ct.fillRect(0,Math.floor(cv.height*f),sgraph.width,cv.height*(1-f)+1);
      }
      sgraph.e0=e0;
      redrawaxis=1;
   }
   if (sgraph.d1>sgraph.e1 || sgraph.d1<sgraph.e1-15) {
      var e1=10*Math.ceil(sgraph.d1/10)+5;
      if (e1<sgraph.e1) {
         var f=(e1-sgraph.e0)/(sgraph.e1-sgraph.e0);
         if (f<0) f=0;
         ct.drawImage(cv, 0,cv.height*(1-f), sgraph.width,cv.height*f, 0,0,sgraph.width,cv.height);
      } else {
         var f=(sgraph.e1-sgraph.e0)/(e1-sgraph.e0);
         if (f<0) f=0;
         ct.drawImage(cv, 0,0, sgraph.width,cv.height, 0,cv.height*(1-f),sgraph.width,cv.height*f);
         ct.fillStyle="white";
         ct.fillRect(0,0,sgraph.width,Math.ceil(cv.height*(1-f)));
      }
      sgraph.e1=e1;
      redrawaxis=1;
   }
   if (redrawaxis) {
      ct.clearRect(sgraph.width,0,cv.width-sgraph.width,cv.height);
      var w=sgraph.e0;
      ct.fillStyle="black";
      ct.font="10px Verdana";
      while ((w=10*Math.ceil(w/10))<=sgraph.e1) {
         var y=s2y(w);
         ct.fillText(w+" dB",sgraph.width+2,y+4,cv.width-sgraph.width);
         w+=1;
      }
   }

   sgraph.cnt++;
   if (sgraph.cnt>=v) {
      sgraph.cnt=0;
      ct.drawImage(cv, 1,0,sgraph.width-1,cv.height, 0,0,sgraph.width-1,cv.height);  // move the plot one pixel to the left
      var t=new Date().getTime();
      if (v>=10) v=60;
      if (Math.floor(t/1000/v)!=Math.floor(sgraph.prevt/1000/v)) {
         // draw grey vertical line as time marker
         ct.fillStyle="rgba(210,210,210,1)";
         ct.fillRect(sgraph.width-1,0,1,cv.height);
         sgraph.prevt=t;
      } else {
         // draw white vertical line with grey dB scale markers
         ct.fillStyle="white";
         ct.fillRect(sgraph.width-1,0,1,cv.height);
         ct.fillStyle="rgba(210,210,210,1)";
         var w=sgraph.e0;
         while ((w=10*Math.ceil(w/10))<=sgraph.e1) {
            var y=s2y(w);
            ct.fillRect(sgraph.width-1,y,1,1);
            w+=1;
         }
      }
   }

   // plot the actual data point
   ct.fillStyle="blue";
   ct.fillRect(sgraph.width-1,s2y(s),1,1);
}


var uu_names=new Array();
var uu_bands=new Array();
var uu_freqs=new Array();
var others_colours=[ "#ff4040", "#ffa000", "#a0a000", "#80ff00", "#00ff00", "#00a0a0", "#0080ff", "#ff40ff"];

var dxs=[];

function uu(i, username, band, freq)
// called by updates fetched from the server
{
   uu_names[i]=username;
   uu_bands[i]=band;
   uu_freqs[i]=freq;
//   uu_khz[i]=(bi[band].samplerate*freq-bi[band].samplerate/2)+bi[band].centerfreq;
}


var uu_compactview=false;
function douu()
// draw the diagram that shows the other listeners
{
var ukhz="";
var oscale_l="";
var oscale_r="";

   s='';
   total=0;
   for (b=0;b<nbands;b++) {
      if (!uu_compactview) {
        if(typeof userscale == 'undefined') {   // Use original user view frequency scale
          s+="<p><div align='left' style='width:1024px; background-color:black;'><div class=others>";
           for (i=0;i<uu_names.length;i++) if (uu_bands[i]==b && uu_names[i]!="") {
              if(typeof show_ufreq !== 'undefined') ukhz=" ["+Math.round((bi[b].samplerate*uu_freqs[i]-bi[b].samplerate/2)+bi[b].centerfreq - ((lo+hi)/2))+"]";
              s+="<div id='user"+i+"' align='center' style='position:relative;left:"+
                   (uu_freqs[i]*1024-250)
                   +"px;width:500px; color:"+others_colours[i%8]+";'><b>"+uu_names[i]+ukhz+"</b></div>";
              total++;
           }
           s+="<img src="+bi[b].scaleimgs[0][0]+"></div></div></p>";
        }
        else {   // use custom scaling of user view frequency scale
          if(userscale[b])  {   // "userscale" is an array - if element nonzero for the band, use custom scaling
             var cs=custom_scale[b];
             var co=custom_offset[b];
             s+="<p><div align='left' style='width:1024px; background-color:black;'><div class=others>";

             for (i=0;i<uu_names.length;i++) if (uu_bands[i]==b && uu_names[i]!="") {
               oscale_l="";  // reset off-scale markers
               oscale_r="";
              if(typeof show_ufreq !== 'undefined') ukhz=" ["+Math.round((bi[b].samplerate*uu_freqs[i]-bi[b].samplerate/2)+bi[b].centerfreq - ((lo+hi)/2))+"]";
                 var posx=uu_freqs[i]*cs-co;   // calculate horizontal position of name
                 var nmlen=(uu_names[i].length+ukhz.toString().length+2)*3;  // calculate approx size of name string in pixels for offset
                 if(posx > custom_size[b]-250-nmlen)   {  // trap off-scale on right edge taking into account username+freq
                    posx = custom_size[b]-250-nmlen;  //
                    oscale_r=" >>";   // Indicate offscale to the right
                 }
                 else if(posx < -250+nmlen)  { 
                    posx = nmlen-250;  // offset left edge by approximate length of username+freq
                 oscale_l="<< ";  // add symbols to indicate that it is off the left edge
}
                 s+="<div id='user"+i+"' align='center' style='position:relative;left:"+ posx
                   +"px;width:500px; color:"+others_colours[i%8]+";'><b>"+oscale_l+uu_names[i]+ukhz+oscale_r+"</b></div>";
                 total++;
              }
              s+="<img src=cust/"+custom_prefix+"customscale"+b+".png></div></div></p>";  // build filename of custom scale
          }
          else  {  // use original scaling for this band
             cs=1024;  // original scaling
             co=250;   // original offset
             s+="<p><div align='left' style='width:1024px; background-color:black;'><div class=others>";
              for (i=0;i<uu_names.length;i++) if (uu_bands[i]==b && uu_names[i]!="") {
              if(typeof show_ufreq !== 'undefined') ukhz=" ["+Math.round((bi[b].samplerate*uu_freqs[i]-bi[b].samplerate/2)+bi[b].centerfreq - ((lo+hi)/2))+"]";
              s+="<div id='user"+i+"' align='center' style='position:relative;left:"+ (uu_freqs[i]*1024-250)
                   +"px;width:500px; color:"+others_colours[i%8]+";'><b>"+uu_names[i]+ukhz+"</b></div>";
                 total++;
              }
              s+="<img src="+bi[b].scaleimgs[0][0]+"></div></div></p>";
          }
        }
      }
      else {  // IS compactview
         s+="<p><div align='left' style='width:1024px;height:15px;position:relative; background-color:black;'>";
         for (i=0;i<uu_names.length;i++) if (uu_bands[i]==b && uu_names[i]!="") {
            s+="<div id='user"+i+"' style='position:absolute;top:1px;left:"+
                 (uu_freqs[i]*1024)
                 +"px;width:1px;height:13px; background-color:"+others_colours[i%8]+";'></div>";
            total++;
         }
         s+="</div><div><img src="+bi[b].scaleimgs[0][0]+"a></div></p>";
      }

   }
   usersobj.innerHTML=s;
   numusersobj.innerHTML=total;
}

function setcompactview(c)
{
   uu_compactview=c;
   douu();
}


function ajaxFunction3()
{
  var xmlHttp;
  try { xmlHttp=new XMLHttpRequest(); }
    catch (e) { try { xmlHttp=new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) { try { xmlHttp=new ActiveXObject("Microsoft.XMLHTTP"); }
        catch (e) { alert("Your browser does not support AJAX!"); return false; } } }
  xmlHttp.onreadystatechange=function()
    {
    if(xmlHttp.readyState==4)
      {
        if (xmlHttp.status==200 && xmlHttp.responseText!="") {
          eval(xmlHttp.responseText);
          douu();
        }
        clearTimeout(interval_ajax3);
        interval_ajax3 = setTimeout('ajaxFunction3()',1000);
      }
    }
  interval_ajax3 = setTimeout('ajaxFunction3()',120000);
  var url="/~~othersjj?chseq="+chseq;
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
}



function javatest()
{
   var javaversion;
   try {
      javaversion = soundapplet.javaversion();
   } catch(err) {
      javaerr=1;
      if (!usejavasound) return;
      document.getElementById("javawarning").style.display= "block";
      javaversion="999";
      setTimeout('javatest()',1000); // in case loading java was simply taking too long
   }
   if (javaversion<"1.4.2") {
      document.getElementById("javawarning").innerHTML='Your Java version is '+javaversion+', which is too old for the WebSDR. Please install version 1.4.2 or newer, e.g. from <a href="http://www.java.com">http://www.java.com</a> if you hear no sound.';
      document.getElementById("javawarning").style.display= "block";
   }
}


function updbw()
{
   if (lo>hi) {
      if (document.onmousemove == useMouseXYloweredge || touchingLower) lo=hi;
      else hi=lo;
   }
   var maxf=(mode=="FM") ? 15 : (bandinfo[band].maxlinbw*0.95);
   if (lo<-maxf) lo=-maxf;
   if (hi>maxf) hi=maxf;
   var x6=document.getElementById('numericalbandwidth6');
   var x60=document.getElementById('numericalbandwidth60');
   x6.innerHTML=(hi-lo+0.091).toFixed(2);
   x60.innerHTML=(hi-lo+0.551).toFixed(2);
    // limit frequency when tuning to current band - KA7OEI 20180222
   setfreq_lim(freq);
}


// from http://www.quirksmode.org/js/cookies.html
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
//	document.cookie = name+"="+value+expires+"; path=/";
	document.cookie = name+"="+value+expires+"; path=/; SameSite=Lax";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}


function id2band(id)
{
   if (view == Views.oneband) return band; else return id;
}

function band2id(b)
{
   if (view == Views.oneband) return 0; else return b;
}

function waterfallspeed(sp)
{
   waterslowness=sp;
   if (waitingforwaterfalls>0) return;
   var done=0;
   if (view==Views.othersslow) {
      for (i=0;i<nwaterfalls;i++)
         if (i==band) waterfallapplet[i].setslow(sp);
         else waterfallapplet[i].setslow(100);
   } else {
      for (i=0;i<nwaterfalls;i++)
         waterfallapplet[i].setslow(sp);
   }
}

function waterfallheight(si)
{
   waterheight=si;
   if (waitingforwaterfalls>0) return;
   for (i=0;i<nwaterfalls;i++) {
      waterfallapplet[i].setSize(1024,si);
   }

   var y=scaleobj.offsetTop+15;
   passbandobj.style.top=y+"px";
   edgelowerobj.style.top=y+"px";
   edgeupperobj.style.top=y+"px";
   carrierobj.style.top=y+"px";
}

function waterfallmode(m)
{
   watermode=m;
   if (waitingforwaterfalls>0) return;
   for (i=0;i<nwaterfalls;i++) {
      waterfallapplet[i].setmode(m);
   }
}



function soundappletstarted()
{
   if (usejavasound && javaerr) {
      javaerr=0;
      document.getElementById("javawarning").style.display= "none";
   }
   setTimeout('soundappletstarted2()',100);
}

function soundappletstarted2()
{
   allloadeddone=true;

   soundapplet.setvolume(Math.pow(10, document.getElementById('volumecontrol2').value /10.));

   if (bi[0]) {
      setfreqif(freq);
      updbw();
   }

   try { setmute(document.getElementById('mutecheckbox').checked) } catch(e){};
   try { setsquelch(document.getElementById('squelchcheckbox').checked) } catch(e){};
   try { setautonotch(document.getElementById('autonotchcheckbox').checked) } catch(e){};



   test_serverbusy();
}


function waterfallappletstarted(id)
{
   // this function is called when a waterfall applet becomes active
   waitingforwaterfalls--;
   if (waitingforwaterfalls<0) waitingforwaterfalls=0; // shouldn't happen...
   if (waitingforwaterfalls!=0) return;
   setTimeout('allwaterfallappletsstarted()',100);
}

function allwaterfallappletsstarted() 
{
   var i;

   waterfallspeed(waterslowness);
   waterfallmode(watermode);

   for (i=0;i<nwaterfalls;i++) {
      var e=bi[i];
      waterfallapplet[i].setband(e.realband, e.maxzoom, e.zoom, e.start);
   }
   if (view==Views.oneband) {
      var e=bi[band];
      waterfallapplet[0].setband(band, e.maxzoom, e.zoom, e.start);
   }

   // and when the applets run, we can also be sure that the HTML elements for the frequency scale have been rendered:
   for (i=0;i<nwaterfalls;i++) {
     scaleobjs[i] = document.getElementById('clipscale'+i);
     scaleimgs0[i] = document.images["s0cale"+i];
     scaleimgs1[i] = document.images["s1cale"+i];
   }
   if (view==Views.oneband) {
      setscaleimgs(band,0);
      scaleobj = scaleobjs[0];
   } else {
      for (i=0;i<nwaterfalls;i++) setscaleimgs(i,i);
      scaleobj=scaleobjs[band];
   }
   draw_passband();
}

var sup_socket = !!window.WebSocket && !!WebSocket.CLOSING;   // the CLOSING test excludes browsers with an old version of the websocket protocol, in particular Safari 5
var sup_canvas = !!window.CanvasRenderingContext2D;
var sup_webaudio = window.AudioContext || window.webkitAudioContext;
var sup_mozaudio = false;
try { if (typeof(Audio)==='function' && typeof(new Audio().mozSetup)=='function') sup_mozaudio = true; } catch (e) {};

function html5javawarn()
{ 
   // show warning regarding support for HTML5 or Java if needed
   document.getElementById("javawarning").style.display= (usejavasound && javaerr) ? "block" : "none";
   document.getElementById("html5warning").style.display= (!usejavasound && !sup_webaudio && !sup_mozaudio) ? "block" : "none";
}


function html5orjava(item,usejava)
{
   if (item==0) {
      // waterfall
      if (usejavawaterfall==usejava) return;
      usejavawaterfall=usejava;
      var s=(usejavawaterfall?"y":"n")+(usejavasound?"y":"n");
      createCookie("usejava",s,3652);
      var i;
      try { for (i=0;i<nwaterfalls;i++) waterfallapplet[i].destroy(); } catch (e) {} ;
      document_waterfalls();
   }
   if (item==1) {
      // sound
      if (usejavasound==usejava) return;
      usejavasound=usejava;
      var s=(usejavawaterfall?"y":"n")+(usejavasound?"y":"n");
      createCookie("usejava",s,3652);
      try { soundapplet.destroy(); } catch (e) {};
      document_soundapplet();
      document.getElementById('record_span').style.display= usejavasound ? "none" : "inline";
      html5javawarn();
   }
}

function checkjava()
{
   try {
      if (navigator.javaEnabled && navigator.javaEnabled()) return "green";
   } catch(e) {};
   try {
      var m=navigator.mimeTypes;
      for (i=0;i<m.length;i++)
         if (m[i].type.match(/^application\/x-java-applet/)) return "green";
      return "red"; 
   } catch(e) {};
   return "black";
}

function iOS_audio_start()
{
   // Safari on iOS only plays webaudio after it has been started by clicking a button, so this function must be called from a button's onclick handler
   audbtn_txt="";  // make warning text go away when clicked
   document.getElementById('audiowarn').innerHTML=audbtn_txt;
   if (!document.ct) document.ct= new webkitAudioContext();
   var s = document.ct.createBufferSource();
   s.connect(document.ct.destination);
   try { s.start(0); } catch(e) { s.noteOn(0); }
}

// Added to allow Chrome users to click-to-start audio


function chrome_audio_start()
{
   // Chrome only plays webaudio after it has been started by clicking a button, so this function must be called from a button's onclick handler
   audbtn_txt="";  // make warning text go away when clicked
   document.getElementById('audiowarn').innerHTML=audbtn_txt;
   if (!document.ct) document.ct= new webkitAudioContext();
   var s = document.ct.createBufferSource();
   s.connect(document.ct.destination);
   document.ct.resume();
   try { s.start(0); } catch(e) { s.noteOn(0);}
}


// Added to allow Mozilla users to click-to-start audio

function mozilla_audio_start()
{
   // Firefox version >=103 only plays webaudio after it has been started by clicking a button, so this function must be called from a button's onclick handler
   audbtn_txt="";  // get rid of warning when clicked
   document.getElementById('audiowarn').innerHTML=audbtn_txt;
   if (!document.ct) document.ct= new webkitAudioContext();
   var s = document.ct.createBufferSource();
   s.connect(document.ct.destination);
   document.ct.resume();
   try { s.start(0); } catch(e) { s.noteOn(0);}
}

function set_buffer1(toggle)
{
//   if (toggle) soundapplet.setdelay1(4000);
//   else soundapplet.setdelay1(1000);
       if(toggle==1) sa_setd(2000)        // 250ms
       else if(toggle==2) sa_setd(4000);  // 500ms
       else if(toggle==3) sa_setd(8000);  // 1 sec
       else if(toggle==4) sa_setd(16000); // 2 sec
       else if(toggle==-1) sa_setd(500);  // 62.5ms
       else if(toggle==-2) sa_setd(250);  // 31.25ms
       else if(toggle==-3) sa_setd(125);  // 15.625ms
       else sa_setd(1000);		// default - 125ms
}

// call to setdelay, but with error catch

function sa_setd(a)
{
   var d=a;
   try { soundapplet.setdelay1(d); } catch(e) {}
}

function html5orjavamenu()
{
   var s;
   if (sup_webaudio) {
      if (sup_webaudio) {
         if (!document['ct']) document['ct']= new sup_webaudio;
         try {
            var cc=document['ct'].createConvolver;
         } catch (e) {
            document['ct']=null; // firefox 23 supports webaudio, but not yet createConvolver(), making it unusable.
            sup_webaudio=false;
         };
      }
   }
   sup_iOS = 0;   // global!
   sup_android = 0;   // global!
   sup_chrome = 0;  // global!
   sup_mozilla = 0;
   try { 
      var n=navigator.userAgent.toLowerCase();
      if (n.indexOf('iphone')!=-1) sup_iOS=1;
      if (n.indexOf('ipad')!=-1) sup_iOS=1;
      if (n.indexOf('ipod')!=-1) sup_iOS=1;
      if (n.indexOf('ios')!=-1) sup_iOS=1;
      if (n.indexOf('ipados')!=-1) sup_iOS=1;
      if (n.indexOf('macintosh')!=-1) sup_iOS=1;
      if (n.indexOf('android')!=-1) sup_android=1;
      if (n.indexOf('chrome')!=-1) sup_chrome=1;
      if (n.indexOf('mozilla')!=-1) sup_mozilla=1;
   } catch (e) {};
   if (sup_iOS) isTouchDev=true;
   var usecookie= readCookie('usejava');
   if (!usecookie) {
      if (sup_socket && sup_canvas) usecookie="n"; else usecookie="y";
      if (sup_socket && (sup_webaudio || sup_mozaudio)) usecookie+="n"; else usecookie+="y";
   }
   usejavawaterfall=(usecookie.substring(0,1)=='y');
   usejavasound=(usecookie.substring(1,2)=='y');
   
   var javacolor=checkjava();
   s='<b>Wasserfall:</b>';
   s+='<span style="color: '+javacolor+'"><input type="radio" name="groupw" value="Java" onclick="html5orjava(0,1);"'+(usejavawaterfall?" checked":"")+'>Java</span>';
   if (sup_socket && sup_canvas) s+='<span style="color:green">'; else s+='<span style="color:red">';
   s+='<input type="radio" name="groupw" value="HTML5" onclick="html5orjava(0,0);"'+(!usejavawaterfall?" checked":"")+'>HTML5</span>';
   s+='&nbsp;&nbsp;&nbsp;<b>Audio:</b>';
   s+='<span style="color: '+javacolor+'"><input type="radio" name="groupa" value="Java" onclick="html5orjava(1,1);"'+(usejavasound?" checked":"")+'>Java</span>';
   if (sup_socket && sup_webaudio) s+='<span style="color: green">';
   else if (sup_socket && sup_mozaudio) s+='<span style="color: blue">';
   else s+='<span style="color: red">';
   s+='<input type="radio" name="groupa" value="HTML5" onclick="html5orjava(1,0);"'+(!usejavasound?" checked":"")+'>HTML5 </span>';
   if (sup_iOS && sup_socket && sup_webaudio) {
      s+='<input type="button" value="iOS audio start" onclick="iOS_audio_start()" style="background:#88ff88; font-weight: bold">';
      audbtn_txt="<br>&nbsp;&nbsp;&nbsp;No audio? Press <b><i>iOS audio start</i></b> button!";
   }
   if (sup_chrome && sup_socket && sup_webaudio)  {
       s+='<input type="button" value="Chrome audio start" onclick="chrome_audio_start()" style="background:#ffff88; font-weight: bold">';
       audbtn_txt="<br>&nbsp;&nbsp;&nbsp;No audio? Press <b><i>Chrome audio start</i></b> button!";
   }
   if (sup_mozilla && sup_socket && sup_webaudio)  {
       s+='<input type="button" value="Firefox/Mozilla audio start" onclick="mozilla_audio_start()" style="background:#ffff88; font-weight: bold">';
       audbtn_txt="<br>&nbsp;&nbsp;&nbsp;No audio? Press <b><i>Firefox/Mozilla audio start</i></b> button!";
   }
   document.getElementById('html5choice').innerHTML = s;
   document.getElementById('audiowarn').innerHTML=audbtn_txt;
   document.getElementById('record_span').style.display = usejavasound ? "none" : "inline";
}



function bodyonload()
{
   var s;

   html5orjavamenu();
   if ((sup_iOS || sup_android) && has_mobile) document.getElementById("mobilewarning").style.display= "block";

   view= readCookie('view');
   if (view==null) view=Views.oneband;
// Remove "all bands" from waterfall selection menu - KA7OEI 20180110
//   if (nvbands>=2) s='<input type="radio" name="group" value="all bands" onclick="setview(0);">all bands<input type="radio" name="group" value="others slow" onclick="setview(1);" >others slow<input type="radio" name="group" id="oneband_btn" value="one band" onclick="setview(2);" >one band';
   if (nvbands>=2) s='<input type="radio" name="group" value="others slow" onclick="setview(1);" >others slow<input type="radio" id="oneband_btn" name="group" value="one band" onclick="setview(2);" >one band';

   else {
      s='<input type="radio" name="group" value="Wasserfall" onclick="setview(2);">Wasserfall';
      if (view==Views.othersslow || view==Views.allbands) view=Views.oneband;
   }
   s+='<input type="radio" name="group" value="blind" onclick="setview(3);" >blind';
   document.getElementById('viewformbuttons').innerHTML = s;
   if (nvbands>=2) document.viewform.group[view].checked=true;
   else document.viewform.group[view-2].checked=true;

   var x= readCookie('username');
   var p=document.getElementById("please2");
   if (!x && p) p.innerHTML="<b><i>Please type a name or callsign in the box at the <a href='#please'>top of the page</a> to identify your chat messages!</i></b>";

   // Force various boxes to be checked/unchecked as necessary upon load

   uu_compactview=document.getElementById("compactviewcheckbox").checked;  // Waterfall view
   document.getElementById("mutecheckbox").checked=false;                  // mute box
   document.getElementById("squelchcheckbox").checked=false;               // squelch box
   document.getElementById("autonotchcheckbox").checked=false;             // autonotch box
   document.getElementById("notch2checkbox").checked=false;                // notch2 box
   document.getElementById("hiboostcheckbox").checked=false;               // High boost
   document.getElementById("cwpeaktone").checked=false; // Force "Ref tone" check box off
   document.getElementById("cwpk_slider").value=0;          // force CW Peak filter slider to far left (off)
   document.getElementById("vnotch_slider").value=0;          // force Vari-Notch filter slider to far left (off)
   document.getElementById("nrcheckbox").options.selectedIndex=0;          // force DSP NR drop-down to off
   document.getElementById("usbcwbox").checked=false; // Force "USB CW" box to off
   document.getElementById("allow_kbd").checked=false; // Force "allow keys" box to off

document.getElementById("step_n1").textContent='-//';
document.getElementById("step_n2").textContent='-/';
document.getElementById("step_n3").textContent='-';
document.getElementById("step_n4").textContent='--';
document.getElementById("step_n5").textContent='---';
document.getElementById("step_9").textContent='= kHz';
document.getElementById("step_p1").textContent="\\\\+";
document.getElementById("step_p2").textContent='\\+';
document.getElementById("step_p3").textContent='+';
document.getElementById("step_p4").textContent='++';
document.getElementById("step_p5").textContent='+++';


   try { memories=JSON.parse(localStorage.getItem('memories')); } catch (e) {};
   if (!memories) memories=[];
   else {
       // conversion from old data format - should be removed later
       var rew=false;
       for (i=0;i<memories.length;i++) {
          if (memories[i].mode==1) { memories[i].mode="AM"; rew=true; }
          if (memories[i].mode==4) { memories[i].mode="FM"; rew=true; }
          if (memories[i].mode==0) {
             rew=true;
             if (memories[i].hi-memories[i].lo<1) memories[i].mode="CW";
             else if (memories[i].hi+memories[i].lo>0) memories[i].mode="USB";
             else memories[i].mode="LSB";
          }
          if (!memories[i].nomfreq) memories[i].nomfreq=memories[i].freq + (memories[i].mode=="CW"?0.75:0);
       }
       if (rew) try { localStorage.setItem('memories',JSON.stringify(memories)); } catch (e) {};
   }

   passbandobj =document.getElementById('yellowbar');
   edgeupperobj = document.getElementById('edgeupper');
   edgelowerobj = document.getElementById('edgelower');
   edgeupperobj = document.getElementById('edgeupper');
   carrierobj = document.getElementById('carrier');
   smeterobj = document.getElementById('smeterbar');
   numericalsmeterobj=document.getElementById('numericalsmeter');
   smeterpeakobj = document.getElementById('smeterpeak');
   numericalsmeterpeakobj=document.getElementById('numericalsmeterpeak');
   sigsquelch_valobj=document.getElementById('sigsquelch_val');  // signal squelch numerical display
   smeterobj.style.top= smeterpeakobj.style.top;
   smeterobj.style.left= smeterpeakobj.style.left;
   devpkobj = document.getElementById('devpk');   // deviation and SNR information
   dev_pkavgobj = document.getElementById('dev_pkavg');   // deviation and SNR information
   dev_avgobj = document.getElementById('dev_avg');   // deviation and SNR information
   nco_freqobj = document.getElementById('ncofreq');  // Frequency of NCO
   cwpk_freqobj=document.getElementById('cwpk_freq');  // frequency of CW peak filter
   vnotch_freqobj=document.getElementById('vnotch_freq');  // frequency of CW peak filter

beta_valobj=document.getElementById('beta_val');
decay_valobj=document.getElementById('decay_val');
delay_valobj=document.getElementById('delay_val');
len_valobj=document.getElementById('len_val');
dlen_valobj=document.getElementById('dlen_val');


   mem_show();

   bi=bandinfo;
   for (i=0;i<nbands;i++) {
      var e=bi[i];
      e.realband=i;
      e.effcenterfreq=e.centerfreq;
      e.effsamplerate=e.samplerate;
      e.zoom=0;
      e.start=0;
      e.minzoom=0;
   }

   document.freqform.frequency.value=freq;
   if (nbands>1) document.freqform.group0[0].checked=true;

   html5javawarn();

   chatboxobj = document.getElementById('chatbox');

   statsobj = document.getElementById('stats');
   numusersobj = document.getElementById('numusers');
   usersobj = document.getElementById('users');

   setview(view);

   if (!islsbband(band) && hi<0) { var tmp=hi; hi=-lo; lo=-tmp; mode="USB"; }

// Modified to include initial zoom level and improve URL parsing flexibility for future additions
// 20211107 KA7OEI

   var tuneparam = (new RegExp("[?&]tune=([^&#]*)").exec(window.location.href));
   var zoomparam = (new RegExp("[?&]zoom=([^&#]*)").exec(window.location.href));
   var squelchparam = (new RegExp("[?&]squelch=([^&#]*)").exec(window.location.href));
   var smsquelchparam = (new RegExp("[?&]smsquelch=([^&#]*)").exec(window.location.href));
   var dxlabelparam = (new RegExp("[?&]nolabels=([^&#]*)").exec(window.location.href));
   var altagcparam = (new RegExp("[?&]altagc=([^&#]*)").exec(window.location.href));
   var ltoparam= (new RegExp("[?&]lto([^&#]*)").exec(window.location.href));
   var nodeemphparam = (new RegExp("[?&]nodeemph([^&#]*)").exec(window.location.href));
   var abtnparam = (new RegExp("[?&]audbtn([^&#]*)").exec(window.location.href));
   var do10hzparam = (new RegExp("[?&]10hz([^&#]*)").exec(window.location.href));
   var dousbcw = (new RegExp("[?&]usbcw([^&#]*)").exec(window.location.href));
   var do_kbd = (new RegExp("[?&]allow_kbd([^&#]*)").exec(window.location.href));
   var do_audch = (new RegExp("[?&]chan=([^&#]*)").exec(window.location.href));

   if (tuneparam) {
      tuneparam[1]=tuneparam[1].split('?')[0];  // strip away any other parameters
      setfreqtune(tuneparam[1]);
      url_tune=1;	// set TRUE if frequency/mode specified in URL

   } else if (ini_freq && ini_mode) {
      setfreqif(ini_freq);
      set_mode(ini_mode);
   }
   //
   if (zoomparam !== null) {
      zoomparam[1]=zoomparam[1].split('?')[0];   // strip away any other parameters
      setzoomlevelurl(zoomparam[1]);
      url_zoom=-1;	// indicate URL-specified zoom
   }
   else {
      setzoomlevelurl(-1);
   }
   //
   if (squelchparam) {
      squelchparam[1]=squelchparam[1].split('?')[0];   // strip away any other parameters
      setsquelchlevelurl(squelchparam[1]);
   }
   else {
      setsquelchlevelurl(-1);
   }
   //
   if (smsquelchparam) {
      smsquelchparam[1]=smsquelchparam[1].split('?')[0];   // strip away any other parameters
      set_sigsquelch(smsquelchparam[1]);
   }
   else {
      set_sigsquelch(0);
   }
   //
   // Parse "dx label disable" URL param
   if (dxlabelparam)	{
      dxlabelparam[1]=dxlabelparam[1].split('?')[0];   // strip away other parameters
      if(Number(dxlabelparam[1]))   nodxlabel=1;  // Inidicate no DX labels
         else  nodxlabel = 0;
   }

   // Parse "alt agc select" URL param
   if (altagcparam)	{
      altagcparam[1]=altagcparam[1].split('?')[0];   // strip away other parameters
      if(Number(altagcparam[1]))   altagcenb=1;  // Inidicate audio AGC to be enabled
         else  altagcenb=0;
   }

   if(ltoparam)  ltotrue = 1;

   if(nodeemphparam)  fm_nodeemph = 1;  // Disable FM de-emphasis and filtering if "nodeemph" parameter is included

   if(abtnparam) {  // force presentation of "iOS Audio Start" button, unconditionally
      abtn_flag = 1; 
      html5orjavamenu();
   }

   if(do10hzparam) do10hz=1;  // display frequency with only 10 Hz resolution

   if(dousbcw)	{
	do_usbcw=1;    // use CW with USB instead of LSB
	document.getElementById("usbcwbox").checked=true; // Force "USB CW" box to checked if URL used
   }

   if(do_kbd)
	document.getElementById("allow_kbd").checked=true; // Force "allow keys" box to on

   if(do_audch) {
      do_audch[1]=do_audch[1].split('?')[0];	// Strip away other parameters
      set_audchan(do_audch[1]);
   }

   // Force "one band" button checked
   try {document.getElementById("oneband_btn").checked = true;  } catch(e) {};

   // Force "RF AGC" button checked
   try { document.getElementById("id_autogain").checked = true;  } catch(e) {};

   document_soundapplet();

   interval_ajax3 = setTimeout('ajaxFunction3()',1000);

   setTimeout('javatest()',2000);

   interval_updatesmeter = setInterval('updatesmeter()',100);

   if (isTouchDev) {
      registerTouchEvents("carrier", touchpassband, touchXYpassband);
      registerTouchEvents("yellowbar", touchpassband, touchXYpassband);
      registerTouchEvents("edgeupper", touchupper, touchXYupperedge);
      registerTouchEvents("edgelower", touchlower, touchXYloweredge);
   }

   // set up to get attenuation value from remote receiver - KA7OEI 20211112
   //
   setInterval( 'get_attenval()', 625 );   // set timer to query remote receiver's attenuation setting (msec)
   setInterval( 'get_datab()', 30000);
   document.getElementById("att_set").innerHTML=att_disp;  // init attenuation display string


}



function registerTouchEvents(id, touchStart, touchMove) {
   var elem=document.getElementById(id);
   elem.addEventListener('touchstart', touchStart);
   elem.addEventListener('touchmove', touchMove);
   elem.addEventListener('touchend', touchEnd);
}

function setusernamecookie() {
   createCookie('username',document.usernameform.username.value,365*5);
   var p=document.getElementById("please1");
   if (p) p.innerHTML="Dein Name oder Rufzeichen: ";
   p=document.getElementById("please2");
   if (p) p.innerHTML="";
   send_soundsettings_to_server();
}


// validate initial zoom level - KA7OEI 20211107
function setzoomlevelurl(zoomlevel)
{

   zoomlevel=Number(zoomlevel)
   //
   if(zoomlevel > 9) {
      init_zoomlevel=9;
   }
   //
   if(zoomlevel < 0) {
      init_zoomlevel=-1;
   }
   else	{
      init_zoomlevel=zoomlevel;
      url_zoom=-1;	// indicate URL-specified zoom
   }
}

// validate initial squelch level - KA7OEI 20211107
function setsquelchlevelurl(s_level)
{
 
   s_level=Number(s_level);
   if(s_level > 0) {
      init_squelch=1;
   }
   else if(!s_level) {
      init_squelch=0;
   }
   else {
      init_squelch=-1
   }
}

function set_audchan(aud)
{
   var chan = aud.toLowerCase(aud);
   if(chan=="left") {
      aud_chan=-1;
      document.getElementById("au-out-left").checked=true;
   }
   else if(chan=="right") {
      aud_chan=1;
      document.getElementById("au-out-right").checked=true;
   }
}

//----------------------------------------------------------------------------------------
// things related to interaction with the mouse (clicking & dragging on the frequency axes)

var dragging=false;
var dragorigX;
var dragorigval;
var touchingLower=false;

function getMouseXY(e)
{
   e = e || window.event;
   if (e.pageX || e.pageY) return {x:e.pageX, y:e.pageY};
   return {
     x:e.clientX + document.body.scrollLeft - document.body.clientLeft,
     y:e.clientY + document.body.scrollTop  - document.body.clientTop
   };
// from: http://www.webreference.com/programming/javascript/mk/column2/
}

function useMouseXY(e)
{
   var pos=getMouseXY(e);
    // limit frequency when tuning to current band - KA7OEI 20180222
   setfreq_lim((pos.x-scaleobj.offsetParent.offsetLeft-512)*khzperpixel+centerfreq-(hi+lo)/2);
   return cancelEvent(e);
}

function touchXY(ev)
{
   ev.preventDefault();
   for (var i=0; i<ev.touches.length; i++) {
      var x = ev.touches[i].pageX;
    // limit frequency when tuning to current band - KA7OEI 20180222
      setfreq_lim((x-scaleobj.offsetParent.offsetLeft-512)*khzperpixel+centerfreq-(hi+lo)/2);
   }
}

function useMouseXYloweredge(e)
{
   var pos=getMouseXY(e);
   lo=dragorigval+(pos.x-dragorigX)*khzperpixel;
   updbw();
   return cancelEvent(e);
}

function touchXYloweredge(ev)
{
   ev.preventDefault();
   for (var i=0; i<ev.touches.length; i++) {
      var x = ev.touches[i].pageX;
      lo=dragorigval+(x-dragorigX)*khzperpixel;
      updbw();
   }
}

function useMouseXYupperedge(e)
{
   var pos=getMouseXY(e);
   hi=dragorigval+(pos.x-dragorigX)*khzperpixel;
   updbw();
   return cancelEvent(e);
}

function touchXYupperedge(ev)
{
   ev.preventDefault();
   for (var i=0; i<ev.touches.length; i++) {
      var x = ev.touches[i].pageX;
      hi=dragorigval+(x-dragorigX)*khzperpixel;
      updbw();
   }
}

function useMouseXYpassband(e)
{
   var pos=getMouseXY(e);
    // limit frequency when tuning to current band - KA7OEI 20180222
   setfreq_lim(dragorigval+(pos.x-dragorigX)*khzperpixel);
   return cancelEvent(e);
}

function touchXYpassband(ev)
{
   ev.preventDefault();
   for (var i=0; i<ev.touches.length; i++) {
      var x = ev.touches[i].pageX;
    // limit frequency when tuning to current band - KA7OEI 20180222
      setfreq_lim(dragorigval+(x-dragorigX)*khzperpixel);
   }
}

function mouseup(e)
{
   if (dragging) {
      dragging=false;
      document.onmousemove(e);
      document.onmousemove = null;
   }
}

function touchEnd(ev) {
   ev.preventDefault();
   if (dragging) {
      dragging=false;
      touchingLower=false;
   }
}

function imgmousedown(ev,bb)
{
   var b=id2band(bb);
   dragging=true;
   document.onmousemove = useMouseXY;
   if (view!=Views.oneband && band!=b) {
      if (view==Views.othersslow) waterfallspeed(waterslowness);
      setband(b);
      useMouseXY(ev);
   }
}

function imgtouch(ev) {
   ev.preventDefault();
   
   // recover waterfall instance number from event target
   // is there a better way to do this?
   var e = ev || window.event;
   var img;
   if (e.target) img = e.target; else
   if (e.srcElement) img = e.srcElement;
   if (img.nodeType == 3) img = img.parentNode;
   var bb=0;
   if (img.name) bb = img.name.substring(6,7); else	// name="sncale[bb]" from HTML below
   if (img.id) bb = img.id.substring(8,9);		// id="blackbar[bb]" from HTML below

   var b=id2band(bb);
   if (view!=Views.oneband && band!=b) {
      if (view==Views.othersslow) waterfallspeed(waterslowness);
      setband(b);
   }

   if (ev.targetTouches.length == 1) {
      dragging=true;
      dragorigX=ev.targetTouches[0].pageX;
      touchXY(ev);
   }
}

function mousedownlower(ev)
{
   var pos=getMouseXY(ev);
   dragging=true;
   document.onmousemove = useMouseXYloweredge;
   dragorigX=pos.x;
   dragorigval=lo;
   return cancelEvent(ev);
}

function touchlower(ev) {
   ev.preventDefault();
   if (ev.targetTouches.length == 1) {
      touchingLower=true;
      dragging=true;
      dragorigX=ev.targetTouches[0].pageX;
      dragorigval=lo;
   }
}

function mousedownupper(ev)
{
   var pos=getMouseXY(ev);
   dragging=true;
   document.onmousemove = useMouseXYupperedge;
   dragorigX=pos.x;
   dragorigval=hi;
   return cancelEvent(ev);
}

function touchupper(ev) {
   ev.preventDefault();
   if (ev.targetTouches.length == 1) {
      dragging=true;
      dragorigX=ev.targetTouches[0].pageX;
      dragorigval=hi;
   }
}

function mousedownpassband(ev)
{
   var pos=getMouseXY(ev);
   dragging=true;
   document.onmousemove = useMouseXYpassband;
   dragorigX=pos.x;
   dragorigval=freq;
   return cancelEvent(ev);
}

function touchpassband(ev) {
   ev.preventDefault();
   if (ev.targetTouches.length == 1) {
      dragging=true;
      dragorigX=ev.targetTouches[0].pageX;
      dragorigval=freq;
   }
}


function docmousedown(ev)
{
   var fobj;
   if (!ev) fobj=event.srcElement;  // IE
   else fobj = ev.target;  // FF
   if (fobj.className == "scale" || fobj.className=="scaleabs") return cancelEvent(ev);
   return true;
}


var tprevwheel=0;
var prevdir=0;
var wheelstep=1000;
function mousewheel(ev)
{
   var fobj;
   // Win7/IE9 seems to have fixed the problem where 'ev' is null if not called directly, i.e. mousewheel(event)
   if (!ev) { 
      ev=window.event; fobj=event.srcElement;	// IE
   }
   else fobj = ev.target;	// FF or IE9

   // In IE and Win7/Chrome the wheel event is not automatically passed on to the Java applet.
   // This check will handle the mouse wheel event for any browser running on Windows (not just IE and Chrome)
   // and hopefully that will not be a problem.
   if (navigator.platform.substring(0,3)=="Win" && fobj.tagName=='APPLET' && fobj.name.substring(0,15)=="waterfallapplet") {
         var pos=getMouseXY(ev);
         var x=pos.x-fobj.offsetParent.offsetLeft;
         // scrollwheel while on the waterfallapplet; only needed in IE/Chrome because FF always passes these events on to the java applet
         if (ev.wheelDelta>0) document[fobj.name].setzoom(-2, x);
         else if (ev.wheelDelta<0) document[fobj.name].setzoom(-1, x);
         event.preventDefault();
         return;
//         return cancelEvent(ev);
   }

   // this is needed for Mac/Safari and {Mac,Linux,Win7}/Chrome when positioned on the text of a dx label
   if (fobj.nodeType==3) fobj=fobj.parentNode;	// 3=TEXT_NODE, i.e. text inside of a <div>

   if (fobj.className == "scale" || fobj.className=="scaleabs" || fobj.className.substring(0,8) == "statinfo") {
      // this is for tuning using the scroll wheel when positioned on the tuning scale
      //var delta = ev.detail ? ev.detail : ev.wheelDelta/-40;
      var delta = ev.deltaY ? ev.deltaY : ev.detail ? ev.detail : ev.wheelDelta/-40;
      var t=new Date().getTime();
      var dt=t-tprevwheel;
      if (dt<10) dt=10;
      tprevwheel=t;
      prevdir=delta; 
      if (Math.abs(delta)<wheelstep && delta!=0) wheelstep=Math.abs(delta);
      delta/=wheelstep;
      if (prevdir*delta>0 && dt<500) delta*=(500./dt);
    // limit frequency when tuning to current band - KA7OEI 20180222
      setfreq_lim(freq-delta/20);
      event.preventDefault();
      return;
//      return cancelEvent(ev);
   }

//   return true;
}

if (document.addEventListener) {
  window.addEventListener('DOMMouseScroll', mousewheel, false);
   addEventListener('wheel', mousewheel, {passive: false});    // note: "modern" browsers are supposed to use this event, but it seems to be incompatible with the old ones, and for now we'll have to support those anyway...
//  document.addEventListener('mousewheel', mousewheel, false);
//  document.addEventListener('wheel', mousewheel, false);    // note: "modern" browsers are supposed to use this event, but it seems to be incompatible with the old ones, and for now we'll have to support those anyway...
  window.addEventListener('mouseup', mouseup, false);
  window.addEventListener('mousedown', docmousedown, false);
} else {
  window.onmousewheel = mousewheel;
  document.onmousewheel = mousewheel;
  document.onmouseup = mouseup;
  document.onmousedown = docmousedown;
}




//----------------------------------------------------------------------------------------
// direct control using keyboard:
var allowkeyboard;

function keydown(e)
{
   if (!document.viewform.allowkeys.checked) return true;
   e = e ? e : window.event;
   if (!e.target) e.target = e.srcElement;
   if (e.target.nodeName=="INPUT" && e.target.type=="text" && e.target.name!="frequency") return true;  // don't intercept keys when typing in one of the text fields, except the frequency field
   var st=2;
   if (e.shiftKey) st=3;
   if (e.ctrlKey ) st=4;
   if (e.altKey || e.metaKey) st=5;
   switch (e.keyCode) {
      case 37:                                                         // left arrow
      case 74: freqstep(-st);                return cancelEvent(e);    // J
      case 39:                                                         // right arrow
      case 75: freqstep(st);                 return cancelEvent(e);    // K
      case 65: setmf ('am',  -4  ,  4  );    return cancelEvent(e);    // A
      case 70: setmf ('fm',  -5.5  ,  5.5  );    return cancelEvent(e);    // F
//      case 70: setmf ('fm',  -8  ,  8  );    return cancelEvent(e);    // F
      case 67: setmf ('cw', -0.95, -0.55);   return cancelEvent(e);    // C
      case 76: setmf('lsb', -2.7, -0.3);     return cancelEvent(e);    // L
      case 77: toggle_mute();    return cancelEvent(e);			 // M
      case 83: toggle_squelch();   return cancelEvent(e);                // S
      case 85: setmf('usb',  0.3,  2.7);     return cancelEvent(e);    // U
      case 90: if (e.shiftKey) wfset(2); else wfset(4); return cancelEvent(e);   // Z
      case 71: document.freqform.frequency.value=""; document.freqform.frequency.focus(); return cancelEvent(e);    // G
      case 66: if (e.shiftKey) setband((band-1+nbands)%nbands);        // B
               else setband((band+1)%nbands);  
               return cancelEvent(e);
   }
   return true;
}

window.onkeydown = keydown;

//----------------------------------------------------------------------------------------
// functions that create part of the HTML GUI

function document_username() 
{
  var x= readCookie('username');

  if (x) {
    x= x.replace(/[^ -~]/g, "");
    document.write('<a id="please">Dein Name oder Rufzeichen: ');
    document.write('<input type="text" maxlength="16" value="" name="username" onchange="setusernamecookie()" onclick=""></a>');
    document.usernameform.username.value=x;
  } else {
    document.write('<a id="please"><span id="please1"><b><i>Bitte trage deinen Namen oder Rufzeichen hier ein (Wird zwischengespeichert):<\/i><\/b></span> ');
    document.write('<input type="text" maxlength="16" value="" name="username" onchange="setusernamecookie()" onclick=""></a>');
  }
}


function document_waterfalls() 
{
  if (view==Views.allbands || view==Views.othersslow) nwaterfalls=nvbands;
  else if (view==Views.oneband) nwaterfalls=1;
  else { 
     nwaterfalls=0;
     document.getElementById('waterfalls').innerHTML="";
     return;
  }

  var i;
  var b;
  var s="";
  for (i=0;i<nwaterfalls;i++) {
    b = id2band(i);
    e=bi[b];
    j=e.realband;
    s+=
      '<div id="wfdiv'+i+'"></div>'+
      '<div class="scale" style="overflow:hidden; width:1024px; height:'+scaleheight+'px; position:relative" title="click to tune" id="clipscale'+i+'" onmousedown="return false">' +
        '<img src="'+e.scaleimgs[0]+'" onmousedown="imgmousedown(event,'+i+')" class="scaleabs" style="top:0px" name="s0cale'+i+'">' +
        '<img src="'+e.scaleimgs[0]+'" onmousedown="imgmousedown(event,'+i+')" class="scaleabs" style="top:0px" name="s1cale'+i+'">' +
      '</div>' +
      '<div class="scale" style="width:1024px;height:30px;background-color:black;position:relative;" id="blackbar'+i+'" title="click to tune" onmousedown="imgmousedown(event,'+i+')"><\/div>' +
      '\n';
     waterfallapplet[i]={};
     waterfallapplet[i].div='wfdiv'+i;
     waterfallapplet[i].id=i;
     waterfallapplet[i].band=b;
     waterfallapplet[i].maxzoom=bi[b].maxzoom;
  }

  waitingforwaterfalls=nwaterfalls;     // this must be before the next line, to prevent a race
  document.getElementById('waterfalls').innerHTML=s;

  if (usejavawaterfall) {
     if (typeof prep_javawaterfalls =="function") prep_javawaterfalls();
     else {
       script = document.createElement('script');
       script.src = 'websdr-javawaterfall.js';
       script.type = 'text/javascript';
       document.body.appendChild(script);
     }
  } else {
     if (typeof prep_html5waterfalls =="function") prep_html5waterfalls();
     else {
       script = document.createElement('script');
       script.src = 'websdr-waterfall.js';
       script.type = 'text/javascript';
       document.body.appendChild(script);
     }
  }

  for (i=0;i<nwaterfalls;i++) {
    scaleobjs[i] = document.getElementById('clipscale'+i);
    scaleimgs0[i] = document.images["s0cale"+i];
    scaleimgs1[i] = document.images["s1cale"+i];
    if (isTouchDev) {
       registerTouchEvents('clipscale'+i, imgtouch, touchXY);
       registerTouchEvents('blackbar'+i, imgtouch, touchXY);
    }
  }

}


function document_bandbuttons() {
    if (nvbands>1) {
//       document.write("<br>Band: ")
       var i;
       for (i=0;i<nbands;i++) document.write ("<input type=\"radio\" name=\"group0\" value=\""+bandinfo[i].name+"\" onclick=\"setband("+i+")\">"+bandinfo[i].name+"\n");
    }
}


function document_soundapplet() {
  if (usejavasound) {
     if (typeof prep_javasound =="function") prep_javasound();
     else {
       script = document.createElement('script');
       script.src = 'websdr-javasound.js';
       script.type = 'text/javascript';
       document.body.appendChild(script);
     }
  } else {
     if (typeof prep_html5sound =="function") prep_html5sound();
     else {
       script = document.createElement('script');
       script.src = 'websdr-sound.js';
       script.type = 'text/javascript';
       document.body.appendChild(script);
     }
  }
}



//----------------------------------------------------------------------------------------
// recording

var rec_showtimer;
var rec_downloadurl;

function record_show()
{
   document.getElementById('reccontrol').innerHTML=Math.round(soundapplet.rec_length_kB())+" kB";
}

function record_start() { 
   document.getElementById('reccontrol').innerHTML=0+" kB";
   if (rec_downloadurl) { URL.revokeObjectURL(rec_downloadurl); rec_downloadurl=null; }
   rec_showtimer=setInterval('record_show()',250);
   soundapplet.rec_start(); 
}

function record_stop()
{
   clearInterval(rec_showtimer);
   var res = soundapplet.rec_finish();

   var wavhead = new ArrayBuffer(44);
   var dv=new DataView(wavhead);
   var i=0;
   var sr=Math.round(res.sr);
   dv.setUint8(i++,82);  dv.setUint8(i++,73); dv.setUint8(i++,70); dv.setUint8(i++,70); // RIFF  (is there really no less verbose way to initialize this thing?)
   dv.setUint32(i,res.len+44,true); i+=4;  // total length; WAV files are little-endian
   dv.setUint8(i++,87);  dv.setUint8(i++,65); dv.setUint8(i++,86); dv.setUint8(i++,69); // WAVE
   dv.setUint8(i++,102);  dv.setUint8(i++,109); dv.setUint8(i++,116); dv.setUint8(i++,32); // fmt
     dv.setUint32(i,16,true);   i+=4;   // length of fmt
     dv.setUint16(i,1,true);    i+=2;   // PCM
     dv.setUint16(i,1,true);    i+=2;   // mono
     dv.setUint32(i,sr,true);   i+=4;   // samplerate
     dv.setUint32(i,2*sr,true); i+=4;   // 2*samplerate
     dv.setUint16(i,2,true);    i+=2;   // bytes per sample
     dv.setUint16(i,16,true);   i+=2;   // bits per sample
   dv.setUint8(i++,100);  dv.setUint8(i++,97); dv.setUint8(i++,116); dv.setUint8(i++,97); // data
     dv.setUint32(i,res.len,true);  // length of data

   var wavdata = res.wavdata;
   wavdata.unshift(wavhead);

   var mimetype = 'application/binary';
   var bb = new Blob(wavdata, {type: mimetype});
   if (!bb) document.getElementById('recwarning').style.display="block";
   rec_downloadurl = window.URL.createObjectURL(bb);
   if (rec_downloadurl.indexOf('http')>=0) document.getElementById('recwarning').style.display="block";
   var fname='';
   try {
      fname=(new Date().toISOString()).replace(/\.[0-9]{3}/,"");
   } catch (e) {};
   fname="websdr_recording_"+fname+"_"+nominalfreq().toFixed(1)+"kHz.wav";
   document.getElementById('reccontrol').innerHTML="<a href='"+rec_downloadurl+"' download='"+fname+"'>download</a>";
}

function record_click()
{
   var bt=document.getElementById('recbutton');
   if (bt.innerHTML=="stop") {
      bt.innerHTML="start";
      record_stop();
   } else {
      bt.innerHTML="stop";
      record_start();
   }
}



//----------------------------------------------------------------------------------------
// things not directly related to the SDR: chatbox, logbook

function sendchat()
{
  timeout_idle_restart()
  var xmlHttp;
  try { xmlHttp=new XMLHttpRequest(); }
    catch (e) { try { xmlHttp=new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) { try { xmlHttp=new ActiveXObject("Microsoft.XMLHTTP"); }
        catch (e) { alert("Your browser does not support AJAX!"); return false; } } }
  var url="/~~chat";
  var msg=encodeURIComponent(document.chatform.chat.value);
  url=url+"?name="+encodeURIComponent(document.usernameform.username.value)+"&msg="+encodeURIComponent(document.chatform.chat.value);
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
  document.chatform.chat.value="";
  return false;
}

function chatnewline(s)
// called by updates fetched from the server
{
  var o=document.getElementById('chatboxnew');
  if (!o) return;
  if (s[0]=='-') {
     // remove line from chatbox
     var div=document.createElement('div');
     div.innerHTML=s;
     s=div.innerHTML;
     var re=new RegExp('<br>'+s.substring(1).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")+'.*','g');
     o.innerHTML=o.innerHTML.replace(re,'<br>');
     return;
  }
  // add line to chatbox
  o.innerHTML+='<br>'+s+'\n';
  o.scrollTop=o.scrollHeight;
}

function sendlogclear()
{
  document.logform.comment.value="";
}

function sendlog()
{
  var xmlHttp;
  wait(2000);
  try { xmlHttp=new XMLHttpRequest(); }
    catch (e) { try { xmlHttp=new ActiveXObject("Msxml2.XMLHTTP"); }
      catch (e) { try { xmlHttp=new ActiveXObject("Microsoft.XMLHTTP"); }
        catch (e) { alert("Your browser does not support AJAX!"); return false; } } }
  var urlt="/~~loginsert";
  var lfreq=nominalfreq();
  lfreq=lfreq.toFixed(3);
  urlt=urlt
     +"?name="+encodeURIComponent(document.usernameform.username.value)
//     +"&freq="+nominalfreq()
     +"&freq="+lfreq
     +"&call="+encodeURIComponent(document.logform.call.value)
     +"&comment="+encodeURIComponent(document.logform.comment.value)
     ;
  var url=urlt.substring(0,128);
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
  document.logform.call.value="";
  document.logform.comment.value="";
  xmlHttp.onreadystatechange=function()
    {
    if(xmlHttp.readyState==4)
      {
      document.logform.comment.value=xmlHttp.responseText;
      }
    }
  setTimeout("document.logform.comment.value=''",1000);
  return false;
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

