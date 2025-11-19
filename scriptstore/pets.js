/* bunny-pets-widget.js
   Landr addon: BunnyHero Pets widget
   - Adds a UI widget to insert BunnyHero Labs "adopt" pets into your Landr page.
   - Uses Ruffle (Flash emulator) when available; falls back to <embed> otherwise.
   - Persists settings and inserted instances to localStorage.
*/

(function() {
  const STORAGE_KEY = 'landrBunnyPetsWidget_v1';
  const SWF_URL = 'http://petswf.bunnyherolabs.com/adopt/swf/bunny';
  const ADOPT_PAGE = 'https://bunnyherolabs.com/adopt/';
  let settings = loadSettings();

  // Utility: safe DOM create
  function el(tag, attrs = {}, children = []) {
    const d = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'style') d.style.cssText = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') d.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') d.innerHTML = attrs[k];
      else d.setAttribute(k, attrs[k]);
    }
    children.forEach(c => d.appendChild(c));
    return d;
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('BunnyPetsWidget: save error', e);
    }
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('BunnyPetsWidget: load error', e);
    }
    return {
      enabled: true,
      useRuffle: true,
      defaultWidth: 250,
      defaultHeight: 300,
      instances: [] // saved inserted pet instances: [{id, options}]
    };
  }

  function notify(msg, type='info') {
    if (typeof LandrAPI !== 'undefined' && LandrAPI.showNotification) {
      LandrAPI.showNotification(msg, type);
    } else {
      console.log('BunnyPetsWidget:', msg);
    }
  }

  function ensureRuffleLoaded(callback) {
    if (!settings.useRuffle) {
      callback(false);
      return;
    }

    if (window.RufflePlayer) {
      callback(true);
      return;
    }

    // Add ruffle from unpkg (try to be polite and only inject once)
    if (!document.getElementById('ruffle-js')) {
      const s = document.createElement('script');
      s.id = 'ruffle-js';
      s.src = 'https://unpkg.com/@ruffle-rs/ruffle/dist/ruffle.js';
      s.async = true;
      s.onload = () => {
        setTimeout(() => callback(!!window.RufflePlayer), 100);
      };
      s.onerror = () => {
        console.warn('BunnyPetsWidget: failed to load Ruffle from CDN.');
        callback(false);
      };
      document.head.appendChild(s);
    } else {
      // if script previously injected, wait a moment for it to initialize
      const waitFor = (tries = 0) => {
        if (window.RufflePlayer) return callback(true);
        if (tries > 20) return callback(false);
        setTimeout(() => waitFor(tries + 1), 150);
      };
      waitFor();
    }
  }

  // Builds flashvars string from options
  function buildFlashVars(opt) {
    // Examples from BunnyHero advanced page: cn (pet name), an (adopter name), clr=0xe8e8e8, tc=0x00ff00
    const pairs = [];
    if (opt.petName) pairs.push('cn=' + encodeURIComponent(opt.petName));
    if (opt.adopter) pairs.push('an=' + encodeURIComponent(opt.adopter));
    if (opt.clr) pairs.push('clr=' + opt.clr.replace(/^#/, '0x'));
    if (opt.tc) pairs.push('tc=' + opt.tc.replace(/^#/, '0x'));
    return pairs.join('&');
  }

  // Create an element rendering the SWF either via Ruffle or embed tag
  function createPetElement(opt = {}) {
    const container = el('div', { class: 'bunny-pet-instance', style: 'display:flex;flex-direction:column;align-items:center;gap:8px;' });

    const swfWrapper = el('div', { style: `width:${opt.width}px;height:${opt.height}px;display:flex;align-items:center;justify-content:center;position:relative;` });

    const flashvars = buildFlashVars(opt);

    function attachRuffle() {
      try {
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();
        // player has width/height attributes — use CSS wrapper sizing
        player.style.width = opt.width + 'px';
        player.style.height = opt.height + 'px';
        swfWrapper.appendChild(player);
        // Ruffle's load expects a URL; append flashvars to a `?` fragment? Ruffle expects the SWF resource only.
        // Ruffle currently won't accept flashvars via standard query string to SWF in many cases.
        // We will create an <object> fallback containing flashvars if Ruffle can't set them. But first try load SWF directly.
        try {
          player.load(SWF_URL);
          // Ruffle may not accept flashvars injection — we still include an accessibility note and fallback embed below.
        } catch (e) {
          console.warn('BunnyPetsWidget: Ruffle player.load failed', e);
        }
      } catch (e) {
        console.warn('BunnyPetsWidget: could not init Ruffle', e);
      }
    }

    function attachEmbed() {
      // Build embed tag with flashvars
      const embed = document.createElement('embed');
      embed.setAttribute('wmode', opt.transparent ? 'transparent' : 'window');
      embed.src = SWF_URL;
      embed.width = opt.width;
      embed.height = opt.height;
      embed.quality = 'high';
      embed.bgcolor = (opt.bgcolor || 'ffffff');
      embed.type = 'application/x-shockwave-flash';
      if (flashvars) embed.setAttribute('flashvars', flashvars);
      swfWrapper.appendChild(embed);
    }

    if (settings.useRuffle) {
      // try Ruffle first; if not available attach embed and show message.
      if (window.RufflePlayer) {
        attachRuffle();
      } else {
        // temporary placeholder until ruffle loads
        const placeholder = el('div', { style: `width:${opt.width}px;height:${opt.height}px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.08);border-radius:8px;` });
        placeholder.textContent = 'Loading pet (Ruffle)...';
        swfWrapper.appendChild(placeholder);
        ensureRuffleLoaded((loaded) => {
          swfWrapper.innerHTML = '';
          if (loaded) attachRuffle();
          else attachEmbed();
        });
      }
    } else {
      attachEmbed();
    }

    const caption = el('div', { style: 'font-size:0.85rem;opacity:0.9;text-align:center;' });
    const nameSpan = el('div', { html: `<strong>${escapeHtml(opt.petName || 'unnamed')}</strong> ${opt.adopter ? ` — adopted by ${escapeHtml(opt.adopter)}` : ''}` });
    const link = el('a', { href: ADOPT_PAGE, target: '_blank', style: 'font-size:0.8rem;opacity:0.75;text-decoration:underline;margin-top:4px;' });
    link.textContent = 'Adopt at BunnyHero Labs';
    caption.appendChild(nameSpan);
    caption.appendChild(link);

    const controls = el('div', { style: 'display:flex;gap:8px;margin-top:6px;' });
    const removeBtn = el('button', { style: 'padding:6px 10px;border-radius:8px;border:none;cursor:pointer;background:#ef4444;color:white;font-weight:600;' });
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', function() {
      container.remove();
      // Remove from persisted instances if present
      settings.instances = settings.instances.filter(i => i.id !== opt._id);
      saveSettings();
      notify('Pet instance removed', 'info');
    });

    controls.appendChild(removeBtn);

    container.appendChild(swfWrapper);
    container.appendChild(caption);
    container.appendChild(controls);

    return container;
  }

  // Escape HTML to avoid injection in innerHTML uses
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"'`=\/]/g, function(s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      })[s];
    });
  }

  // Create the settings UI widget and mount into .content-grid
  function createWidgetPanel() {
    // Avoid duplicates
    if (document.getElementById('bunnyPetsWidget')) return;

    const contentGrid = document.querySelec
