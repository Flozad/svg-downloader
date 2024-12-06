let currentSVG = null;
let allSVGs = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById('preview');
  const noPreview = document.getElementById('no-preview');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const counter = document.getElementById('counter');
  const refreshBtn = document.getElementById('refreshBtn');
  const retryBtn = document.getElementById('retryBtn');

  function setLoading(loading_state) {
    isLoading = loading_state;
    loading.classList.toggle('hidden', !loading_state);
    refreshBtn.disabled = loading_state;
    if (loading_state) {
      noPreview.classList.remove('hidden');
      preview.classList.add('hidden');
      emptyState.classList.add('hidden');
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      downloadBtn.disabled = true;
      downloadAllBtn.disabled = true;
    }
  }

  function showError(message) {
    setLoading(false);
    noPreview.classList.add('hidden');
    preview.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = message;
    counter.textContent = '0 SVGs found';
  }

  async function injectContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active tab found');

      // Check if we can access the tab
      if (!tab.url || !tab.url.startsWith('http')) {
        throw new Error('Cannot access this page');
      }

      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      return tab;
    } catch (error) {
      console.error('Error injecting content script:', error);
      throw error;
    }
  }

  async function refreshSVGs() {
    setLoading(true);
    preview.classList.add('hidden');
    emptyState.classList.add('hidden');
    noPreview.classList.remove('hidden');
    noPreview.textContent = 'Loading SVGs...';
    
    try {
      const tab = await injectContentScript();
      
      // Wait a bit for the content script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'collectSVGs' });
      if (!response || !response.success) {
        throw new Error('Failed to collect SVGs');
      }
    } catch (error) {
      console.error('Error refreshing SVGs:', error);
      if (error.message.includes('Cannot access')) {
        showError('Cannot access SVGs on this page. Try opening a webpage first.');
      } else {
        showError('Error loading SVGs. Please try again.');
      }
    }
  }

  // Refresh button handlers
  refreshBtn.addEventListener('click', refreshSVGs);
  retryBtn.addEventListener('click', refreshSVGs);

  // Start by collecting all SVGs when popup opens
  refreshSVGs();

  // Handle navigation
  async function sendTabMessage(action) {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tab) throw new Error('No active tab found');
      return await chrome.tabs.sendMessage(tab.id, {action});
    } catch (error) {
      console.error(`Error sending ${action} message:`, error);
      showError('Error navigating SVGs. Please try again.');
    }
  }

  prevBtn.addEventListener('click', () => sendTabMessage('previousSVG'));
  nextBtn.addEventListener('click', () => sendTabMessage('nextSVG'));

  // Handle single download
  downloadBtn.addEventListener('click', () => {
    if (!currentSVG) return;
    downloadSVG(currentSVG);
  });

  async function formatSVGContent(content, isSVGType = true) {
    // Add XML declaration if not present
    if (!content.includes('<?xml')) {
      content = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + content;
    }
    
    // If it's just a path or other element without svg wrapper, wrap it
    if (!content.includes('<svg')) {
      content = `<svg xmlns="http://www.w3.org/2000/svg">\n${content}\n</svg>`;
    }
    
    // Format the content with proper indentation
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'image/svg+xml');
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  // Handle bulk download
  downloadAllBtn.addEventListener('click', async () => {
    if (allSVGs.length === 0) return;

    try {
      const zip = new JSZip();
      
      // Add all SVGs to the zip
      const promises = allSVGs.map(async (svg, index) => {
        const filename = `svg-${index + 1}.svg`;
        try {
          let formattedContent;
          
          if (svg.type === 'svg') {
            formattedContent = await formatSVGContent(svg.content);
          } else {
            const response = await fetch(svg.content);
            const svgContent = await response.text();
            formattedContent = await formatSVGContent(svgContent, false);
          }
          
          zip.file(filename, formattedContent);
        } catch (error) {
          console.error(`Error processing SVG ${index + 1}:`, error);
        }
      });

      await Promise.all(promises);

      // Generate and download the zip
      const blob = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(blob);
      await chrome.downloads.download({
        url: url,
        filename: 'all-svgs.zip'
      });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showError('Error creating ZIP file. Please try again.');
    }
  });

  function downloadSVG(svg) {
    const filenameInput = document.getElementById('filenameInput');
    const customName = filenameInput.value.trim();
    const filename = customName ? `${customName}.svg` : `svg-${svg.currentIndex + 1}.svg`;
    
    if (svg.type === 'svg') {
      formatSVGContent(svg.content)
        .then(formattedContent => {
          const blob = new Blob([formattedContent], {type: 'image/svg+xml;charset=utf-8'});
          const url = URL.createObjectURL(blob);
          return chrome.downloads.download({
            url: url,
            filename: filename
          });
        })
        .catch(error => {
          console.error('Error downloading SVG:', error);
          showError('Error downloading SVG. Please try again.');
        });
    } else {
      // For SVG images, fetch the content first to ensure proper formatting
      fetch(svg.content)
        .then(response => response.text())
        .then(svgContent => formatSVGContent(svgContent, false))
        .then(formattedContent => {
          const blob = new Blob([formattedContent], {type: 'image/svg+xml;charset=utf-8'});
          const url = URL.createObjectURL(blob);
          return chrome.downloads.download({
            url: url,
            filename: filename
          });
        })
        .catch(error => {
          console.error('Error downloading SVG:', error);
          showError('Error downloading SVG. Please try again.');
        });
    }
  }

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request.action);
    
    switch (request.action) {
      case 'svgsCollected':
        const { count } = request.data;
        counter.textContent = `${count} SVGs found`;
        setLoading(false);
        
        if (count === 0) {
          noPreview.classList.add('hidden');
          emptyState.classList.remove('hidden');
          emptyState.querySelector('p').textContent = 'No SVGs found on this page';
          prevBtn.disabled = true;
          nextBtn.disabled = true;
          downloadBtn.disabled = true;
          downloadAllBtn.disabled = true;
        }
        break;

      case 'elementSelected':
        currentSVG = request.data;
        allSVGs = request.data.allSVGs || [];
        
        // Update preview
        noPreview.classList.add('hidden');
        emptyState.classList.add('hidden');
        preview.classList.remove('hidden');
        
        if (currentSVG.type === 'svg') {
          preview.innerHTML = currentSVG.content;
        } else {
          preview.innerHTML = `<img src="${currentSVG.content}" class="max-w-full max-h-full object-contain">`;
        }
        
        // Update navigation buttons
        prevBtn.disabled = currentSVG.currentIndex === 0;
        nextBtn.disabled = currentSVG.currentIndex === currentSVG.total - 1;
        downloadBtn.disabled = false;
        downloadAllBtn.disabled = false;
        break;
    }
  });
}); 