function toggleDarkMode() {
    if($('body').hasClass('dark-mode')) {
        $('body').addClass('light-mode');
        $('body').removeClass('dark-mode');
        $('darkModeButton').text = "Light Mode";
    } else {
        $('body').addClass('dark-mode');
        $('body').removeClass('light-mode');
        $('darkModeButton').text = "Dark Mode";
    }
}