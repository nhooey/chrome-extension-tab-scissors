// The function that gets called on keyup.
// Tries to find a handler to execute
// noinspection JSUnresolvedVariable,JSUnresolvedFunction

(function () {

  function driver(event) {
    const keyCode = event.keyCode, ctrl = !!event.ctrlKey, alt = !!event.altKey;
    const key = buildKey(keyCode, ctrl, alt);
    const handler = mappings[key];
    if (handler) {
      handler(event);
    }
  }

  // Take the three props and make a string to use as key in the hash
  function buildKey(keyCode, ctrl, alt) {
    return (keyCode + '_' + ctrl + '_' + alt);
  }

  function listen(keyCode, handler, options) {
    // Build default options if there are none submitted
    options = options || defaultOptions;
    if (typeof handler !== 'function') {
      throw new Error('Submit a handler for keyCode #' + keyCode + '(ctrl:' + !!options.ctrl + ', alt:' + options.alt + ')');
    }
    // Build a key and map handler for the key combination
    const key = buildKey(keyCode, !!options.ctrl, !!options.alt);
    mappings[key] = handler;
  }

  function unListen(keyCode, options) {
    // Build default options if there are none submitted
    options = options || defaultOptions;
    // Build a key and map handler for the key combination
    const key = buildKey(keyCode, !!options.ctrl, !!options.alt);
    // Delete what was found
    delete mappings[key];
  }

  // Rudimentary attempt att cross-browser-ness
  const xb = {
    addEventListener: function (element, eventName, handler) {
      if (element.attachEvent) {
        element.attachEvent('on' + eventName, handler);
      } else {
        element.addEventListener(eventName, handler, false);
      }
    },
    removeEventListener: function (element, eventName, handler) {
      if (element.attachEvent) {
        element.detachEvent('on' + eventName, handler);
      } else {
        element.removeEventListener(eventName, handler, false);
      }
    }
  };

  function setActive(activate) {
    activate = (typeof activate === 'undefined' || !!activate); // true is default

    if (activate !== active) {
      const addOrRemove = activate ? 'addEventListener' : 'removeEventListener';
      xb[addOrRemove](document, 'keyup', driver);
      // noinspection JSUndeclaredVariable
      active = activate;
    }
  }

  // Activate on load
  setActive();

  // export API
  return {
    // Add/replace handler for a keycode.
    // Submit keycode, handler function and an optional hash with booleans for properties 'ctrl' and 'alt'
    listen: listen,
    // Remove handler for a keycode
    // Submit keycode and an optional hash with booleans for properties 'ctrl' and 'alt'
    unListen: unListen,
    // Turn on or off the whole thing.
    // Submit a boolean value. No arg means true
    setActive: setActive,
    // Keycode constants, fill in your own here
    key: {
      VK_F1: 112,
      VK_F2: 113,
      VK_A: 65,
      VK_B: 66,
      VK_C: 67
    }
  };

})();
