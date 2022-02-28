window.onload = () => {
    chrome.storage.sync.get(['filterAction'], function(result) {
        let filterAction = result.filterAction;
        let paragraphs = document.getElementsByTagName('p');
        Array.prototype.forEach.call(paragraphs, paragraph => {
            if (paragraph.innerHTML.match(' [\.,!?]')) {
                if (filterAction == 'full') {
                    paragraph.remove();
                } else if (filterAction == 'hard') {
                    paragraph.innerHTML = 'Content removed due to stupidity.';
                    paragraph.classList.add('retard-overwrite');
                } else {
                    paragraph.classList.add('retard-diminish');
                }
            }
        })
    });
}