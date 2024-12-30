let timers = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ timers: {} });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.timers) {
    const newTimers = changes.timers.newValue;
    for (const id in newTimers) {
      if (newTimers[id].isRunning && !timers[id]) {
        startBackgroundTimer(id, newTimers[id].timeLeft);
      } else if (!newTimers[id].isRunning && timers[id]) {
        clearInterval(timers[id].interval);
        delete timers[id];
      }
    }
  }
});

function startBackgroundTimer(id, timeLeft) {
  timers[id] = {
    timeLeft: timeLeft,
    interval: setInterval(() => updateTimer(id), 1000),
  };
}

function updateTimer(id) {
  if (timers[id].timeLeft <= 0) {
    clearInterval(timers[id].interval);
    delete timers[id];
    chrome.storage.local.get("timers", (result) => {
      const updatedTimers = result.timers;
      if (updatedTimers[id]) {
        updatedTimers[id].timeLeft = 0;
        updatedTimers[id].isRunning = false;
        chrome.storage.local.set({ timers: updatedTimers });
      }
    });
  } else {
    timers[id].timeLeft--;
    chrome.storage.local.get("timers", (result) => {
      const updatedTimers = result.timers;
      if (updatedTimers[id]) {
        updatedTimers[id].timeLeft = timers[id].timeLeft;
        chrome.storage.local.set({ timers: updatedTimers });
      }
    });
  }
}
