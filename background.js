let timers = [];
let isPopupOpen = false;

chrome.runtime.onInstalled.addListener(() => {
  // initialize the timers array
  chrome.storage.local.set({ timers: timers });
});

// Load the timers from local storage
chrome.storage.local.get("timers", (result) => {
  timers = result.timers || [];
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup-open") {
    isPopupOpen = true;

    // Listen for popup disconnect
    port.onDisconnect.addListener(() => {
      isPopupOpen = false;
    });
  }
});

// on browser closing
// chrome.runtime.onSuspend.addListener(() => {
//   return new Promise((resolve) => {
//     chrome.storage.local.set({ timers: [] }, () => {
//       resolve();
//     });
//   });
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const timer = timers?.find((t) => t?.id === request?.data?.id);

  switch (request.action) {
    case "setTimer": {
      // pushing the timer to the timers array
      timers.push(request.data);
      // Save the timers array to local
      saveTimers();

      //start the timer
      startTimer(request.data);
      break;
    }
    case "removeTimer": {
      if (timer?.interval) {
        clearInterval(timer.interval);
      }
      timers = timers.filter((t) => t.id !== request.data.id);
      saveTimers();
      break;
    }
    case "playTimer": {
      timer.isRunning = true;

      startTimer(timer);
      break;
    }
    case "pauseTimer": {
      clearInterval(timer.interval);
      timer.isRunning = false;
      saveTimers();
      break;
    }
    default: {
      break;
    }
  }
});

/** used for starting the timer */
function startTimer(timer) {
  timer.interval = setInterval(function () {
    if (timer.timeLeft <= 0) {
      clearInterval(timer.interval);

      if (isPopupOpen) {
        chrome.runtime.sendMessage({
          action: "removeTimerFromDom",
          data: {
            timer: timer,
          },
        });
      }

      timers = timers.filter((t) => t.id !== timer.id);
      saveTimers();
      backGroundAudio()
      displayNotification();
    } else {
      timer.timeLeft--;
      timer.lastUpdatedAt = Date.now();
    }
    saveTimers();
  }, 1000);
}

/** used for saving the data in extensions local storage */
function saveTimers() {
  chrome.storage.local.set({ timers: timers });
}


// notification

/** used for displaying notification */
function displayNotification() {
  const notificationOptions = {
    type: "basic",
    title: "Timer For Focus",
    message: "Time Up",
    iconUrl: "icons/clock128.png"
  };

  chrome.notifications.create(null, notificationOptions);
}

/** used for playing audio */
function backGroundAudio() {
  chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('audio.html'),
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'notification'
  });
}