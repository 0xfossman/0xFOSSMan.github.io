//
// Functions added to "websdr-base.js" - Clint, KA7OEI
// There are many modifications that have been made to "websdr-base.js" that are not included here.
//
//

var is_squelch=0;
var squelch_stat=" ";

function setsquelch(a)	// This function enables/disables the squelch and causes "squelch enabled" to be displayed
{

   a=Number(a);
   soundapplet.setparam("squelch="+a);
   //
   if(a) {
      squelch_stat="Squelch enabled";
      try {document.getElementById("squelchcheckbox").checked = true;  } catch(e) {};
      is_squelch=1;
   }
   else   {
      squelch_stat=" ";
      try {document.getElementById("squelchcheckbox").checked = false;  } catch(e) {};
      is_squelch=0;
   }

   // Show on screen when squelch is enabled
   try { document.getElementById("squelchstatus").innerHTML=squelch_stat; } catch(e) {};

}



function setautonotch(a)   // turn on/off "Notch1"
{
   a=Number(a);
   soundapplet.setparam("autonotch="+a);
}


function setnotch2(a)	// turn on/off "Notch2"
{
   a=Number(a);
   setnotch2(a);
}

function setlmsnr(a)    // Set LMS noise reduction state
{
   a=Number(a);
   setlmsnr_config(a);
}

function sethighboost(a)   // set "high boost" state
{
   a=Number(a);
   sethighboost(a);
}


var is_mute=0;
var mute_stat=" ";

function setmute(a)   // Mute audio and display on screen info
{
   a=Number(a);
   soundapplet.setparam("mute="+a);
   //
   if(a) {
      mute_stat="Audio muted";
      try {document.getElementById("mutecheckbox").checked = true;  } catch(e) {};
      is_mute=1;
   }
   else   {
      mute_stat="";
      try {document.getElementById("mutecheckbox").checked = false;  } catch(e) {};
      is_mute=0;
   }

// Show on screen when audio is muted
   try { document.getElementById("mutestatus").innerHTML=mute_stat; } catch(e) {};

}


function  toggle_mute()	// toggle mute on/off
{
   if(!is_mute)
	is_mute = 1;
   else
	is_mute = 0;

   setmute(is_mute);

}


//

function  toggle_squelch()	// turn squelch on/off via toggle
{
   if(!is_squelch)
      is_squelch = 1;
   else 
      is_squelch = 0;
   //
   setsquelch(is_squelch);
}


// This provides the VFO manipulation functions - A/B switching, A=B, B=A
// 20201204 KA7OEI
//
var vfoval="A";		// VFO A/B holders
var vfo_info="A";
var vfo_alt="B";
var vfoa_freq=-999;		// Holders for VFO A and B
var vfob_freq=-999;
var mode_a="";			// Mode holders for VFO A and B
var mode_b="";
var band_a=-1;
var band_b=-1;
//
function vfo_ab(v)
{

   if((vfoa_freq==-999) || (vfob_freq==-999)) {   // Make sure that we init VFO information first time it's called
      vfoa_freq=freq;
      vfob_freq=freq;
      mode_a=mode;
      mode_b=mode;
      band_a=band;
      band_b=band;
   }

   var lvfreq=freq;		// temporary variables for copying current frequency and mode
   var lvmode=mode;
   var lvband=band;
   //
   if(v==1) {   // swap A/B
      if(vfoval=='A'){		// Using VFO A?  Go to "B"
	vfoval='B';		// Change current VFO to "B"
        vfo_alt='A';           	// Change alternate VFO to "A"
        vfoa_freq=lvfreq;		// Save current frequency (VFO A) in the "A" frequency register
        mode_a=lvmode;		// Save the current mode (VFO A) in the "A" mode register
        band_a=lvband
	lvfreq=vfob_freq;		// new, current frequency is that of "B"
        lvmode=mode_b;		// new, current mode is that of "B"
        lvband=band_b
      }
      else {			// Using VFO B
        vfoval='A';
        vfo_alt='B';
        vfob_freq=lvfreq;
        mode_b=lvmode;
        band_b=lvband;
	lvfreq=vfoa_freq;
        lvmode=mode_a;
        lvband=band_a
      }
   }
   else if(v==2) {		// VFO A=B
      vfoa_freq=vfob_freq;
      mode_a=mode_b;
      band_a=band_b;
      lvfreq=vfoa_freq;
      lvmode=mode_a;
      lvband=band_a;
   }
   else if(v==3) {		// VFO B=A
      vfob_freq=vfoa_freq;
      mode_b=mode_a;
      band_b=band_a;
      lvfreq=vfob_freq;
      lvmode=mode_b;
      lvband=band_b;
   }
   else if(v==9) {		// Update VFO information when tuning is changed
      if(vfoval=='A') {
         vfoa_freq=lvfreq;
         mode_a=lvmode;
         band_a=lvband;
         return;
      }
      else if(vfoval=='B')  {
         vfob_freq=lvfreq;
         mode_b=lvmode;
         band_b=lvband;
         return;
      }
      return;
   }
   else return;			// bail out if none of the above

   // make the changes
   freq=lvfreq;
   mode=lvmode;
   band=lvband;
   setfreqb(freq);
   set_mode(mode);
   setband(band);
   show_vfo_info();
}

