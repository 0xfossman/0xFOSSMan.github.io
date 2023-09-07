// The following text is displayed when the WebSDR has too many users

var busystring="Sorry, the WebSDR is too busy at the moment. Check out WebSDR #3 for alternate 80 and 40 meter coverage and #4 for 40 meter coverage on an east-pointing beam antenna. For other Northern Utah WebSDR servers go to:  sdrutah.org\n";

/*  PER-BAND WebSDR configuration


*** IMPORTANT ***    READ THE INFORMATION BELOW AND MAKE CHANGES AS NEEDED AT EACH HEADING:   ***
*/


var from_mhz_freq=100;           // Numerical value, below which the number is converted from MHz to kHz (mult by 1000) - 0 disables

/*

 GAIN VALUES from "websdr.cfg"

	Into the variable below, copy the "gain"values for each band from the "websdr.cfg" file.
	These are used to calibrate the "Alternate" AGC function used for AM reception and wildly incorrect values here will result in the AGC not working properly.
    
	There are EIGHT values - one for each band:  Put a "0" (zero) in each band position that is not used.

        Unfortunately, these values are not known to be available within the WebSDR's code/variable structure and there is no way to get these other than manual entry.

	If you do NOT use the "Alternate AGC", the values are irrelevant - but it would be a good idea to set them to zero.
*/

	var band_gainvals = [ -37, -11.5, -21.6, -4, -30, -10, -30, 0 ];   // The number following the "gain" parameter in "websdr.cfg" for each band


/* "ALT AGC" gain correction factors:

	Because the setting of the "gain" parameter is primarily for waterfall brightness calibration, it can be a bit subjective when it comes to the absolute setting - and this can skew the audio levels on reception.  The table below provides a correction to this.

	TO CONFIGURE:  Go to each band and tune in (preferably) an AM signal (although "band noise" between stations should work) and switch between "RF AGC" and "Alt AGC" mode.  If the audio in ALT AGC mode is LOUDER, put a smaller number (e.g. more toward negative) in that band location and it is quiet, put a larger number (more positive) there.  Set to ZERO if you aren't sure, or aren't currently using the "Alt AGC".

IMPORTANT:  It is better to have slightly LOW audio than slightly HIGH audio!

*/

	var altagc_corr = [0,0,0,0,0,0,0,0];



/* S-METER OFFSET

	The following table is for offsetting the S-meter to allow the adjustment of waterfall "brightness" for each of the eight bands.

	A problem with the WebSDR is that the waterfall's "brightness" is tied to the "gain" setting in "websdr.cfg"- but if the S-meter is calibrated thusly, 

	PROCEDURE:

	- Initially set the corresponding bands' "smeter_offset" value to zero
	- Using the "gain" parameter in "websdr.cfg", adjust the gain as necessary to set the waterfall to the desired brightness.  It is suggested that
	  this be done when the corresponding band is "dead" and a suitable "brightness" is such that the waterfall is a dark blue color, but detail
	  can be seen.
	- After the "brightness" has been adjusted, set the S-meter offset on a per-band basis to achive desired S-meter calibration.
	- The values below are ADDED to the S-meter readings - that is, a negative number makes the S-meter read LOWER

	There are EIGHT values:  Put a 0 (zero) in each band position that is not used.
*/

	var smeter_offset = [ -0, -0, -0, -0, -0, -0, -0, -0 ];  // Values in dB to be ADDED to the reading


