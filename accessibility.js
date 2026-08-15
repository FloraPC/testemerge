/**
 * accessibility.js
 * -----------------------------------------------------------------------
 * Aplica as preferências de acessibilidade ao <html> via classes CSS e
 * mantém tudo sincronizado com o Storage. O CSS reage a essas classes
 * (ver css/styles.css, seção "ACESSIBILIDADE").
 * -----------------------------------------------------------------------
 */

const A11y = (() => {
  let settings = Storage.getSettings();

  function apply() {
    const root = document.documentElement;

    root.classList.toggle('contrast-alto', !!settings.highContrast);
    root.classList.toggle('motion-reduzido', !!settings.reduceMotion);

    root.classList.remove('fonte-normal', 'fonte-grande', 'fonte-muito-grande');
    root.classList.add(
      settings.fontSize === 'grande' ? 'fonte-grande' :
      settings.fontSize === 'muito-grande' ? 'fonte-muito-grande' : 'fonte-normal'
    );

    AudioFX.setEnabled(!!settings.soundOn);
    AudioFX.setVolume(typeof settings.volume === 'number' ? settings.volume : 0.7);
  }

  function get() {
    return settings;
  }

  function update(partial) {
    settings = Object.assign({}, settings, partial);
    Storage.saveSettings(settings);
    apply();
  }

  function init() {
    apply();
  }

  return { init, get, update };
})();