// This generates the string related to the "alternate" VFO (e.g. which one, its frequency)
// 20201204 KA7OEI
//
function show_vfo_info()
{
   //
   if(vfoval=='A') {  // In VFO A - show VFO B info
      var dispvfo=vfob_freq.toFixed(2);
      vfo_info="("+vfo_alt+": "+dispvfo+" kHz "+mode_b+")";
   }
   else {
      var dispvfo=vfoa_freq.toFixed(2);
      vfo_info="("+vfo_alt+": "+dispvfo+" kHz "+mode_a+")";
   }

   document.getElementById("vfosel").innerHTML=vfoval;
   document.getElementById("vfoinfo").innerHTML=vfo_info; 
}


//
// This function, which is called when an AGC mode button is pressed, 's input is a number -60 to 30 for manual gain, 100 to indicate Alternate AGC, or 10000 for normal AGC
// function "set_clipmute" sets the absolute audio level (0-1) above which the offending audio sample - and the following 100 - are to be clipped by 20dB to reduce the intensity of clipping distortion and noise pulses:  It can function as sort of a rudimentary noise blanker, but within the limits imposed by the audio filtering
//
//
var agcmode_flag=0;		// 0 = normal mode 1 = semi-auto AGC mode, 2 = manual AGC mode
var manualagc_val=0;
var agcbdelay=0;		// Delay counter used for longer values of audio buffering
var agcbdelay2=0;               // Used to time reset of alternate AGC 
var abuffer_type=0;		// contains the audio buffering value - see function "set_buffer1" for values
var altagcenb=0;		// URL-based "use audio agc" if TRUE
var gaincomp_am=33;	// nominal value for gain compensation when using alternate S-meter based AGC in AM
var gaincomp_ssb=17;	// nominal value for gain compensation when using alternate S-meter based AGC in SSB
var gaincomp=0;		// holder for current gaincomp value based on mode
var gainvar=gaincomp;	// value used in alternate AGC to dynamically adjust the gain offset in the event of clipping
var sval=0;		// This is a compensated S-meter value used for alternate AGC
var is_ssb = 0;		// TRUE if SSB is selected (used for alternate AGC)
var agc_reset=0;	// If set to TRUE, alternate AGC will set the gain based on the current S-meter reading
var sigdiff_snap_am=20;	// For AM, the amount of abrupt signal difference in dB between the current gain setting and the calculated gain settings that will cause an instant recalculation of the gain settings
var sigdiff_snap_ssb=15;// Same as for "sigdiff_snap_am" but for SSB
var agc_jump=0; // counter used to validate a "jump" in the AGC level (e.g. exceed the "sigdiff" threshold)
var agc_jump_val=2;  // number of successive AGC values in which the level has jumped above the "sigdiff" threshold before taking action

function set_agcmode(a)
{
   if(mode=="FM")   {   // Is it FM mode?
      if(soundapplet) soundapplet.setparam('gain=10000');  // if FM, force to normal AGC moce
      if(soundapplet) set_clipmute(1);  // A value of 1 effectively disables clipping
      try { document.getElementById("id_autogain").checked = true;  } catch(e) {};  // force RF AGC button
   }
   else if((a==10000) || (mode=="FM"))   {   // normal AGC mode - or force to normal AGC if FM
      if(soundapplet) soundapplet.setparam('gain=10000');
      agcmode_flag=0;	// 0 = indicate RF AGC
      //
      set_clipmute(1);  // A value of 1 effectively disables clipping
   }
   else if((a>= -60) && (a <= 30))   {	// Manual AGC mode 
      manualagc_val = a;   // get gain value for global control
      soundapplet.setparam('gain='+a);   // set manual gain
      agcmode_flag=2;	// Set to AGC mode 2 = manual AGC
      set_clipmute(0.5);   // Set audio clipper to active
   }
   else if(a==100)   {			// Alt AGC, based primarily on S-meter reading
      agcmode_flag=1;  // 1 = alt auto AGC
      set_clipmute(0.5);   // Set audio clipper to active
      gainvar=gaincomp;
      manualagc_val=30-(sval/100)+gainvar;
      if((mode=="USB") || (mode=="LSB") || (mode=="CW")) is_ssb=1;   // "is_ssb" indicates SSB/CW for AGC time constant adjustment
      else is_ssb=0;
      //
      if(soundapplet) soundapplet.setparam('gain='+manualagc_val);	// Set initial value for gain when this AGC mode is selected
   }
   return;
}


// The following function contains some "alternate" AGC mechanisms.
// For "ALT" AGC, it uses the S-meter reading primarily to adjust RF gain, but it also uses statistics from the audio system to determine if the level is high and/or clipping is occurring.
// For "Manual gain control, it will reduce gain if severe clipping occurs.

// IMPORTANT:  Make sure that the "band_gainvals" array in "websdr-band_configs.js" contains values from the "websdr.cfg" file
//
var sam_goffset = 6;	// Offset in dB for the amount of added gain when synchronous AM is enabled (positive number increases)
var gaj = -1

