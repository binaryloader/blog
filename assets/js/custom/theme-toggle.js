document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var html = document.documentElement;
      var isDark = html.getAttribute('data-theme') === 'dark';
      var newTheme = isDark ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);

      var utterancesFrame = document.querySelector('.utterances-frame');
      if (utterancesFrame) {
        utterancesFrame.contentWindow.postMessage(
          { type: 'set-theme', theme: newTheme === 'dark' ? 'github-dark' : 'github-light' },
          'https://utteranc.es'
        );
      }
    });
  }

});
