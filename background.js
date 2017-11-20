DEFAULT_CONFIG = {
    'min': {
        'likes': 1000,
        'plays': 0,
        'likePlayRatio': 0.05
    },
    'max': {
        'likes': 10000,
        'plays': 100000000
    },
    'isPlaylist': false
}

var currentConfig = DEFAULT_CONFIG;

function setConfig(config) {
    // console.log("background setConfig");
    currentConfig = config;
    chrome.storage.sync.set({"config": config})
    chrome.tabs.query({active: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action: "reload_config", config: config}, function(response){});
    })
}

function getConfig(callback) {
    // console.log("background getConfig");
    return chrome.storage.sync.get("config", function(data){
        callback(data.config);
    });
}

getConfig(function(data) {
    if (!data.config || $.isEmptyObject(data.config)) {
        setConfig(DEFAULT_CONFIG);
    }
});

// listen for requests for the config from content scripts
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.getConfig) {
            // console.log("config request");
            sendResponse(currentConfig);
        }
    }
)
