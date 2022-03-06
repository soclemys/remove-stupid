chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        settings: {
            filterType: 'soft',
            filterMatch: ['interval'],
            censorshipString: 'Content removed due to illiteracy'
        }
    });
});