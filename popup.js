let timers = [];

const startButton = document.getElementById("start");
const timersContainer = document.getElementById("timers");

startButton.addEventListener("click", function () {
  const hours = parseInt(document.getElementById("hours")?.value) || 0;
  const minutes = parseInt(document.getElementById("minutes")?.value) || 0;
  const seconds = parseInt(document.getElementById("seconds")?.value) || 0;

  if (hours) {
    document.getElementById("hours").value = null;
  }

  if (minutes) {
    document.getElementById("minutes").value = null;
  }

  if (seconds) {
    document.getElementById("seconds").value = null;
  }

  const timeLeft = hours * 3600 + minutes * 60 + seconds;
  const timerId = timers.length;

  const timer = {
    id: timerId,
    timeLeft: timeLeft,
    interval: null,
    isRunning: true,
  };

  timers.push(timer);
  saveTimers();
  renderTimer(timer);
  startTimer(timer);
});

function renderTimer(timer) {
  const timerElement = document.createElement("div");
  timerElement.className = "timer-container";
  timerElement.id = `timer-${timer.id}`;

  timerElement.innerHTML = `
        <p id="display-${timer.id}" class="time">${formatTime(
    timer.timeLeft
  )}</p>
        <div class="timer-controls">
            <img src="icons/pause.png" height="22" width="22" class="playPause" id="pause-${
              timer.id
            }" />
            <img src="icons/play.png" height="22" width="22" class="playPause" id="play-${
              timer.id
            }" style="display: none;" />
            <img src="icons/cancel.png" height="22" width="22" class="playPause" id="cancel-${
              timer.id
            }" />
        </div>
    `;

  timersContainer.appendChild(timerElement);

  document
    .getElementById(`pause-${timer.id}`)
    .addEventListener("click", function () {
      pauseTimer(timer);
    });

  document
    .getElementById(`play-${timer.id}`)
    .addEventListener("click", function () {
      playTimer(timer);
    });

  document
    .getElementById(`cancel-${timer.id}`)
    .addEventListener("click", function () {
      cancelTimer(timer);
    });
}

function startTimer(timer) {
  timer.interval = setInterval(function () {
    if (timer.timeLeft <= 0) {
      clearInterval(timer.interval);
      document.getElementById(`display-${timer.id}`).textContent = "00:00:00";
      alert("Time is up!");
    } else {
      timer.timeLeft--;
      document.getElementById(`display-${timer.id}`).textContent = formatTime(
        timer.timeLeft
      );
    }
    saveTimers();
  }, 1000);
}

function pauseTimer(timer) {
  clearInterval(timer.interval);
  timer.isRunning = false;
  document.getElementById(`pause-${timer.id}`).style.display = "none";
  document.getElementById(`play-${timer.id}`).style.display = "inline";
  saveTimers();
}

function playTimer(timer) {
  startTimer(timer);
  timer.isRunning = true;
  document.getElementById(`pause-${timer.id}`).style.display = "inline";
  document.getElementById(`play-${timer.id}`).style.display = "none";
  saveTimers();
}

function cancelTimer(timer) {
  clearInterval(timer.interval);
  document.getElementById(`timer-${timer.id}`).remove();
  timers = timers.filter((t) => t.id !== timer.id);
  saveTimers();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function saveTimers() {
  chrome.storage.local.set({ timers: timers });
}

function loadTimers() {
  chrome.storage.local.get("timers", (result) => {
    if (result.timers) {
      timers = Array.isArray(result.timers) ? result.timers : [];
      timers.forEach((timer) => {
        renderTimer(timer);
        if (timer.isRunning) {
          startTimer(timer);
        }
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", loadTimers);