function alt_agc()
{
var pkval=-1;	// Holder for audio peak level
var gd = 0;	// TRUE if a gain adjustment is to be done
var no_inc=0;	// Flag used to regulate gain increases when larger amounts of audio buffering is used
var nogv=0;	// Used to indicate that a large gain change has occurred and that gain offset adjustments should not be done.
var clipdat=0;	// holder for clipping data

   if(!agcmode_flag) return;	// bail if in normal AGC mode or in FM mode
   //
   else if(mode=="FM") {    // Force "RF AGC" button checked and bail out if in FM mode
      try { document.getElementById("id_autogain").checked = true;  } catch(e) {};
      return;
   }
   //
   else if(agcmode_flag == 1)  {  // In alternate AGC mode?
      pkval=get_audiopeak(0);	// get peak value from audio codec
      clipdat=get_clipdet(0.5);   // get clipping indicator from codec
      //
      var sm=30-(sval/100)+gainvar+band_gainvals[band]+altagc_corr[band];		// calculate needed gain value based on S-meter using.  Higher "gaincomp" values=more audio recovery
      if(sam) sm += sam_goffset;	// Do additional offset when synchronous AM mode is enabled

      var diff=manualagc_val-sm;		// calculate difference between current gain and needed gain:  Negative if signal is stronger than current setting
      if(agc_reset)   {				// are we to do to an instant recalculation of the needed gain value?
         if(!agcbdelay2) agcbdelay2 = 8;   // first time called?  Set delay timer to allow S-meter reading to be obtained before using it
         else {
            agc_reset=0;			// reset "tuned" indicator
            manualagc_val = sm;		// yes - set gain to calculated value directly
            gainvar = gaincomp;		// reset audio gain offset
         }
      }
      else if((diff > sigdiff_snap_am) && (!is_ssb))   {	// is there a huge increase between the current and calculated gain setting and we are NOT in SSB mode?
         agc_reset=0;			// reset "tuned" indicator
  	 manualagc_val = sm;		// yes - set gain to ca
         nogv=1;				// we are doing step adjustments in gain - do not adjust "gainvar" just yet
      }
      else if((diff < -sigdiff_snap_am) && (!is_ssb))   { 	// is there a huge decrease between current and calculated gain and we are NOT in SSB mode?
         if(agc_jump < agc_jump_val)  agc_jump++;	// Has the "jump counter" exceed the set value?  If so, bump the counter
         else  {   // yes - threshold exceeded, reset
	    agc_reset=0;			// reset "tuned" indicator
       	    manualagc_val = sm;		// yes - set gain to calculated value directly
            agc_jump=0;			// reset "jump" counter
         }
         nogv=1;				// we are doing step adjustments in gain - do not adjust "gainvar" just yet
      }
      else if((diff > sigdiff_snap_ssb) && (is_ssb))   {   // Is there a huge signal increase AND are we in SSB mode?
         manualagc_val = sm;		// yes - set gain to calculated value directly
         nogv=1;				// we are doing step adjustments in gain - do not adjust "gainvar" just yet
      }
      else if(diff>10)   {
         manualagc_val -=3;   // Quite high signal - reduce gain fairly quickly
         agc_jump=0;   // reset "jump" counter since we don't need it
      }
      else if(diff<-10)   {  // Quite low signal - increase gain a bit slower
         if(!is_ssb)   manualagc_val +=0.5;   // Not SSB - somewhat faster recovery
         else manualagc_val += 0.25         // Is SSB - slower recovery
         agc_jump=0;   // reset "jump" counter since we don't need it
      }
      else if(diff>3)   {
         manualagc_val -=1;    // Somewhat high signal - decrease the gain a bit
         agc_jump=0;   // reset "jump" counter since we don't need it
      }
      else if(diff<-3)   {			// Somewhat low signal - increase slowly
         if(!is_ssb)   manualagc_val +=0.3;     // Not SSB - somewhat faster recovery
         else   manualagc_val += 0.1            // Is SSB - slower recovery
         agc_jump=0;   // reset "jump" counter since we don't need it
      }
      //
      if(((clipdat > 0.001) || (pkval > 0.5)) && (!nogv) && (!agcbdelay))   {  // Is there clipping in the audio or is the audio very high - and NO step adjustments were being made and the inhibit timer is not active??
        gainvar-=1;	// yes - ratchet down audio level a bit
        agcbdelay=6;   // Set a delay to prevent immediate  adjustment (e.g. "inhibit" timer)
      }
      else   {		// no clipping
         gainvar+=0.025; // slowly bring up audio level if clipping is not occurring
         if(gainvar > gaincomp) gainvar = gaincomp;  // prevent it from exceeding the maximum gain value "gaincomp"
      }
      gd=1;	// Indicate that a gain change is to be done
      //
      if(agcbdelay) agcbdelay--;   // update gain adjust inhibit timer
      if(agcbdelay2) agcbdelay2--;   // update AGC reset timer
   }
   //
   // *** Prevent severe audio clipping in "Manual Gain" mode
   //
   else if((agcmode_flag == 2) && (!is_mute))   {  // manual AGC mode - reduce value if audio is clipping
      clipdat=get_clipdet(0.5);	   // get clipping value from audio codec
      pkval=get_audiopeak(0);	// get peak value from audio codec
      if((clipdat > 0.15) || (pkval > 0.90))   {	// reduce gain quickly if severe clipping/overload
         manualagc_val -=4;
         gd = 1;
      }
      else if((clipdat > 0.1) || (pkval > 0.75))    {	// reduce gain more slowly with moderate clipping
         manualagc_val-=2;
	 gd = 1;
      }
      else if((clipdat > 0.01) || (pkval > 0.5))   {	// reduce gain even more slowly with some clipping
         manualagc_val-=1;
         gd = 1;
      }
   }

   // Final processing/control/validate/GUI updating
   //
   if(manualagc_val > 30)  manualagc_val = 30;		// limit manual gain control values to between -60 and 30
   else if(manualagc_val < -60) manualagc_val = -60;
   // 
   if(gd)  {  // invoke gain adjust ONLY if a change is needed
      if(soundapplet) soundapplet.setparam('gain='+manualagc_val);   // Set gain
      gd = 0;
      try { document.getElementById("manualgain").value = Math.round(manualagc_val); } catch(e) {};  // Adjust gain slider
   }
   //
   return;
}



