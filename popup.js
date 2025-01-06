chrome.runtime.connect({ name: "popup-open" });

document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("start");
  const timersContainer = document.getElementById("timers");

  const audio = new Audio("sounds/clockSound.mp3");
  const unPauseOrCancel = new Audio("sounds/unpauseSound.mp3");
  const cancelSound = new Audio("sounds/cancelSound.mp3");

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

    if (hours || minutes || seconds) {
      const timeLeft = hours * 3600 + minutes * 60 + seconds;
      const timerId = Date.now();

      const timer = {
        id: timerId,
        timeLeft: timeLeft,
        interval: null,
        isRunning: true,
        lastUpdatedAt: Date.now(),
      };

      sendMessage("setTimer", timer);
      renderTimer(timer);

      audio.play();
    }
  });

  /** used for rendering timers to dom */
  function renderTimer(timer) {
    const timerElement = document.createElement("div");
    timerElement.className = "timer-container";
    timerElement.id = `timer-${timer.id}`;
    timerElement.style.maxHeight = "50px";

    timerElement.innerHTML = `
        <p id="display-${timer.id}" class="time">${formatTime(
      timer.timeLeft
    )}</p>
        <div class="timer-controls">
            <img src="icons/pause.png" height="22" width="22" class="playPause" id="pause-${
              timer.id
            }" style="display:${timer?.isRunning ? "" : "none"};"/>
            <img src="icons/play.png" height="22" width="22" class="playPause" id="play-${
              timer.id
            }" style="display:${timer?.isRunning ? "none" : ""};" />
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

  function pauseTimer(timer) {
    sendMessage("pauseTimer", timer);
    document.getElementById(`pause-${timer.id}`).style.display = "none";
    document.getElementById(`play-${timer.id}`).style.display = "inline";
    unPauseOrCancel.play();
  }

  function playTimer(timer) {
    sendMessage("playTimer", timer);
    document.getElementById(`pause-${timer.id}`).style.display = "inline";
    document.getElementById(`play-${timer.id}`).style.display = "none";
    audio.play();
  }

  function cancelTimer(timer) {
    document.getElementById(`timer-${timer.id}`).remove();
    sendMessage("removeTimer", timer);
    cancelSound.play();
  }

  /** method used for returning formatted time */
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours
      .toString()
      .padStart(
        2,
        "0"
      )}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /** used for inserting time to dom */
  function updateTimerInDom(timer) {
    document.getElementById(`display-${timer.id}`).textContent = formatTime(
      timer.timeLeft
    );
  }

  /** used for removing timer from dom */
  function removeTimerFromDom(timer) {
    document?.getElementById(`timer-${timer.id}`)?.remove();
    cancelSound.play();
  }

  // for constantly updating the time in dom
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timers) {
      const newTimers = changes.timers.newValue;

      for (const timer of newTimers) {
        if (timer?.isRunning) {
          updateTimerInDom(timer);
        }
      }
    }
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "removeTimerFromDom") {
      removeTimerFromDom(request.data.timer);
    }
  });

  function loadTimers() {
    chrome.storage.local.get("timers", (result) => {
      if (result.timers) {
        const timers = Array.isArray(result.timers) ? result.timers : [];

        for (const timer of timers) {
          const difference = Date.now() - timer.lastUpdatedAt;
          if (difference >= 10000 && timer.isRunning) {
            sendMessage("playTimer", timer);
          }
          renderTimer(timer);
        }
      }
    });
  }

  /** used for sending message to background script */
  function sendMessage(action, data) {
    chrome.runtime.sendMessage(
      {
        action: action,
        data: {
          ...data,
        },
      }
      // (response) => {
      //   console.log("Response from background script:", response);
      // }
    );
  }

  loadTimers();
});
