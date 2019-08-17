//NOTICE:
//background script removed from extension
//for some reason, having this background script causes major lag (not sure why)

//receives message from content script and activates extension icon 
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'showPageAction') {
        chrome.pageAction.show(sender.tab.id);
    }
});


