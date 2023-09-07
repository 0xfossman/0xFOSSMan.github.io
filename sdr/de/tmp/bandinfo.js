var nbands=1;
var ini_freq=27055.000000;
var ini_mode='usb';
var chseq=2;
var bandinfo= [
  { centerfreq: 27235.000000,
    samplerate: 1536.000000,
    tuningstep: 0.031250,
    maxlinbw: 8.000000,
    vfo: 27245.000000,
    maxzoom: 6,
    name: '11m',
    scaleimgs: [
      ["tmp/1693811927-b0z0i0.png"],
      ["tmp/1693811927-b0z1i0.png","tmp/1693811927-b0z1i1.png"],
      ["tmp/1693811927-b0z2i0.png","tmp/1693811927-b0z2i1.png","tmp/1693811927-b0z2i2.png","tmp/1693811927-b0z2i3.png"],
      ["tmp/1693811927-b0z3i0.png","tmp/1693811927-b0z3i1.png","tmp/1693811927-b0z3i2.png","tmp/1693811927-b0z3i3.png","tmp/1693811927-b0z3i4.png","tmp/1693811927-b0z3i5.png","tmp/1693811927-b0z3i6.png","tmp/1693811927-b0z3i7.png"],
      ["tmp/1693811927-b0z4i0.png","tmp/1693811927-b0z4i1.png","tmp/1693811927-b0z4i2.png","tmp/1693811927-b0z4i3.png","tmp/1693811927-b0z4i4.png","tmp/1693811927-b0z4i5.png","tmp/1693811927-b0z4i6.png","tmp/1693811927-b0z4i7.png","tmp/1693811927-b0z4i8.png","tmp/1693811927-b0z4i9.png","tmp/1693811927-b0z4i10.png","tmp/1693811927-b0z4i11.png","tmp/1693811927-b0z4i12.png","tmp/1693811927-b0z4i13.png","tmp/1693811927-b0z4i14.png","tmp/1693811927-b0z4i15.png"],
      ["tmp/1693811927-b0z5i0.png","tmp/1693811927-b0z5i1.png","tmp/1693811927-b0z5i2.png","tmp/1693811927-b0z5i3.png","tmp/1693811927-b0z5i4.png","tmp/1693811927-b0z5i5.png","tmp/1693811927-b0z5i6.png","tmp/1693811927-b0z5i7.png","tmp/1693811927-b0z5i8.png","tmp/1693811927-b0z5i9.png","tmp/1693811927-b0z5i10.png","tmp/1693811927-b0z5i11.png","tmp/1693811927-b0z5i12.png","tmp/1693811927-b0z5i13.png","tmp/1693811927-b0z5i14.png","tmp/1693811927-b0z5i15.png","tmp/1693811927-b0z5i16.png","tmp/1693811927-b0z5i17.png","tmp/1693811927-b0z5i18.png","tmp/1693811927-b0z5i19.png","tmp/1693811927-b0z5i20.png","tmp/1693811927-b0z5i21.png","tmp/1693811927-b0z5i22.png","tmp/1693811927-b0z5i23.png","tmp/1693811927-b0z5i24.png","tmp/1693811927-b0z5i25.png","tmp/1693811927-b0z5i26.png","tmp/1693811927-b0z5i27.png","tmp/1693811927-b0z5i28.png","tmp/1693811927-b0z5i29.png","tmp/1693811927-b0z5i30.png","tmp/1693811927-b0z5i31.png"],
      ["tmp/1693811927-b0z6i0.png","tmp/1693811927-b0z6i1.png","tmp/1693811927-b0z6i2.png","tmp/1693811927-b0z6i3.png","tmp/1693811927-b0z6i4.png","tmp/1693811927-b0z6i5.png","tmp/1693811927-b0z6i6.png","tmp/1693811927-b0z6i7.png","tmp/1693811927-b0z6i8.png","tmp/1693811927-b0z6i9.png","tmp/1693811927-b0z6i10.png","tmp/1693811927-b0z6i11.png","tmp/1693811927-b0z6i12.png","tmp/1693811927-b0z6i13.png","tmp/1693811927-b0z6i14.png","tmp/1693811927-b0z6i15.png","tmp/1693811927-b0z6i16.png","tmp/1693811927-b0z6i17.png","tmp/1693811927-b0z6i18.png","tmp/1693811927-b0z6i19.png","tmp/1693811927-b0z6i20.png","tmp/1693811927-b0z6i21.png","tmp/1693811927-b0z6i22.png","tmp/1693811927-b0z6i23.png","tmp/1693811927-b0z6i24.png","tmp/1693811927-b0z6i25.png","tmp/1693811927-b0z6i26.png","tmp/1693811927-b0z6i27.png","tmp/1693811927-b0z6i28.png","tmp/1693811927-b0z6i29.png","tmp/1693811927-b0z6i30.png","tmp/1693811927-b0z6i31.png","tmp/1693811927-b0z6i32.png","tmp/1693811927-b0z6i33.png","tmp/1693811927-b0z6i34.png","tmp/1693811927-b0z6i35.png","tmp/1693811927-b0z6i36.png","tmp/1693811927-b0z6i37.png","tmp/1693811927-b0z6i38.png","tmp/1693811927-b0z6i39.png","tmp/1693811927-b0z6i40.png","tmp/1693811927-b0z6i41.png","tmp/1693811927-b0z6i42.png","tmp/1693811927-b0z6i43.png","tmp/1693811927-b0z6i44.png","tmp/1693811927-b0z6i45.png","tmp/1693811927-b0z6i46.png","tmp/1693811927-b0z6i47.png","tmp/1693811927-b0z6i48.png","tmp/1693811927-b0z6i49.png","tmp/1693811927-b0z6i50.png","tmp/1693811927-b0z6i51.png","tmp/1693811927-b0z6i52.png","tmp/1693811927-b0z6i53.png","tmp/1693811927-b0z6i54.png","tmp/1693811927-b0z6i55.png","tmp/1693811927-b0z6i56.png","tmp/1693811927-b0z6i57.png","tmp/1693811927-b0z6i58.png","tmp/1693811927-b0z6i59.png","tmp/1693811927-b0z6i60.png","tmp/1693811927-b0z6i61.png","tmp/1693811927-b0z6i62.png","tmp/1693811927-b0z6i63.png"]]
  }
];
var dxinfoavailable=1;
var idletimeout=0;
var has_mobile=0;
