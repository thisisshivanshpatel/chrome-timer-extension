let timer;
let timeLeft = 0;

const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const resetButton = document.getElementById("reset");
const display = document.getElementById("display");

startButton.addEventListener("click", function () {
  const hours = parseInt(document.getElementById("hours").value) || 0;
  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const seconds = parseInt(document.getElementById("seconds").value) || 0;

  document.getElementById("hours").value = null;
  document.getElementById("minutes").value = null;
  document.getElementById("seconds").value = null;

  // converting time to seconds
  const convertTimeToSeconds = hours * 3600 + minutes * 60 + seconds;

  // setting time left
  timeLeft = convertTimeToSeconds;

  if (chrome.storage) {
    chrome.storage.local.set({ timeLeft: timeLeft, isRunning: true });
  }
  timer = setInterval(updateTimer, 1000);
});

stopButton.addEventListener("click", function () {
  clearInterval(timer);
  if (chrome.storage) {
    chrome.storage.local.set({ isRunning: false });
  }
});

resetButton.addEventListener("click", function () {
  clearInterval(timer);
  timeLeft = 0;
  display.textContent = "00:00:00";
  if (chrome.storage) {
    chrome.storage.local.set({ timeLeft: 0, isRunning: false });
  }
});

function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    display.textContent = "00:00:00";
    alert("Time is up!");
    if (chrome.storage) {
      chrome.storage.local.set({ timeLeft: 0, isRunning: false });
    }
  } else {
    timeLeft--;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    if (chrome.storage) {
      chrome.storage.local.set({ timeLeft: timeLeft });
    }
  }
}

if (chrome.storage) {
  chrome.storage.local.get(["timeLeft", "isRunning"], function (result) {
    if (result.timeLeft) {
      timeLeft = result.timeLeft;
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;
      display.textContent = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      if (result.isRunning) {
        timer = setInterval(updateTimer, 1000);
      }
    }
  });
}
