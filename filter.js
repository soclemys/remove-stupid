const FILTERS = {
    full: element => {
        element.remove()
    },
    hard: element => {
        element.innerHTML = settings.censorshipString;
    },
    fix: element => {
        settings.fixers.forEach(expression => {
            element.innerText = element.innerText.replaceAll(expression.expression, expression.fix);
        })
    },
    soft: element => {
        element.style.textDecoration = 'line-through';
    }
}

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

const getSettings = async () => {
    return new Promise(resolve => {
        chrome.storage.sync.get('settings', result => { resolve(result.settings); });
    });
}

const getFilter = () => {
    let regexp = '';
    settings.filterMatch.forEach(pattern => {
        regexp += '|' + REGEX[pattern].match;
    })
    if (settings.filterType == 'fix') {
        settings.fixers = []
        settings.filterMatch.forEach(pattern => {
            settings.fixers.push({
                expression: new RegExp(REGEX[pattern].match, 'g'),
                fix: REGEX[pattern].fix
            });
        })
    }
    regexp = regexp.substring(1);
    let filter = FILTERS[settings.filterType];
    let capture = element => {
        if (element.innerText.match(regexp)) {
            console.log('Filtered element: ', element);
            filter(element);
        }
    }
    return capture;
}

const applyFilter = filter => {
    switch (window.location.hostname) {

        case 'novini.bg':
            window.addEventListener('load', () => {
                let comments = document.getElementsByClassName('comment__content');
                Array.prototype.forEach.call(comments, element => {
                    filter(element);
                })
            });
            break;

        case 'www.youtube.com':
            let observerSettings = {
                childList: true,
                subtree: true
            }

            // the following is for comments
            let commentSectionObserver = new MutationObserver((mutations, obs) => {
                mutations.forEach(mutation => {
                    if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        mutation.target.id === 'comments'
                    ) {
                        let contentsDiv = mutation.addedNodes[3].childNodes[5];
                        let commentObserver = new MutationObserver(mutations => {
                            mutations.forEach(mutation => {
                                if (
                                    mutation.type === 'childList' &&
                                    mutation.addedNodes.length &&
                                    mutation.target.id === 'content-text'
                                ) {
                                    filter(mutation.target);
                                }
                            })
                        })
                        commentObserver.observe(contentsDiv, observerSettings);
                        obs.disconnect();
                    }
                })
            });
            commentSectionObserver.observe(document, observerSettings);

            // the following is for live chat
            let iFrameObserver = new MutationObserver((mutations, obs) => {
                mutations.forEach(mutation => {
                    if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        mutation.target.id === 'secondary-inner' &&
                        (mutation.addedNodes[1] && mutation.addedNodes[1].tagName === 'YTD-LIVE-CHAT-FRAME')
                    ) {
                        let chatWindow = mutation.addedNodes[1].querySelector('iframe').contentWindow;
                        chatWindow.addEventListener('load', e => {
                            let chatItems = chatWindow.document.getElementById('item-offset').childNodes[1];
                            chatItems.childNodes.forEach(element => {
                                if (element.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                                    filter(element.querySelector('#message'));
                                }
                            })
                            let chatObserver = new MutationObserver(mutations => {
                                mutations.forEach(mutation => {
                                    if (mutation.target.id == 'message') { 
                                        filter(mutation.target);
                                    }
                                })
                            });
                            chatObserver.observe(chatItems, observerSettings);
                        })
                        obs.disconnect();
                    }
                });
            });
            iFrameObserver.observe(document, observerSettings);

            break;

        case 'www.facebook.com':
            // fuck facebook for this among other things
            let retrieveCommentElement = el => {
                // console.log(el);
                if (el.childNodes.length > 1) {
                    el = el.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
                    if (el.childNodes.length === 3) {
                        el = el.childNodes[2];
                    } else {
                        el = el.childNodes[1];
                    }
                } else {
                    if (el.childNodes[0].childNodes[1]) {
                        el = el.childNodes[0].childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
                        if (el.childNodes.length > 1) {
                            el = el.childNodes[1];
                        } else {
                            el = el.childNodes[0].childNodes[0];
                            if (el.childNodes.length == 2) {
                                el = el.childNodes[1];
                            } else {
                                el = el.childNodes[2];
                            }
                        }
                    } else {
                        console.log('THIS IS THE ERROR');
                        console.log(el.childNodes[0].childNodes[1]);
                    }
                }
                return el
            }

            observer = new MutationObserver((mutations, observer) => {
                mutations.forEach(mutation => {
                    // this captures top-level comments that load in
                    if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        (mutation.addedNodes[0].tagName === 'LI' && mutation.target.tagName === 'UL')
                    ) {
                        let el = retrieveCommentElement(mutation.addedNodes[0].childNodes[0]);
                        if (el) filter(el);
                        
                    // this captures posts that load in
                    } else if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        (mutation.addedNodes[0].dataset && mutation.addedNodes[0].dataset.pagelet === 'FeedUnit_{n}')
                    ) {
                        let el = mutation.addedNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[2];
                        if (el && el.childNodes[0].dir == 'auto') filter(el.childNodes[0]);
                    // this captures comment replies
                    } else if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        (mutation.addedNodes[0].childNodes[1] && mutation.addedNodes[0].childNodes[1].tagName === 'UL')
                    ) {
                        mutation.addedNodes[0].childNodes[1].childNodes.forEach(node => {
                            node.childNodes[0].childNodes.forEach(childNode => {
                                if (childNode.ariaLabel) {
                                    let el = retrieveCommentElement(childNode);
                                    if (el) filter(el);
                                }
                            });
                        });
                    } else if (
                        mutation.type === 'childList' &&
                        mutation.addedNodes.length &&
                        (mutation.addedNodes[0].childNodes[0] && mutation.addedNodes[0].childNodes[0].tagName === 'UL')
                    ) {
                        mutation.addedNodes[0].childNodes[0].childNodes.forEach(node => {
                            node.childNodes[0].childNodes.forEach(childNode => {
                                if (childNode.ariaLabel) {
                                    let el = retrieveCommentElement(childNode);
                                    if (el) filter(el);
                                }
                            })
                        });
                    }
                })
            })
            observer.observe(document, {
                childList: true,
                subtree: true
            })
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

const init = async () => {
    settings = await getSettings();
    let filter = getFilter();
    applyFilter(filter);
};

init();