(function() {
  const STORAGE_KEY = 'landrCustomQuickLinks';
  
  function saveQuickLinks() {
    const quickLinksContainer = document.getElementById('quickLinks');
    if (!quickLinksContainer) return;
    
    const links = [];
    const linkCards = quickLinksContainer.querySelectorAll('.link-card:not([data-default="true"])');
    
    linkCards.forEach(card => {
      links.push({
        name: card.textContent.trim().replace('✕', '').trim(),
        url: card.href
      });
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    console.log('Quick links saved:', links);
  }
  
  function loadQuickLinks() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    try {
      const links = JSON.parse(saved);
      const quickLinksContainer = document.getElementById('quickLinks');
      const addButton = quickLinksContainer.querySelector('.add-link-card');
      
      links.forEach(link => {
        const newLink = document.createElement('a');
        newLink.href = link.url;
        newLink.target = '_blank';
        newLink.className = 'link-card';
        newLink.innerHTML = `
          ${link.name}
          <button class="remove-link" onclick="removeLink(event, this)">✕</button>
        `;
        
        quickLinksContainer.insertBefore(newLink, addButton);
      });
      
      console.log('Quick links loaded:', links);
    } catch (error) {
      console.error('Error loading quick links:', error);
    }
  }
  
  const originalSaveCustomLink = window.saveCustomLink;
  window.saveCustomLink = function() {
    originalSaveCustomLink();
    setTimeout(saveQuickLinks, 100);
  };
  
  const originalRemoveLink = window.removeLink;
  window.removeLink = function(event, button) {
    originalRemoveLink(event, button);
    setTimeout(saveQuickLinks, 100);
  };
  
  if (typeof LandrAPI !== 'undefined') {
    const originalAddQuickLink = LandrAPI.addQuickLink;
    LandrAPI.addQuickLink = function(name, url) {
      originalAddQuickLink(name, url);
      setTimeout(saveQuickLinks, 100);
    };
  }
  
  loadQuickLinks();
  
  if (typeof LandrAPI !== 'undefined') {
    console.log('Persistent quick links script loaded successfully!');
  }
})();