/*   Initial ZOOM and auto-tuning settings:

	In some cases - particularly when on a band with wider frequency coverage - it may be desirable to zoom in on a particularly portion.

	With the WebSDR, only ONE initial frequency and mode may be selected, but if a user switches to different bands, the default frequency/mode is "what it is".

	This parameter controls whether or not the receiver is to tune to a frequency when the user FIRST selects a band after loading the page,
	and also to zoom in by the desired number of steps.

	For the "zoom once" array:
	  - Put a "-1" if you do NOT want any tuning or zooming - e.g. IGNORE the initial frequency and mode settings in "freq_once" and "mode_once" arrays below.
	   NOTE:  UNLESS there is a "-1" in the corresponding band entry, this will OVERRIDE the frequency/mode setting in "websdr.cfg"
	  - Put a 0 (zero) in the corresponding entry for the band if you want it to set the frequency, but  don't want it to zoom.
	  - If you want it to zoom in after loading the page, put the number of zoom steps in the corresponding entry for the band.
	     - Determine the number of zooms by doing "Max Out" and counting the number of "Zoom In" presses to get to the needed zoom level.
*/

	var zoom_once = [-1, -1, -1, -1, -1, -1, -1, -1 ];   // -1:  no action, 0= no zooms, but tune using frequency and mode, >=1 - tune and zoom that number of times


/*  Initial FREQUENCY and MODE parameters:

	NOTE:  For this to work one MUST set a corresponding entry in the "zoom_once" array, above, that is NOT "-1".

	If the user does NOT include a frequency and (optional) mode in the URL, data from the following tables is used to set the frequency and
	mode on a per-band basis.

	For the "freq_once" array:
	  - Put the FREQUENCY in kHz in the position corresponding to the band to be used.
	       *** MAKE SURE THAT IT IS A VALID FREQUENCY FOR THAT BAND!!!  ***
	  - Put a 0 (zero) in each band position that is not used, or if there is no default frequency to be used.

	For the "mode_once" array:
	  - Put the desired mode in quotes in the entry corresponding to the band.  it MUST be one of "AM", "FM", "CW", "USB" or "LSB".
	  - Put a null string ("" - e.g. two quotes, no space between) in the "mode_once" entry corresponding to the band if you do NOT want the mode to be changed.

*/
	var freq_once = [27055,0,0,0,0,0,0,0];  // Frequency in kHz - zero if no tuning desired

	var mode_once = ["USB", "USB", "LSB", "AM", "LSB", "USB", "LSB", "USB", "USB", "USB"]   // Put the desired mode, uppercase, in quotes - blank quotes for unused bands


/* SAMPLE RATE CORRECTION:

	It is possible that a receiver's frequency is properly calibrated at the center frequency, but is off at the edges:  If this is the case, the sample rate may be off.

	- The correction may be entered as a ratio.  For example if you determine that the sample rate of a 192.000 kHz device is actually 191.93 kHz, you could enter
	   either "191930/192000" or "0.9996354".
	- Put a 1 (one) if NO sample rate correction is needed for the corresponding band.

	There are EIGHT values:  Put a "1" (one) in each entry that is not used.	
*/


	var sr_corr = [1,1,1,1,1,1,1,1 ];


/* Frequency correction:

	The values below, in Hz, are added to the frequency sent to the tuner to correct minor offsets that cannot be accommodated by other means.
	Note that the WebSDR software's tuning resolution is typically 31.25 Hz so errors of as much as +/- 15 Hz should be expected!
*/

var freq_corr = [0,0,0,0,0,0,0,0];



/* SHOW USER FREQUENCY ON DIAL SCALE:

	On the frequency scales below the waterfall (where user names or IP addresses appear) the approximate frequency
	will be displayed if the variable "show_ufreq" is defined.

	This frequency will appear immediately after the user name in square brackets (e.g. "W1XYZ [7200]")

   IMPORTANT:  The "mode" information of each, individual user is not included in the available variables, so the frequency "offset"
      based on mode assumes that everyone is using the same mode as YOU (the view) are.  If not, the frequencies may be offset by as
      much as 2.5 kHz or so if you are set to USB and the other station is using LSB.
*/

var show_ufreq=0;  // if this is DEFINED, frequency will appear after the user name





