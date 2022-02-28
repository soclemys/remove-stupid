select = document.getElementById('filter_action');

select.onchange = () => {
    chrome.storage.sync.set({
        filterAction: select.value
    });
}

window.onload = () => {
    chrome.storage.sync.get({
        filterAction: 'Soft',
    }, function(data) {
        select.value = data.filterAction;
    });
}