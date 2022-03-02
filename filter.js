getSettings = async () => {
    return new Promise(resolve => {
        chrome.storage.sync.get('settings', result => { resolve(result.filterType); });
    });
}

init = async () => {
    filterType = await getSettings();
    switch (window.location.hostname) {
        default:
            window.addEventListener('load', () => {
                let content = document.getElementsByTagName('p');
                Array.prototype.forEach.call(content, paragraph => {
                    filterElement(paragraph);
                })
            });
    }
};

filterElement = element => {
    if (element.innerText.match('( [\.,!?])')) {
        switch (filterType) {
            case 'full':
                element.remove();
                break;
            case 'hard':
                element.innerHTML = 'Content removed due to stupidity.';
                element.classList.add('retard-overwrite');
                break;
            case 'soft':
            default:
                element.classList.add('retard-diminish');
        }
    }
}

init();