/*  Custom scaling of user displays along the bottom of the WebSDR screen.  This allows a "zoomed in" view along 


 For this to work there .PNG image with a linear frequency scale in the "/dist11/pub2/cust" directory for each
 band, numerically desginated, named "customscale0.png", "customscale1.png", for up to 7 bands that may include a "custom" prefix, described below.  The nominal size of this
 image is 1024 pixels wide and 14 pixels tall, but the size may be specified using "custom_size[]".

IMAGE SOURCE:  At present, such scales would have to be created manually, one for each band - a means of automatically generating
such images is currently being sought.

  COMMENTS about images:

   - REMEMBER:  The CUSTOM scales are located in /pub2/cust as the WebSDR start-up deletes the contents of "/pub2/tmp" upon start-up.  Look for files that end with "-b0z0i0.png" and "-b1z0i0.png" - the number after the first "b" being the band number (0-7) and look at them with an image viewer like "Irfanview" to identify it.

   - If you have a "test" WebSDR - or can temporarily reconfigure a "live" webSDR - simply configure it to use the desired center frequency and bandwith, start it up - ignoring the errors/warnings that might appear -, and then fetch the scale from /pub2/tmp.

   - In the ~/dist11/pub2 directory create a folder called "cust" (e.g. "~/dist11/pub2/cust") in which the "custom" scales should be placed.  This separate directory is necessary as the WebSDR deletes all files in the "tmp" directory where these scales are normally stored upon start-up.

   - When you create these custom scales, have as the first portion of the filename the date that you create it (e.g. "220512" for May 12, 2022) to make a filename like "220512_customscale5.png".  In this case, the "5" at the end of the filename is the WebSDR "band" number (0-7) to be used.

   - The variable "custom_prefix", below, would include this date-prefix - including any hyphen or underline, as described.


 Variables involved - each are arrays with EIGHT entries, one per band:

  custom_prefix - This is a string that precedes the file name:  For example, if we were to use YYMMDD for
        this string (e.g. "220512_") our custom scale files would be named "220512_customscale0.png", "0305customscale1.png",
        etc.  This is important because if the image is changed but the file name remains the same, the users'
        browser cache may continue to use the "old" image for a while and the updated scales might not show up.

  userscale[] - Enable custom scaling:  0 = do not use custom scale image, 1 = use custom scale image.
	This variable may be left UNDEFINED if no custom scaling is used.

  custom_scale[] - This scales the frequency location (as a fractional number 0-1) to the image.  The number 0-1 - the "frequency
	fraction" - represents the relative frequency across the ENTIRE frequency coverage of the receiver, so a "zoomed in"
	portion of the scale would use only a portion of the 0-1 range.
        This number may be calculated by multiplying the image size by the ratio between the actual receiver bandwidth and the bandwidth to be shown.
        For example:
           40 meters - show 400 kHz (6950-7350) on a receiver with 768 kHz banwdith:  768/400=1.92
           If the width of the custom scale is 1024 pixels, multiply this by the number above:  1024*1.92=1966 - which is the number to use
          
  custom_offset[] - This amount is SUBTRACTED from the position calculated when the "frequency fraction" is multipled by the
	"custom_scale" entry.  This may be easily determined by experimentation - it is recommended that you set the receiver to AM to properly center the display on screen.


*/

var userscale=[0,0,0,0,0,0,0,0];  // Use custom frequency scaling if correlating entry for the band is non-zero.  This variable may be left UNDEFINED (commented out) if custom frequency scaling is not needed at all.

var custom_prefix="220401a_";   // This is a filename prefix used to uniquely identify "new" scale images to force browser to load the image when changed - see above

var custom_scale=[2452,1024,1024,1024,1430,1024,2247,1024];  // Scaling factor for"frequency fraction" Horizontal position on the image for the corresponding frequency is "frequency fraction * custom_scale - custom_offset".

var custom_offset=[155,250,250,250,453,250,935,250];   // Horizontal offset - subtracted from "frequency fraction * scale" values

var custom_size=[1024,1024,1024,1024,1024,1024,1024,1024];  // Horizontal size of image - typically 1024 pixels



// END OF FILE
