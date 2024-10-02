function toggleDarkMode() {
    if($('body').hasClass('dark-mode')) {
        $('body').addClass('light-mode');
        $('body').removeClass('dark-mode');
        $('darkModeLabel').text = "Light Mode";
    } else {
        $('body').addClass('dark-mode');
        $('body').removeClass('light-mode');
        $('darkModeLabel').text = "Dark Mode";
    }
}
//TODO Fix Label change