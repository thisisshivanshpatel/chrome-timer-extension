type Config = {
  isTimerRunning: boolean;
  timers: Timer[];
  isPomodoroTimerRunning: boolean;
  pomodoroTimer: {
    focusTimeLength: number;
    isFocusTimerRunning: boolean;
    breakTimeLength: number;
    isBreakTimerRunning: boolean;
    remainingSessionRounds: number;
  };
};

type Timer = {
  id: number;
  timeLeft: number;
  interval: number | undefined;
  isRunning: boolean;
  lastUpdatedAt: number;
};

enum TimerActions {
  SET_TIMER = "setTimer",
  REMOVE_TIMER = "removeTimer",
  PLAY_TIMER = "playTimer",
  PAUSE_TIMER = "pauseTimer",
}

let timers: Timer[];
let isPopupOpen = false;

const config: Config = {
  isTimerRunning: false,
  timers: [],
  isPomodoroTimerRunning: false,
  pomodoroTimer: {
    focusTimeLength: 0,
    isFocusTimerRunning: false,
    breakTimeLength: 0,
    isBreakTimerRunning: false,
    remainingSessionRounds: 0,
  },
};

chrome.runtime.onInstalled.addListener(() => {
  // initialize the timers array
  chrome.storage.local.set({ config });
});

// Load the timers from local storage
chrome.storage.local.get("config", (result) => {
  timers = result.config.timers || [];
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

chrome.runtime.onMessage.addListener(
  (request: { data: Timer; action: string }) => {
    const timer = timers?.find((t) => t?.id === request?.data?.id);

    switch (request.action) {
      case TimerActions.SET_TIMER: {
        // pushing the timer to the timers array
        timers.push(request.data);
        // Save the timers array to local
        saveTimers();

        //start the timer
        startTimer(request.data);
        break;
      }
      case TimerActions.REMOVE_TIMER: {
        if (timer?.interval) {
          clearInterval(timer.interval);
        }
        timers = timers.filter((t) => t.id !== request.data.id);
        saveTimers();
        break;
      }
      case TimerActions.PLAY_TIMER: {
        if (timer) {
          timer.isRunning = true;
          startTimer(timer);
        }
        break;
      }
      case TimerActions.PAUSE_TIMER: {
        if (timer) {
          clearInterval(timer.interval);
          timer.isRunning = false;
          saveTimers();
        }
        break;
      }
      default: {
        break;
      }
    }
  }
);

/** used for starting the timer */
function startTimer(timer: Timer) {
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
      backGroundAudio();
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
  chrome.storage.local.set({ config: { ...config, timers } });
}

// notification

/** used for displaying notification */
function displayNotification() {
  const notificationOptions: chrome.notifications.NotificationOptions<true> = {
    type: "basic",
    title: "Timer For Focus",
    message: "Time Up",
    iconUrl: "icons/clock128.png",
  };

  chrome.notifications.create("", notificationOptions);
}

/** used for playing `audio` in `background` */
async function backGroundAudio() {
  try {
    // Check if an offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    });

    // If exists, close it first
    if (existingContexts.length > 0) {
      await chrome.offscreen.closeDocument();
    }

    // Create new offscreen document
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("audio.html"),
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: "notification",
    });
  } catch (error) {
    console.error("Error handling offscreen document:", error);
  }
}
