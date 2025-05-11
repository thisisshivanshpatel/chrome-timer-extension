type Timer = {
  id: number;
  timeLeft: number;
  interval: number | undefined;
  isRunning: boolean;
  lastUpdatedAt: number;
  isPomodoroTimerRunning: boolean;
  pomodoroTimer?: {
    focusTimeLength: number;
    focusTimeNotificationMessage: string[];
    isFocusTimerRunning: boolean;
    breakTimeLength: number;
    breakTimeNotificationMessage: string[];
    isBreakTimerRunning: boolean;
    remainingSessionRounds: number;
    sessionEndNotificationMessage: string[];
  };
};

enum DataStorage {
  Timer = "timers",
}

enum TimerActions {
  SET_TIMER = "setTimer",
  REMOVE_TIMER = "removeTimer",
  PLAY_TIMER = "playTimer",
  PAUSE_TIMER = "pauseTimer",
}

enum PomodoroTimerType {
  FOCUS_TIMER = "focusTimer",
  BREAK_TIMER = "breakTimer",
}

let timers: Timer[];
let isPopupOpen = false;

chrome.runtime.onInstalled.addListener(() => {
  // initialize the timers array
  chrome.storage.local.set({ timers: timers ?? [] });
});

// Load the timers from local storage
chrome.storage.local.get(DataStorage.Timer, (result) => {
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

chrome.runtime.onMessage.addListener(
  (request: { data: Timer; action: TimerActions }) => {
    const timer = timers?.find((t) => t?.id === request?.data?.id);

    switch (request.action) {
      case TimerActions.SET_TIMER: {
        setTimer(request.data);
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

/** used for setting a timer */
function setTimer(timer: Timer) {
  // pushing the timer to the timers array
  timers.push(timer);
  // Save the timers array to local
  saveTimers();

  //start the timer
  startTimer(timer);
}

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

      if (timer.isPomodoroTimerRunning) {
        pomodoroCore(timer);
      }

      timers = timers.filter((t) => t.id !== timer.id);
      saveTimers();
      backGroundAudio();

      let notificationMessage = "";

      if (timer.isPomodoroTimerRunning) {
        const TimerType = timer.pomodoroTimer?.isFocusTimerRunning
          ? PomodoroTimerType.FOCUS_TIMER
          : PomodoroTimerType.BREAK_TIMER;

        if (
          timer.pomodoroTimer?.isBreakTimerRunning &&
          !(timer.pomodoroTimer?.remainingSessionRounds - 1)
        ) {
          notificationMessage = getRandomMessage(
            timer.pomodoroTimer.sessionEndNotificationMessage
          );
        } else {
          notificationMessage = getRandomMessage(
            TimerType === PomodoroTimerType.FOCUS_TIMER
              ? timer.pomodoroTimer?.focusTimeNotificationMessage ?? []
              : timer.pomodoroTimer?.breakTimeNotificationMessage ?? []
          );
        }
      }
      displayNotification(notificationMessage);
    } else {
      timer.timeLeft--;
      timer.lastUpdatedAt = Date.now();
    }
    saveTimers();
  }, 1000);
}

/** used for saving the data in extensions local storage */
function saveTimers() {
  chrome.storage.local.set({ timers });
}

/** `pomodoroCore` method is responsible for handling all the `pomodoro` functionality */
function pomodoroCore(timer: Timer) {
  if (timer.isPomodoroTimerRunning) {
    if ((timer.pomodoroTimer?.remainingSessionRounds ?? 0) > 0) {
      const timeLeft =
        (timer?.pomodoroTimer?.isFocusTimerRunning
          ? timer?.pomodoroTimer?.breakTimeLength
          : timer?.pomodoroTimer?.focusTimeLength ?? 0) * 60;
      const timerId = Date.now();

      if (timer.pomodoroTimer?.isFocusTimerRunning) {
        const BreakTimer: Timer = {
          id: timerId,
          timeLeft: timeLeft,
          interval: undefined,
          isRunning: true,
          lastUpdatedAt: Date.now(),
          isPomodoroTimerRunning: true,
          pomodoroTimer: {
            focusTimeLength: timer.pomodoroTimer.focusTimeLength,
            focusTimeNotificationMessage:
              timer.pomodoroTimer.focusTimeNotificationMessage,
            isFocusTimerRunning: false,
            breakTimeLength: timer.pomodoroTimer.breakTimeLength,
            breakTimeNotificationMessage:
              timer.pomodoroTimer.breakTimeNotificationMessage,
            isBreakTimerRunning: true,
            remainingSessionRounds: timer.pomodoroTimer.remainingSessionRounds,
            sessionEndNotificationMessage:
              timer.pomodoroTimer.sessionEndNotificationMessage,
          },
        };

        setTimer(BreakTimer);
      }

      if (timer.pomodoroTimer?.isBreakTimerRunning) {
        const remainingSessionRounds =
          timer.pomodoroTimer.remainingSessionRounds - 1;

        if (remainingSessionRounds > 0) {
          const FocusTimer: Timer = {
            id: timerId,
            timeLeft: timeLeft,
            interval: undefined,
            isRunning: true,
            lastUpdatedAt: Date.now(),
            isPomodoroTimerRunning: true,
            pomodoroTimer: {
              focusTimeLength: timer.pomodoroTimer.focusTimeLength,
              focusTimeNotificationMessage:
                timer.pomodoroTimer.focusTimeNotificationMessage,
              isFocusTimerRunning: true,
              breakTimeLength: timer.pomodoroTimer.breakTimeLength,
              breakTimeNotificationMessage:
                timer.pomodoroTimer.breakTimeNotificationMessage,
              isBreakTimerRunning: false,
              remainingSessionRounds,
              sessionEndNotificationMessage:
                timer.pomodoroTimer.sessionEndNotificationMessage,
            },
          };

          setTimer(FocusTimer);
        }
      }
    }
  }
}

// notification

/** used for displaying notification */
function displayNotification(notificationMessage = "") {
  const notificationOptions: chrome.notifications.NotificationOptions<true> = {
    type: "basic",
    title: "Timer For Focus",
    message: notificationMessage ? notificationMessage : "Time Up",
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

/** method for getting random notification messages */
function getRandomMessage(notifications: string[]): string {
  const randomIndex = Math.floor(Math.random() * notifications.length);
  return notifications[randomIndex];
}
