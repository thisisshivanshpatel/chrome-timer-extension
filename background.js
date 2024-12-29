let timer;
let timeLeft = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ timeLeft: 0, isRunning: false });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.timeLeft) {
    timeLeft = changes.timeLeft.newValue;
  }
  if (changes.isRunning) {
    if (changes.isRunning.newValue) {
      timer = setInterval(updateTimer, 1000);
    } else {
      clearInterval(timer);
    }
  }
});

function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    chrome.storage.local.set({ timeLeft: 0, isRunning: false });
  } else {
    timeLeft--;
    chrome.storage.local.set({ timeLeft: timeLeft });
  }
}
