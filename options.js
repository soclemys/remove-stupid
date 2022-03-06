select = document.getElementById('filter_type');
select.onchange = () => {
    saveSettings();
}
matchCheckboxes = document.getElementsByName('matches');
Array.prototype.forEach.call(matchCheckboxes, checkbox => {
    checkbox.onchange = () => {
        saveSettings();
    }
})

const saveSettings = () => {
    let matches = [];
    Array.prototype.forEach.call(matchCheckboxes, checkbox => {
        if (checkbox.checked) {
            matches.push(checkbox.value);
        }
    })
    chrome.storage.sync.set({
        settings: {
            filterType: select.value,
            filterMatch: matches
        }
    });
}

window.onload = () => {
    chrome.storage.sync.get({
        settings: {
            filterType: 'soft',
            filterMatch: ['interval']
        },
    }, data => {
        select.value = data.settings.filterType;
        Array.prototype.forEach.call(matchCheckboxes, checkbox => {
            checkbox.checked = data.settings.filterMatch.includes(checkbox.value);
        })
    });
}