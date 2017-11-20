var bkg = chrome.extension.getBackgroundPage();
var config = {};
document.addEventListener('DOMContentLoaded', init);

function init() {
  bkg.getConfig(function(data) { 
    // console.log("popup getConfig");
    config = data;
    // console.log(config);


    document.getElementById("minLikes").value = config.min['likes'];
    document.getElementById("minPlays").value = config.min['plays'];
    document.getElementById("maxLikes").value = config.max['likes'];
    document.getElementById("maxPlays").value = config.max['plays'];

    // initialize like percentage slider
    var likePercentageText = document.getElementById("likePercentageText");
    var likePercentageRange = document.getElementById("likePercentageRange");
    likePercentageRange.value = config['min']['likePlayRatio'];
    likePercentageText.textContent = (parseInt(likePercentageRange.value * 100)) + "%";
    likePercentageRange.oninput = function() {
      // console.log("oninput");
      likePercentageText.textContent = (parseInt(likePercentageRange.value * 100)) + "%";
    };

    // initialize update button
    document.getElementById("updateButton").onclick = updateConfig;
  });
}

function updateConfig() {
  // console.log("popup updateConfig");
  var minLikes = document.getElementById("minLikes").value;
  var minPlays = document.getElementById("minPlays").value;
  var maxLikes = document.getElementById("maxLikes").value;
  var maxPlays = document.getElementById("maxPlays").value;
  var likePercentage = document.getElementById("likePercentageRange").value;

  config = {
    'min': {
      'likes': parseInt(minLikes),
      'plays': parseInt(minPlays),
      'likePlayRatio': likePercentage
    },
    'max': {
      'likes': parseInt(maxLikes),
      'plays': parseInt(maxPlays)
    },
    'isPlaylist': false
  }
  bkg.setConfig(config);
  window.close();
}