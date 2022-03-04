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
                Array.prototype.forEach.call(content, element => {
                    filterElement(element);
                })
            });
            break;

        case 'www.youtube.com':
            let observerSettings = {
                childList: true,
                subtree: true
            }
            let commentObserver = new MutationObserver((mutations, obs) => {
                let commentsContainer = document.getElementsByTagName('ytd-comments')[0];
                if (commentsContainer) {
                    let contentDiv = commentsContainer.querySelector('#contents');
                    if (contentDiv) {
                        let newCommentObserver = new MutationObserver((mutations) => {
                            let mutation = mutations[0];
                            if (
                                mutation.type === 'childList' &&
                                mutation.addedNodes.length &&
                                mutation.addedNodes[0].tagName === 'YTD-COMMENT-THREAD-RENDERER'
                            ) {
                                filterElement(mutation.addedNodes[0].querySelector('yt-formatted-string#content-text'));
                            }
                        });
                        newCommentObserver.observe(contentDiv, observerSettings);
                        obs.disconnect();
                    }
                }
            });
            commentObserver.observe(document, observerSettings);
            let iFrameObserver = new MutationObserver((mutations, obs) => {
                let chatFrame = document.getElementById('chatframe');
                if (chatFrame) {
                    let chatWindow = chatFrame.contentWindow;
                    chatWindow.addEventListener('load', e => {
                        let chatItems = chatWindow.document.getElementById('item-offset').childNodes[1];
                        chatItems.childNodes.forEach(element => {
                            if (element.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                                filterElement(element.querySelector('#message'));
                            }
                        })
                        let chatObserver = new MutationObserver(mutations => {
                            let mutation = mutations[0];
                            if (
                                mutation.type === 'childList' &&
                                mutation.addedNodes.length &&
                                mutation.addedNodes[0].tagName === 'YT-FORMATTED-STRING'
                            ) {
                                filterElement(mutation.addedNodes[0].querySelector('#message'));
                            }
                        });
                        chatObserver.observe(chatItems, observerSettings);
                    })
                    obs.disconnect();
                    return;
                }
            });
            iFrameObserver.observe(document, observerSettings);
            break;

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
                element.style.fontStyle = 'oblique';
                break;
            case 'fix':
                element.innerText = element.innerText.replaceAll(/ (?=[\.,!?])/ig, '');
                break;
            case 'soft':
            default:
                element.style.textDecoration = 'line-through';
        }
    }
}

init();