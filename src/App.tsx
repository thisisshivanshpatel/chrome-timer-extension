import { useEffect, useState } from "react";
import "./output.css";
import { Pomodoro } from "./Pomodoro";
import { IoLogoLinkedin, IoMdArrowRoundBack } from "react-icons/io";
import { Box, CircularProgress } from "@mui/material";

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

type PomodoroTimer = {
  focusTimeLength: number;
  focusTimeNotificationMessage: string[];
  isFocusTimerRunning: boolean;
  breakTimeLength: number;
  breakTimeNotificationMessage: string[];
  isBreakTimerRunning: boolean;
  remainingSessionRounds: number;
  sessionEndNotificationMessage: string[];
};

type Timer = {
  id: number;
  timeLeft: number;
  interval: number | undefined;
  isRunning: boolean;
  lastUpdatedAt: number;
  isPomodoroTimerRunning: boolean;
  pomodoroTimer?: PomodoroTimer;
};

enum DataStorage {
  Timer = "timers",
}

const MyComponent = () => {
  const [showTimerBlock, setShowTimerBlock] = useState<boolean>(false);
  const [showPomodoroBlock, setShowPomodoroBlock] = useState<boolean>(false);
  const [hours, setHours] = useState<number | undefined>(undefined);
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState<number | undefined>(undefined);
  const [runningTimersArray, setRunningTimersArray] = useState<Timer[]>([]);
  const [isPomodoroTimerRunning, setIsPomodoroTimerRunning] =
    useState<boolean>(false);
  const [runningPomodoroTimer, setRunningPomodoroTimer] = useState<
    { timer: Timer; totalTime: number; type: PomodoroTimerType } | undefined
  >(undefined);

  chrome.runtime.connect({ name: "popup-open" });

  // importing audio
  const audio = new Audio("sounds/clockSound.mp3");
  const unPauseOrCancel = new Audio("sounds/unpauseSound.mp3");
  const cancelSound = new Audio("sounds/cancelSound.mp3");

  const handleStartTimer = (
    pomodoroTimer?: PomodoroTimer,
    isPomodoroTimerRunning: boolean = false
  ) => {
    if (hours || minutes || seconds || isPomodoroTimerRunning) {
      const timeLeft =
        (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
      const timerId = Date.now();

      const timer: Timer = {
        id: timerId,
        timeLeft: timeLeft,
        interval: undefined,
        isRunning: true,
        lastUpdatedAt: Date.now(),
        isPomodoroTimerRunning: false,
      };

      // pomodoro timer
      if (
        isPomodoroTimerRunning &&
        Object.values(pomodoroTimer ?? {}).length > 0
      ) {
        const PomodoroTimerData: Timer = {
          ...timer,
          timeLeft: (pomodoroTimer?.focusTimeLength ?? 0) * 60,
          isPomodoroTimerRunning: true,
          pomodoroTimer,
        };

        sendMessage(TimerActions.SET_TIMER, PomodoroTimerData);
        audio.play();
        return;
      }

      if (runningTimersArray?.length > 0) {
        setRunningTimersArray((prev) => [...prev, timer]);
      } else {
        setRunningTimersArray([timer]);
      }

      sendMessage(TimerActions.SET_TIMER, timer);
      audio.play();

      setHours(0);
      setMinutes(0);
      setSeconds(0);
    }
  };

  /** used for removing timer*/
  function removeTimerFromDom(
    timer: Timer,
    fromUI: boolean = false,
    isPomodoroTimerRunning = false
  ) {
    if (!isPomodoroTimerRunning && !timer?.isPomodoroTimerRunning) {
      const filteredTimer = runningTimersArray.filter(
        (key) => key?.id !== timer?.id
      );
      setRunningTimersArray(filteredTimer);
    }

    if (isPomodoroTimerRunning || timer?.isPomodoroTimerRunning) {
      setIsPomodoroTimerRunning(false);
      setRunningPomodoroTimer(undefined);
    }

    cancelSound.play();

    if (fromUI) {
      sendMessage(TimerActions.REMOVE_TIMER, timer);
    }
  }

  /** method used for pausing a timer */
  function pauseTimer(timer: Timer) {
    sendMessage(TimerActions.PAUSE_TIMER, timer);
    unPauseOrCancel.play();
  }

  /** method used for playing a timer */
  function playTimer(timer: Timer) {
    sendMessage(TimerActions.PLAY_TIMER, timer);
    audio.play();
  }

  /** method used for sending message to the background script */
  function sendMessage(action: TimerActions, data: Timer) {
    chrome.runtime.sendMessage(
      {
        action,
        data: {
          ...data,
        },
      }
      // (response) => {
      //   console.log("Response from background script:", response);
      // }
    );
  }

  /** method used for returning formatted time */
  function formatTime(seconds: number, isPomodoroTimerRunning = false) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (isPomodoroTimerRunning) {
      return `${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function loadTimers() {
    chrome.storage.local.get(DataStorage.Timer, (result) => {
      if (result.timers) {
        const timers: Timer[] = Array.isArray(result.timers)
          ? result.timers
          : [];

        const singleTimer = timers?.[0];
        if (singleTimer?.isPomodoroTimerRunning) {
          setIsPomodoroTimerRunning(true);

          if (!isPomodoroTimerRunning) {
            setIsPomodoroTimerRunning(true);
          }
          setRunningPomodoroTimer({
            timer: singleTimer,
            type: singleTimer?.pomodoroTimer?.isFocusTimerRunning
              ? PomodoroTimerType.FOCUS_TIMER
              : PomodoroTimerType.BREAK_TIMER,
            totalTime: singleTimer?.pomodoroTimer?.isFocusTimerRunning
              ? singleTimer?.pomodoroTimer?.focusTimeLength ?? 0
              : singleTimer?.pomodoroTimer?.breakTimeLength ?? 0,
          });
        } else {
          setRunningTimersArray(timers);
        }

        for (const timer of timers) {
          const difference = Date.now() - timer.lastUpdatedAt;
          if (difference >= 10000 && timer.isRunning) {
            sendMessage(TimerActions.PLAY_TIMER, timer);
          }
        }
      }
    });
  }

  // for constantly updating the time
  useEffect(() => {
    const handleOnchange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.timers?.newValue) {
        const newTimers: Timer[] = changes.timers?.newValue;

        const singleTimer = newTimers?.[0];
        if (singleTimer?.isPomodoroTimerRunning) {
          if (!isPomodoroTimerRunning) {
            setIsPomodoroTimerRunning(true);
          }
          setRunningPomodoroTimer({
            timer: singleTimer,
            type: singleTimer?.pomodoroTimer?.isFocusTimerRunning
              ? PomodoroTimerType.FOCUS_TIMER
              : PomodoroTimerType.BREAK_TIMER,
            totalTime: singleTimer?.pomodoroTimer?.isFocusTimerRunning
              ? singleTimer?.pomodoroTimer?.focusTimeLength ?? 0
              : singleTimer?.pomodoroTimer?.breakTimeLength ?? 0,
          });
        } else {
          setRunningTimersArray(newTimers);
        }
      }
    };
    chrome.storage.onChanged.addListener(handleOnchange);
    return () => {
      chrome.storage.onChanged.removeListener(handleOnchange);
    };
  }, []);

  useEffect(() => {
    const handleOnMessage = (request: {
      action: string;
      data: { timer: Timer };
    }) => {
      if (request.action === "removeTimerFromDom") {
        removeTimerFromDom(request.data.timer);
      }
    };
    chrome.runtime.onMessage.addListener(handleOnMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleOnMessage);
    };
  }, []);

  useEffect(() => {
    loadTimers();
  }, []);

  return (
    <>
      <div className="mb-10 main-container">
        <div className="content">
          <p className="mt-2 ext-heading theme">Timez Timer & Pomodoro</p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              className="clock"
              src="icons/clock.png"
              height="200px"
              width="200px"
              alt="Clock"
              aria-label="Clock icon"
            />
          </div>

          {!showTimerBlock && !showPomodoroBlock && !isPomodoroTimerRunning && (
            <div id="button-block">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button
                  className="button"
                  id="start"
                  style={{ marginTop: "3px" }}
                  onClick={() => setShowTimerBlock((prev) => !prev)}
                >
                  Set a Timer
                </button>
              </div>

              {!(runningTimersArray?.length > 0) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <button
                    id="pomodoro"
                    className="button"
                    style={{ marginTop: "3px" }}
                    onClick={() => setShowPomodoroBlock(true)}
                  >
                    Pomodoro Timer
                  </button>
                </div>
              )}
            </div>
          )}

          {showTimerBlock && (
            <div id="entry-block">
              <IoMdArrowRoundBack
                onClick={() => setShowTimerBlock((prev) => !prev)}
                cursor={"pointer"}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "10px",
                }}
              >
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="60"
                  id="hours"
                  placeholder="H"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="60"
                  id="minutes"
                  placeholder="M"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="60"
                  id="seconds"
                  placeholder="S"
                  value={seconds}
                  onChange={(e) => setSeconds(+e.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <button
                    id="start"
                    className="button"
                    style={{ marginTop: "3px" }}
                    onClick={() => handleStartTimer()}
                  >
                    Start
                  </button>
                </div>
              </div>

              <div id="timers"></div>
            </div>
          )}

          {showPomodoroBlock && (
            <Pomodoro
              goBack={() => setShowPomodoroBlock((prev) => !prev)}
              setPomodoroTimer={(pomodoroTimer, isPomodoroTimerRunning) =>
                handleStartTimer(pomodoroTimer, isPomodoroTimerRunning)
              }
            />
          )}

          {runningTimersArray?.length > 0 && !showPomodoroBlock && (
            <div className="timers">
              {runningTimersArray?.map((timer) => (
                <div
                  id={`${timer.id}`}
                  className="timer-container"
                  style={{ maxHeight: 50 }}
                >
                  <p id="display-${timer.id}" className="time">
                    {formatTime(timer.timeLeft)}
                  </p>
                  <div className="timer-controls">
                    <img
                      src="icons/pause.png"
                      height="22"
                      width="22"
                      className="playPause"
                      id={`pause-${timer.id}`}
                      style={{ display: timer?.isRunning ? "" : "none" }}
                      onClick={() => {
                        pauseTimer(timer);
                      }}
                      aria-label="Pause timer"
                      role="button"
                    />
                    <img
                      src="icons/play.png"
                      height="22"
                      width="22"
                      className="playPause"
                      id={`play-${timer.id}`}
                      style={{ display: timer?.isRunning ? "none" : "" }}
                      onClick={() => {
                        playTimer(timer);
                      }}
                      aria-label="Play timer"
                      role="button"
                    />
                    <img
                      src="icons/cancel.png"
                      height="22"
                      width="22"
                      className="playPause"
                      id={`cancel-${timer.id}`}
                      onClick={() => {
                        removeTimerFromDom(timer, true);
                      }}
                      aria-label="Cancel timer"
                      role="button"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isPomodoroTimerRunning && (
            <>
              <div className="mt-4 text-2xl text-center">
                {runningPomodoroTimer?.type === PomodoroTimerType.FOCUS_TIMER
                  ? "Focus Time 💻"
                  : "Break Time 🍀"}
              </div>
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 6,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={
                    ((runningPomodoroTimer?.timer?.timeLeft ?? 0) /
                      ((runningPomodoroTimer?.totalTime ?? 1) * 60)) *
                    100
                  }
                  size={200}
                  thickness={4}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    borderRadius: "50%",
                    color: "#8B5DFF",
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 15,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="flex flex-col items-center justify-center w-full gap-2">
                    <div className="flex justify-center gap-4">
                      <img
                        src="icons/pause.png"
                        height="22"
                        width="22"
                        className="cursor-pointer playPause"
                        id="pause-pomodoro"
                        style={{
                          display: runningPomodoroTimer?.timer?.isRunning
                            ? ""
                            : "none",
                        }}
                        onClick={() => {
                          if (runningPomodoroTimer?.timer) {
                            pauseTimer(runningPomodoroTimer.timer);
                          }
                        }}
                        aria-label="Pause timer"
                        role="button"
                      />
                      <img
                        src="icons/play.png"
                        height="22"
                        width="22"
                        className="cursor-pointer playPause"
                        id="play-pomodoro-timer"
                        style={{
                          display: runningPomodoroTimer?.timer?.isRunning
                            ? "none"
                            : "",
                        }}
                        onClick={() => {
                          if (runningPomodoroTimer?.timer) {
                            playTimer(runningPomodoroTimer.timer);
                          }
                        }}
                        aria-label="Play timer"
                        role="button"
                      />
                      <img
                        src="icons/cancel.png"
                        height="22"
                        width="22"
                        className="cursor-pointer playPause"
                        id="cancel-timer"
                        onClick={() => {
                          if (runningPomodoroTimer?.timer) {
                            removeTimerFromDom(
                              runningPomodoroTimer.timer,
                              true,
                              true
                            );
                          }
                        }}
                        aria-label="Cancel timer"
                        role="button"
                      />
                    </div>

                    <p className="text-2xl font-bold text-center time">
                      {formatTime(
                        runningPomodoroTimer?.timer?.timeLeft ?? 0,
                        true
                      )}
                    </p>
                  </div>
                </Box>
              </Box>
            </>
          )}
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 w-full bg-[#EBEAFF] py-2 text-center">
        <a
          href="https://www.linkedin.com/in/shivansh-patel-4915b4171/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h5 className="flex items-center justify-center gap-1">
            <IoLogoLinkedin />
            <span>created by Shivansh Patel</span>
          </h5>
        </a>
      </footer>
    </>
  );
};

export default MyComponent;
