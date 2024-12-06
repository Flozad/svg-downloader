let svgElements = [];
let currentIndex = -1;

function collectSVGs() {
  console.log('Collecting SVGs...');
  
  // Get all SVG elements from the page
  const svgs = document.querySelectorAll('svg');
  console.log('Found SVG elements:', svgs.length);
  
  svgElements = Array.from(svgs).map(svg => ({
    type: 'svg',
    content: svg.outerHTML
  }));

  // Also get SVG images
  const svgImages = document.querySelectorAll('img[src$=".svg"]');
  console.log('Found SVG images:', svgImages.length);
  
  svgElements = [...svgElements, ...Array.from(svgImages).map(img => ({
    type: 'img',
    content: img.src
  }))];

  console.log('Total SVGs found:', svgElements.length);

  // Send initial count to popup
  try {
    chrome.runtime.sendMessage({ 
      action: 'svgsCollected', 
      data: { 
        count: svgElements.length 
      }
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending svgsCollected message:', chrome.runtime.lastError);
        return;
      }
      console.log('SVGs collected message sent');
    });

    if (svgElements.length > 0) {
      currentIndex = 0;
      sendCurrentSVG();
    }
  } catch (error) {
    console.error('Error in collectSVGs:', error);
  }
}

function sendCurrentSVG() {
  console.log('Sending current SVG, index:', currentIndex);
  
  if (currentIndex >= 0 && currentIndex < svgElements.length) {
    try {
      chrome.runtime.sendMessage({
        action: 'elementSelected',
        data: {
          ...svgElements[currentIndex],
          currentIndex,
          total: svgElements.length,
          allSVGs: svgElements
        }
      }, response => {
        if (chrome.runtime.lastError) {
          console.error('Error sending elementSelected message:', chrome.runtime.lastError);
          return;
        }
        console.log('Current SVG sent successfully');
      });
    } catch (error) {
      console.error('Error in sendCurrentSVG:', error);
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.action);
  
  try {
    switch (request.action) {
      case 'collectSVGs':
        collectSVGs();
        sendResponse({ success: true });
        break;
      case 'nextSVG':
        if (currentIndex < svgElements.length - 1) {
          currentIndex++;
          sendCurrentSVG();
        }
        sendResponse({ success: true });
        break;
      case 'previousSVG':
        if (currentIndex > 0) {
          currentIndex--;
          sendCurrentSVG();
        }
        sendResponse({ success: true });
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep the message channel open for async responses
});

// Initialize when the script loads
console.log('Content script loaded');
collectSVGs(); 