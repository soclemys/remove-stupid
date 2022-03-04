let settings;

const getSettings = async () => {
    return new Promise(resolve => {
        chrome.storage.sync.get('settings', result => { resolve(result.settings); });
    });
}

const init = async () => {
    settings = await getSettings();
    applyFilters();
};

const applyFilters = () => {
    switch (window.location.hostname) {
        case 'novini.bg':
            window.addEventListener('load', () => {
                let content = []
                let articleParagraphs = document.getElementsByClassName('openArticle__content')[0].getElementsByTagName('p');
                let comments = document.getElementsByClassName('comment__content');
                Array.prototype.push.apply(content, articleParagraphs);
                Array.prototype.push.apply(content, comments);
                console.log(content);
                Array.prototype.forEach.call(content, element => {
                    filterElement(element);
                })
            });
            break
        default:
            window.addEventListener('load', () => {
                let content = document.getElementsByTagName('p');
                Array.prototype.forEach.call(content, paragraph => {
                    filterElement(paragraph);
                })
            });
    }
}

const filterElement = element => {
    if (element.innerText.match(' (?=[\.,!?])')) {
        switch (settings.filterType) {
            case 'full':
                element.remove();
                break;
            case 'hard':
                element.innerHTML = 'Content removed due to stupidity.';
                element.classList.add('stupid-overwrite');
                break;
            case 'fix':
                console.log('opa');
                element.innerText = element.innerText.replaceAll(/ (?=[\.,!?])/ig, '');
                break;
            case 'soft':
            default:
                element.classList.add('stupid-diminish');
        }
    }
}

init();