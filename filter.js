const REGEX = {
    interval: {
        match: ' (?=[\.,!?])',
        fix: ''
    },
    excess: {
        match: '[\.,!?]{4,}',
        fix: match => {
            return match.substr(0, 3);
        }
    }
}

let settings;

const getSettings = async () => {
    return new Promise(resolve => {
        chrome.storage.sync.get('settings', result => { resolve(result.settings); });
    });
}

const init = async () => {
    settings = await getSettings();
    let filter = getFilter(settings.filterType, settings.filterMatch, settings.censorshipString);
    applyFilter(filter);
};

const applyFilter = filter => {
    switch (window.location.hostname) {

        case 'novini.bg':
            window.addEventListener('load', () => {
                let content = []
                let articleParagraphs = document.getElementsByClassName('openArticle__content')[0].getElementsByTagName('p');
                let comments = document.getElementsByClassName('comment__content');
                Array.prototype.push.apply(content, articleParagraphs);
                Array.prototype.push.apply(content, comments);
                Array.prototype.forEach.call(content, element => {
                    filter(element);
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
                                filter(mutation.addedNodes[0].querySelector('yt-formatted-string#content-text'));
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
                                filter(element.querySelector('#message'));
                            }
                        })
                        let chatObserver = new MutationObserver(mutations => {
                            let mutation = mutations[0];
                            if (
                                mutation.type === 'childList' &&
                                mutation.addedNodes.length &&
                                mutation.addedNodes[0].tagName === 'YT-FORMATTED-STRING'
                            ) {
                                filter(mutation.addedNodes[0].querySelector('#message'));
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
                    filter(paragraph);
                })
            });

    }
}

const getFilter = (filterType, filterMatch, censorshipString) => {
    let regex = '';
    let expressions = [];
    filterMatch.forEach(stupid => {
        regex += '|' + REGEX[stupid].match;
        expressions.push({
            expression: new RegExp(REGEX[stupid].match, 'g'),
            fix: REGEX[stupid].fix
        });
    })
    regex = regex.substring(1);
    let filter = (() => {
        switch (filterType) {
            case 'full':
                return element => {
                    element.remove();
                }
            case 'hard':
                return element => {
                    element.innerHTML = censorshipString;
                }
            case 'fix':
                return element => {
                    expressions.forEach(expression => {
                        element.innerText = element.innerText.replaceAll(expression.expression, expression.fix);
                    })
                }
            case 'soft':
            default:
                return element => {
                    element.style.textDecoration = 'line-through';
                }
        }
    })();
    let capture = element => {
        if (element.innerText.match(regex)) {
            filter(element);
        }
    }
    return capture;
}

init();