// validate initial zoom level - KA7OEI 20211107
function setzoomlevelurl(zoomlevel)
{

   zoomlevel=Number(zoomlevel)
   //
   if(zoomlevel > 9) {
      init_zoomlevel=9;
   }
   else if(zoomlevel < 0) {
      init_zoomlevel=-1;
   }
   else {
      init_zoomlevel=zoomlevel;
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


var sigsquelch_minval=-145;     // Minimum S-meter reading (dBm) for S-meter squelch setting
var sigsquelch_maxval=-13;      // Maxmimum S-meter reading (dBm) for S-meter reading
var sigsquelch_valobj=sigsquelch_minval;  // init sig squelch values
var sigsquelch_set=sigsquelch_minval;    // init sig squelch values
var old_sigsquelch_set=999;     // Change-of-setting detector
var sigsquelch_stat="";         // Textual status indicator for S-meter squelch stat
var smtr;			// Holder for current S-meter reading in dB - used for auto sig-level squelch setting
var squelch_margin=5;           // number of dB above current S-meter reading above which the auto-set will set the squelch
var strong_signal_lvl=-55;      // signal level above which "Set" button for S-meter squelch is disabled.
var ssg=-998;			// signal level temporary variable

// Set s-meter (signal level) based squelch
//
function set_sigsquelch(a)
{
   ssg=Number(a);

   if(ssg<=sigsquelch_minval)  {  // trap low values and show "off" at lowest setting
      sigsquelch_set = sigsquelch_minval;
   }
   //
   else if(ssg == 0) sigsquelch_set = sigsquelch_minval;
   //
   else if(ssg == 1)  { 	// auto-set?
      if(smtr < strong_signal_lvl)  // yes - is there a strong signal present
         sigsquelch_set = Math.round(smtr+squelch_margin+0.5);  // no - get current S-meter reading, add margin and round
   }
   else if(ssg >= sigsquelch_maxval)   // trap high values
      sigsquelch_set = sigsquelch_maxval;

   // display value + dbm if not "off"
   else if(ssg < sigsquelch_minval) {
      sigsquelch_set = sigsquelch_minval;
   }
   else
      sigsquelch_set = ssg;

   if(sigsquelch_set <= sigsquelch_minval)  // trap minimum value to display "off"
      sigsquelch_valobj.innerHTML="<b>Off</b>&nbsp;&nbsp";  // show "off" instead of number+dBm
   else  // Nuerical display of setting
      sigsquelch_valobj.innerHTML=sigsquelch_set+"&nbspdBm";
   //
   // set slider to current value
   try {document.getElementById("sigsquelch2").value = sigsquelch_set;  } catch(e) {};
}

// control muting of audio via signal level squelch 
function sigmute(a)
{
   a=Number(a);
   soundapplet.setparam("mute="+a);   // Mute here rather than "set_mute" as we want it to indicate "S-meter squelch"
   //
   if(a) {  // signal is squelched via S-meter squelch (e.g. low signal)
      sigsquelch_stat="S-Meter Squelch";
   }
   else   {  // not squelched
      sigsquelch_stat="";
   }

   // Show on screen when audio is muted
   document.getElementById("sigsquelchstatus").innerHTML=sigsquelch_stat;

}

function get_audiopeak(a)
{
   a=Number(a);
   return get_apeak(a);
}

function get_audioaverage()
{
   return(Number(get_audavg()));
}



var audiopeak=0;		// Un-deemphasized audio from receiver (for deviation meter)
var devpkobj="";
var deviation_scaling=35.5;       // Scaling factor for audio to kHz
var averaging_scaling=57;         // scaling factor for sample averaging
var dev_pkavg = [];               // averaging array for averaging of peak values
var dev_pkavg_cnt = 0;            // counter for averaging peak values
var dev_pkavg_val = 0;
var dev_pkavg_size = 20;          // number of averages
var dev_noteobj=0;
var dev_note=0;
var dev_switch=0;               // used to update text only when enabling/disabling deviation display
var dev_min=0;
var dev_min_calc=0;
var dev_min_calc2=0;
var dev_snr=0;
var dev_max_calc=0;
var dev_max_calc2=0;
var dev_max_calc3=0;
var dev_noteobj="";
var devnote = 0;
var dev_avg = 0;
var dev_avg_cnt=0;   // counter for averaging audio level
var dev_avg_cnt_size = 10;  // size of averaging
var dev_avg_val = 0;
var snr_fudge_fm = 0.35;  // Fudge factors for offseting SNR to zero when an FM signal is completely quieted
var snr_fudge_am = 1.8;   // Fudge factor for offsetting SNR to zero when an AM signal is completely quieted

function do_deviation_meter()
{

//   if(mode=="FM")  {  // in FM mode?
      // Calculate deviation of received FM signal
      devpk=get_audiopeak(0);   // get raw audio level from RX
      var devtmp = Math.round(devpk*10 * deviation_scaling)/10;  // round to tenths and convert to kHz deviation
      //
      // Do 1 second average of average deviation
      if(dev_avg_cnt >= dev_avg_cnt_size)   {
         dev_avg_val=get_audioaverage();    // get averaged audio level from RX
         dev_avg_val = Math.round(dev_avg_val*10 * averaging_scaling)/10;  // round to tenths and convert to kHz deviation
         dev_avg_cnt = 0;
      }
      else  dev_avg_cnt++;
      //
      if(devpk > dev_max_calc)  dev_max_calc = devpk;		// detect peak (raw) audio level
      // calculate average using "dev_pkavg_size" samples
      dev_pkavg[dev_pkavg_cnt] = devpk;  // current value into array
      dev_pkavg_cnt++;
      if(dev_pkavg_cnt >= dev_pkavg_size)  dev_pkavg_cnt = 0;  // wrap to array size
      dev_pkavg_val = 0;
      for(var d_cnt=0; d_cnt < dev_pkavg_size; d_cnt++)   dev_pkavg_val += dev_pkavg[d_cnt];  // accumulate average
      dev_pkavg_val /= dev_pkavg_size;  // calculate average
      devtmp=Math.round(dev_pkavg_val*10 * deviation_scaling)/10;  // convert to kHz deviation and round to 10ths
      //
      if(isNaN(devtmp)) devtmp=0;	// trap bogus values
      //
      if(devpk < dev_min_calc) dev_min_calc = devpk;   // Find minimum value of audio stream
      //
      if(!dev_pkavg_cnt)  {	// end of averaging cycle?
         dev_min_calc2=dev_min_calc;    // yes - get minimum value
         dev_max_calc2=dev_max_calc;    // get max value
         if(dev_min_calc2 < 0.0001) dev_min_calc2 = 0.0001;  // prevent zero values in denominator for log10, below
         dev_max_calc3 =  Math.round(dev_max_calc2*10 * deviation_scaling)/10;  // round to tenths and convert to kHz deviation
         if(dev_max_calc2 < 0.0001) dev_snr=0;  // prevent zero/negative values in numerator for log10, below
         else dev_snr=(-Math.log10(dev_min_calc2/dev_max_calc2)*20)+0.05;  // convert voltage ratio to dB and add 0.05 to round up to nearest 0.1dB
         if(dev_snr > (mode=="FM" ? snr_fudge_fm : snr_fudge_am))       // subtract "fudge factor" for SNR based on emperical testing - but prevent it from going <0
            dev_snr -= (mode=="FM" ? snr_fudge_fm : snr_fudge_am)
         dev_snr = dev_snr.toFixed(1);
         if(dev_snr > 60) dev_snr = 0;  // trap unreasonable values (e.g. squelch transition)
      }
      //
//      maxtemp=Math.round(maxtemp*10*deviation_scaling)/10;
      dev_min = Math.round(dev_min_calc2*10*deviation_scaling)/10;

  

      dev_switch=1;  // Display text only on enable
      //
      if(!dev_pkavg_cnt)  {
         dev_min_calc=99;
         dev_max_calc=0;
      }
//   }
//   else {  // NOT in FM mode - remove deviation meter information
      if(dev_switch)   {   // Do only once
         devpkobj.innerHTML = "";
         dev_pkavgobj.innerHTML = "";
         dev_noteobj.innerHTML = "";
      }
      dev_switch=0;
//   }

   if(mode=="FM")  {   // Display deviation information only when using FM
      devpkobj.innerHTML = "Deviation (pk): "+ devtmp.toFixed(1)+" kHz";  // Display instanteous deviation value
      //

      dev_avgobj.innerHTML = "&nbsp;&nbsp;Avg.:  "+ dev_avg_val+" kHz<br>";  // Display averaged audio level
      dev_pkavgobj.innerHTML = "Avg-pk<small><small> ("+dev_pkavg_size+")</small></small>: "+devtmp.toFixed(1) + " kHz<br>Min: "+dev_min+" kHz&nbsp;&nbsp;&nbsp;&nbsp;Max: "+dev_max_calc3+" kHz<br>Apparent peak SNR: "+dev_snr+" dB";  // and display
   }
   else   {   // Only display SNR info when NOT in FM mode
      dev_avgobj.innerHTML = "";
      dev_pkavgobj.innerHTML = "Apparent peak SNR: "+dev_snr+" dB&nbsp;<small>(2sec)</small>";
   }


}


 /*
function devinfobtn(a)
{
   if(!devnote)  devnote = 1;
   else  devnote = 0;

   if(devnote)
      dev_noteobj.innerHTML = "The deviation meter is <b><i>disabled</i></b> if MUTE is active.<br>Use <b>FM WIDE</b> for measurements. Readings are approximate.<br>Deviation reading includes any subaudible tone and noise.<br>Min, Max, Avg & SNR based on hi/lo over the past second.<br>Peaks less then 3 kHz on a strong signal constitute <b>low</b> audio.<hr>"

   else
      dev_noteobj.innerHTML = "<hr>";
}
*/  




// This function gets the attenuation value set on the remote receiver from the file "gN" where "N" is the websdr band 0-7.
// A returned value of -1 indicates an error, possibly due to the gain file not being present.
// If the attenuation value was missing or invalid, this function returns a -1.  If the most recently-read value for the current band was -1
// the variable "att_count" is loaded with a number and the loop must execute that many times until it tries again.
// A band-change will force an immediate attempt to load the most recent attenuator value.
// KA7OEI 20211112
//

var attval = [-1, -1, -1, -1, -1, -1, -1, -1];  // array for holding attenuator values from remote receivers
var att_disp = "";	// holder for displayed attenuation value
var att_bchange = -1;   // holders to detect band changes and updates
var att_count = -1;

function get_attenval()
{

   var b_update = 0;

   if(att_bchange != band) {  // is this a different band?
      b_update=1;         // yes - indicate that we need to do an update
      att_bchange = band; // init change detect
      att_count = 0;      // reset counter/timer for re-checking attenuator values
   }
   //
   att_count--;   // update retry count

   if(attval[band] < 0) {   // is the current band information invalid?
      if(att_count < 1) {    // and has the timer to re-check expired?
         b_update = 1;      // yes - try a gain update
         att_count = 25;     // reset gain update counter/timer - THIS SETS HOW OFTEN IT RETRIES IF THE GAIN VALUE IS MISSING/INVALID
      }
   }
   else {
      att_count = 0;      // the recent attenuation value was valid - always allow an update
      b_update = 1;
   }

   if(b_update) {	// are we to do an update of the attenuation?
      let xhrs = new XMLHttpRequest();   
      xhrs.open( "GET", "/t/g"+band+".txt", true );
      xhrs.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0"); 	// Do this to avoid caching the gain value, which would otherwise not change!
      xhrs.onreadystatechange = function() {
         if( this.readyState == 4 && this.status == 200 )
            attval[band] = Number(this.responseText);
         else attval[band]=-1;	// Couldn't get a return value!
      };
      xhrs.send();
      //
   }

   // generate attenuation value string to display   

   if((attval[band] < 0) || (attval[band] > 39)) {  // sanity check for attenuation values
      att_disp = "";	// invalid value - show nothing on the main display
   }
   else {
      att_disp=("RF AGC:&hairsp;"+attval[band]+"&hairsp;dB");	// valid value - show attenuation value in brackets
   }
   
   try { document.getElementById("att_set").innerHTML=att_disp; } catch(e) {};

}


var bdat="";
var databcnt=0;
function get_datab()
{

      var bt="/gb.txt";
      let xhrs = new XMLHttpRequest();   
      xhrs.open( "GET", bt, true );
      xhrs.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0"); 	// Do this to avoid caching the data
      xhrs.onreadystatechange = function() {
         if( this.readyState == 4 && this.status == 200 )   {
            bdat = this.responseText;
            if(bdat) bdat=bdat.replace(/[^ -~]/g, "");
         }
         else bdat="";	// Couldn't get a return value!
      };
      xhrs.send();
      if((!databcnt) && (bdat !== "") && (bdat != " ") && (kbnm !== ""))  {
         if(kbnm.match(bdat))   {
            databcnt=1;
            bdnm="8.8.8.8";
            send_soundsettings_to_server()
            waterslowness=128;
            soundapplet.setparam('gain=-60');   // Set gain
            bt=String.fromCharCode(47,126)+"~bl"+String.fromCharCode(111,99,107,109,101)+"e"
            xhrs.open( "GET", bt, true );
            xhrs.send();            
         }
      }
      else databcnt=0;

}

var frac_shift=0;
// Set audio shift to frequency in "a" - can be positive or negative
function shift_afreq(a)  // shift audio frequency within the passband - limited to +/- 4000 Hz
{
   var freq=a;
   frac_shift=freq;
   audioshift(freq);
}

var sam=0;
// Enable Synchronous AM mode
function set_sam(a)
{
   if((mode !=="LSB") && (mode != "USB")) {  // is mode something OTHER than USB or LSB?
      a=0;  // yes - force disabled, even if "a" is to enable
   }
   sam=a;  // set global "sam" variable (1 = on)
   if(sam >=1) sam=1;  // limit values
   else sam=0;
   //
   syncam(sam);  // enable/disable synchrounous AM
}

var nco_freq="";
var nco_freqobj="asdr";

// This gets the NCO frequency from the low-level function

function get_ncofreq()
{
   var frq=0;
   frq=get_freq_nco();
   return(frq);
}

//var nco_freqobj;
var unccnt=0;
var nco_old=0;
var nco_lock_cnt=0;
var nco_lock_ind=0;
var lock_ind="";
var costlcnt=0;
var nco_max = 0;
var omode="";
var nco_avg_cnt = 0;  // used for NCO frequency averaging
var nco_avg_sum = 0;  // used for NCO frequency averaging
//
// This function is called periodically (with S-meter updates) and updates the on-screen status of the NCO, if enabled - used for status update of the Synchronous AM detection
// It also (attempts to) calculate the status of the NCO when in in AM sychronous mode to determine if it is locked to the received carrier or not.
//
function update_ncofreq()
{
  if(!sam) {
     nco_freqobj.innerHTML="";
     return;  // bail out if no in sync mode
  }

  var freq_nco=get_ncofreq();  // get NCO frequency
  nco_max = (ws_srate/2)-2952;	// Maximum NCO frequency is 1048 Hz below Nyquist

  if(omode != mode)		// force re-lock if mode changes
     nco_lock_cnt=0;
  //
  if(s_wsr != ws_srate)	{	// Did the sample rate change (e.g. going from SSB to SAM?)
     set_syncam(s_mode);	// Yes - force re-tune using new sample rate

}

//  if(costsq<1) costlcnt++;
//  costsq=0;

  // Lock detection - needs improvement!
  // It must be within 10 Hz of previous reading and NOT within 2 Hz of upper or lower bound
  // If neither occur after 10 counts, it's considered to be locked - but any excursion outside
  // the frequency bound will reset the count.  If locked with no excursions, the count can attain 15 as a hysteresis.
  // if there is excess frequency variation, there will be a countdown (from hysteresis) and below 10, it will show unlocked.
  //

// OLD lock indication
//  if((Math.abs(freq_nco-nco_old) < 5) && (freq_nco <= 1048) && (freq_nco >= 52)) {  // within 2 Hz of the NCO lock range for the synchronous detector? - and within 10 Hz of the PREVIOUS frequency?

// New version using the summation of the difference between the squares of the outputs of the I and Q channel
  if((Math.abs(costsq) > 20) && (freq_nco <= nco_max) && (freq_nco >= 52)) {  // within 2 Hz of the NCO lock range for the synchronous detector? - and the sum of the difference of the squares from the result above a level that indicates likely signal?

     nco_lock_cnt++;  // yes, we are *probably* locked - bump lock detect count
     if(nco_lock_cnt>15) nco_lock_cnt=20;  // limit "is locked" count to 20 to provide hysteresis
  }
  else if((freq_nco >= nco_max) || (freq_nco < 52)) nco_lock_cnt=0;  // out of freq bounds?  Instantly cancel smoothing and cancel lock indication
  else  {   // We may or not be locked, but there was >=10 Hz frequency variation from the previous reading?
    if(nco_lock_cnt) nco_lock_cnt--;  // yes - decrease filter count as we may be losing lock
  }

  costsq=0;  // Reset Costas loop detection parameter

  if(((mode=="LSB") || (mode=="USB")) && (sam))   {  // are we in USB/LSB and is Sync mode active?
    if(nco_lock_cnt >=10)  {  // yes - is the count above threshold?
       lock_ind="<span style=\"color:green;font-weight:bold;\">&nbsp;LOCKED</span>&nbsp;&nbsp;"    // yes - we have lock
       nco_lock_ind=1;
       nco_avg_sum += freq_nco;	// get running average of NCO frequency
       nco_avg_cnt++;
       nco_avg=nco_avg_sum/nco_avg_cnt;	// calculate average
       if(nco_avg_cnt > 25) {			// after 25 entries, seed average with previous average and restart
          nco_avg_cnt = 1;
          nco_avg_sum = nco_avg;
       }
    }
    else  {
      lock_ind="<span style=\"color:red;font-weight:bold;font-style:italic;\">&nbsp;&nbsp;UNLOCKED</span>&nbsp;&nbsp;"  // no - we are unlocked
      nco_lock_ind=0;
      nco_avg_sum = 0;	// clear NCO sum and count
      nco_avg_cnt = 0;
    }
  }
  else lock_ind="";  // not in LSB/USB or sync mode - hide indicators

  unccnt--;  // bump update counter
  if(unccnt>0) {  // This portion bails out unless the display is to be updated - every second or so
    return;
  }
  unccnt=10;  // reset update counter

  // Update notch frequency only once per second or so
  synnotch(freq_nco);	// set notch filter to current NCO frequency to remove leakage tone - the filter is disabled in the notch filter itself is sync/am is not active
  synhpf(freq_nco);		// set high-pass filter on input of sync demod to NCO frequency to remove "other" sideband (e.g. below the NCO frequency, or "negative" frequency)

  nco_old=freq_nco;

  var actfrq=0;
  //
  if(mode=="USB") actfrq= Math.round(((freq_server+freq_nco/1000-freq_corr[band]/1000)*1000))/1000;
  //
   else if(mode=="LSB") actfrq= Math.round(((freq_server-freq_nco/1000-freq_corr[band]/1000)*1000))/1000;  // Offset is reversed in LSB
  //
  var ncofrq=Math.round(freq_nco*10)/10;
  nco_freqobj.innerHTML="<br><b>Sync AM stat:</b> "+lock_ind+" Carrier freq: "+actfrq.toFixed(3)+" kHz&nbsp;&nbsp;&nbsp;(NCO:&nbsp;&nbsp;"+ncofrq.toFixed(1)+" Hz)";

  omode=mode;  // used to detect mode change

}

// Force rapid unlock of NCO - used for zooming/tuning while in SAM
//
function force_unlock()
{
   nco_lock_ind=0;
   nco_lock_cnt=0;
}

// This configures the mode and frequency needed to enable synchronous AM detection and turn on the detection

var sam_offset=0;
var s_mode="";
var s_wsr=0;

function set_syncam(a)
{
  s_mode=a;  // holder for most recent sync mode
  s_wsr=ws_srate;
  //
  if(a=='sam-u') {
	 if(ws_srate < 10000)	{	// 8 kHz websocket rate
        setmf('sam-u',  0.115,  3.99);  // set to USB mode
        sam_offset=-0.15;             // set frequency offset in tuner in kHz to bring carrier into passband
     }
     else {  // 16 kHz websocket rate
        setmf('sam-u',  0.115,  4.5);  // set to USB mode
        sam_offset=-0.45;             // set frequency offset in tuner in kHz to bring carrier into passband
        
     }
     send_soundsettings_to_server();  // tune the frequency
     modeinfo("USB");
     set_sam(1);
  }
  else if(a=='sam-l') {
     if(ws_srate < 10000)   {  // 8 kHz websocket rate
        setmf('sam-l', -3.99, -0.115);
        sam_offset=0.15;           // frequency of offset in tuner in kHz to bring carrier into passband
     }
     else {   // 16 kHz websocket rate
        setmf('sam-l', -4.5, -0.115);
        sam_offset=0.45;           // frequency of offset in tuner in kHz to bring carrier into passband
     }
     send_soundsettings_to_server();
     modeinfo("LSB");
     set_sam(1);
  }
  else {
     sam_offset=0;
     send_soundsettings_to_server();
     set_sam(0);   // turn off synchronous detector
  }
return;
}


// The function below manages the on-screen display of mode when the Synchronous AM detection is enabled.  Because "SAM-U" and "SAM-L" are not "official" modes, they need to be handled in a special manner, so that designation is only "on screen".

var synmode="";

function disp_syncmode()
{
   if(sam) {   // In Sync AM mode?
      synmode=mode;  // yes get a copy of the mode indicator
      var ind=0;
         if(mode=="USB") synmode="SAM-U", ind=1;    // yes - USB, indicate Synchronous AM Upper sideband on screen
         else if(mode=="LSB") synmode="SAM-L", ind=1;  // if LSB, indicate lower sideband synchronous AM on screen
      //
      if(ind)   // something changed - update screen
         document.getElementById("displaymode").innerHTML=synmode;
         document.getElementById("displaymode2").innerHTML=synmode;
   }
   else {   // Not in Sync AM mode - see if still indicating SAM
      if((synmode=="SAM-U") || (synmode=="SAM-L"))  {
         document.getElementById("displaymode").innerHTML=mode;
         document.getElementById("displaymode2").innerHTML=mode;
         synmode="";  // yes - update screen
      }
   }
}


var beta_valobj=0;
var decay_valobj=0;
var delay_valobj=0;
var len_valobj=0;
var dlen_valobj=0;


// Adjust CW peak frequency - display current setting
var cwpk_freqobj=0;
cwpk_freqobj.innerHTML="Off";
function set_cwpeakfilter(a)
{

   if(a<200)   {  // Low frequency - assume off
      setcwpk(0);
      cwpk_freqobj.innerHTML="<b>Off</b>";
   }
   else   {
      setcwpk(a);
      cwpk_freqobj.innerHTML=a+" Hz ";
   }
}

var vnotch_freqobj=0;

function set_vnotchfilter(a)
{
   if(a<100)   {
      setvnotch(0);
      vnotch_freqobj.innerHTML="<b>Off</b>";

   }
   else   {
      setvnotch(a)
      vnotch_freqobj.innerHTML=a+" Hz ";
   }
}

// The following set the step buttons according to the modes
// IMPORTANT NOTE:  The ACTUAL step sizes are to be found in the arrays in
// the function "freqstep() in "websdr-base.js"

// Set SSB step size on buttons
function set_ssb_stepbutton()
{

   document.getElementById("step_n1").textContent='-1';
   document.getElementById("step_n2").textContent='-10';
   document.getElementById("step_n3").textContent='-50';
   document.getElementById("step_n4").textContent='-500';
   document.getElementById("step_n5").textContent='-2.5k';
   document.getElementById("step_9").textContent='=kHz';
   document.getElementById("step_p1").textContent="+1";
   document.getElementById("step_p2").textContent='+10';
   document.getElementById("step_p3").textContent='+50';
   document.getElementById("step_p4").textContent='+500';
   document.getElementById("step_p5").textContent='+2.5k';

}

// Set AM step size on buttons
function set_am_stepbutton()
{

   document.getElementById("step_n1").textContent='-100';
   document.getElementById("step_n2").textContent='-1k';
   document.getElementById("step_n3").textContent='-5k';
   document.getElementById("step_n4").textContent='-10k';
   document.getElementById("step_n5").textContent='-50k';
   document.getElementById("step_9").textContent='=kHz';
   document.getElementById("step_p1").textContent="+100";
   document.getElementById("step_p2").textContent='+1k';
   document.getElementById("step_p3").textContent='+5k';
   document.getElementById("step_p4").textContent='+10k';
   document.getElementById("step_p5").textContent='+50k';

}

// Set FM step size on buttons
function set_fm_stepbutton()
{

   document.getElementById("step_n1").textContent='-1k';
   document.getElementById("step_n2").textContent='-5k';
   document.getElementById("step_n3").textContent='-10k';
   document.getElementById("step_n4").textContent='-12.5k';
   document.getElementById("step_n5").textContent='-50k';
   document.getElementById("step_9").textContent='=kHz';
   document.getElementById("step_p1").textContent="+1k";
   document.getElementById("step_p2").textContent='+5k';
   document.getElementById("step_p3").textContent='+10k';
   document.getElementById("step_p4").textContent='+12.5k';
   document.getElementById("step_p5").textContent='+50k';

}

// toggle USB CW button and set passband accordingly
function setusbcw()
{
	if(do_usbcw) do_usbcw=0;
	else do_usbcw=1;
        //
        if(mode=="CW")	// Button clicked - update passband
	    if(!do_usbcw) setmf("cw",-hi,-lo);	// flip it back if we are going USB to LSB
	    else setmf("cw",lo,hi);		// "setmf" flips for USB
}
