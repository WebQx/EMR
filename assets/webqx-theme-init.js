// Attach WebQx theme class and allow opt-out via data-no-webqx-theme
(function(){
  if (document.documentElement.hasAttribute('data-no-webqx-theme')) return;
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('webqx-theme');
    // If system prefers dark, add a helper class (variable set still handles tokens)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    }
  });
})();
