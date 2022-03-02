select = document.getElementById('filter_type');

select.onchange = () => {
    chrome.storage.sync.set({
        settings: {
            filterType: select.value,
        }
    });
}

window.onload = () => {
    chrome.storage.sync.get({
        filterType: 'soft',
    }, data => {
        select.value = data.filterType;
    });
}