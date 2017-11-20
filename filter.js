const DEFAULT_STAT_NUM = 0;

var soundList = $(".lazyLoadingList");
var soundElements = [];
var config = {};

// turn object config entries into two dimensional arrays
// of key-value pairs.
function optimizeConfig(config) {
    optimized = {};
    for (var key in config) {
        var configEntry = config[key];
        var configEntryOptimized;
        if (typeof configEntry === "object") {
            configEntryOptimized = [];
            for (var entryKey in configEntry) {
                configEntryOptimized.push([entryKey, configEntry[entryKey]]);
            }
        }
        else {
            configEntryOptimized = configEntry;
        }
        optimized[key] = configEntryOptimized;
    }
    return optimized;
}

// // inverse of the optimizeConfig function
// function unoptimizeConfig(optimized) {
//     var config = {};
//     for (var key in optimized) {
//         var optimizedEntry = optimized[key];
//         var configEntry;
//         if (optimizedEntry instanceof Array) {
//             configEntry = {};
//             optimizedEntry.forEach(function(value){
//                 configEntry[value[0]] = value[1];    
//             });
//         }
//         else {
//             configEntry = optimizedEntry;
//         }
//         config[key] = configEntry;
//     }
//     return config;
// }
// const CONFIG = {
//     'min': [
//         ['likes', 1000],
//         ['likePlayRatio', 0.08]
//     ],
//     'max': [
//         ['likes', 10000]
//     ],
//     'isPlaylist': false
// }

function parseNumber(stringNum) {
    var noCommas = stringNum.replace(/,/g, "");
    var result;
    if (noCommas.includes("K")) {
        var cleanNum = parseInt(noCommas.substring(0, noCommas.length - 1));
        result = 1000 * cleanNum;
    }
    else if (noCommas.includes("M")) {
        var cleanNum = parseInt(noCommas.substring(0, noCommas.length - 1));
        result = 1000000 * cleanNum; 
    }
    else {
        result = parseInt(noCommas);
    }
    if (isNaN(result)) {
        return DEFAULT_STAT_NUM;
    } 
    return result;
}

function isPlaylist(soundElement) {
    return $(soundElement).find(".playlist")[0] ? true: false;
}

function getLikes(soundElement) {
    var likesContainer = $(soundElement).find(".sc-button-like")[0];
    if (likesContainer) {
        return parseNumber(likesContainer.textContent);
    }
    return DEFAULT_STAT_NUM;
}

function getReposts(soundElement) {
    var repostsContainer = $(soundElement).find(".sc-button-repost")[0];
    if (repostsContainer) {
        return parseNumber(repostsContainer.textContent);
    }
    return DEFAULT_STAT_NUM;
}

function getPlays(soundElement) {
    if (isPlaylist(soundElement)) {
        return DEFAULT_STAT_NUM;
    }
    var playsMinistats = $(soundElement).find(".sc-ministats-plays")[0];
    if (playsMinistats) {
        var playsContainer = $(playsMinistats).children()[1];
        if (playsContainer) {
            return parseNumber(playsContainer.textContent);
        }
    }
    return DEFAULT_STAT_NUM;
}

function getComments(soundElement) {
    if (isPlaylist(soundElement)) {
        return DEFAULT_STAT_NUM;
    }
    var commentsMinistats = $(soundElement).find(".sc-ministats-comments")[0];
    if (commentsMinistats) {
        var commentsContainer = $(commentsMinistats).children()[1];
        if (commentsContainer) {
            return parseNumber(commentsContainer.textContent);
        }   
    }
    return DEFAULT_STAT_NUM;
}

function getTag(soundElement) {
    var tagContainer = $(soundElement).find(".soundTitle__tagContent")[0];
    if (tagContainer) {
        return tagContainer.textContent;
    }
    return "";
}

function getSoundData(soundElement) {
    var data = {
        'likes': getLikes(soundElement),
        'reposts': getReposts(soundElement),
        'plays': getPlays(soundElement),
        'comments': getComments(soundElement),
        'isPlaylist': isPlaylist(soundElement),
        'tag': getTag(soundElement)
    }
    data['likePlayRatio'] = data['plays'] !== 0 ? data['likes']/data['plays'] : 0;
    // console.log(data);
    return data;
}

function isEnabled(soundData) {
    // console.log("soundData: " + soundData);
    function minPass() {
        return config['min'].every(function(filter){
            return soundData[filter[0]] >= filter[1];
        });
    }
    
    function maxPass() {
        return config['max'].every(function(filter){
            return soundData[filter[0]] <= filter[1];
        });
    }

    function playlistPass() {
        return config['isPlaylist'] == soundData['isPlaylist'];
    }

    return minPass() && maxPass() && playlistPass();
}

var filterQueue = [];
var configInitialized = false;
// Load the config from the background page
chrome.runtime.sendMessage({getConfig: true}, function(response){
    // console.log("filter loadConfig");
    config = optimizeConfig(response);
    configInitialized = true;
    // console.log(config);
    for (var i = 0; i < filterQueue.length; i++) {
        var sound = filterQueue[i];
        if (!isEnabled(sound.data)) {
            // console.log("removing track");
            sound.element.remove();
        }
    }
});

// Observe for new sounds added to list and filter out
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node){
            if (node.classList && node.classList.contains("soundList__item")) {
                var soundData = getSoundData(node);
                if (configInitialized) {
                    if (!isEnabled(soundData)) {
                        // console.log("removing track");
                        node.remove();
                    }
                }
                else {
                    filterQueue.push({
                        'element': node,
                        'data': soundData
                    });
                }
            }
        });
    });
});
var observerConfig = {childList: true, subtree: true};
observer.observe(soundList[0], observerConfig);

// function loadConfig() {
//     chrome.runtime.sendMessage({getConfig: true}, function(response) {
//         cofing = optimizeConfig(response);
//         console.log(config);
//     });
// }

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.action == "reload_config") {
            config = request.config;
            // console.log(config);
            sendResponse({success: "true"});
        }
    }
);