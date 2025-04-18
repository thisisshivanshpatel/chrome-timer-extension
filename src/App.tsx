import { useEffect, useState } from "react";
import "./App.css";

export type Timer = {
  id: number;
  timeLeft: number;
  interval: number | undefined;
  isRunning: boolean;
  lastUpdatedAt: number;
};

const MyComponent = () => {
  const [showTimerBlock] = useState<boolean>(true);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [runningTimersArray, setRunningTimersArray] = useState<Timer[]>([]);

  chrome.runtime.connect({ name: "popup-open" });

  // importing audio
  const audio = new Audio("sounds/clockSound.mp3");
  const unPauseOrCancel = new Audio("sounds/unpauseSound.mp3");
  const cancelSound = new Audio("sounds/cancelSound.mp3");

  const handleStartTimer = () => {
    if (hours || minutes || seconds) {
      const timeLeft = hours * 3600 + minutes * 60 + seconds;
      const timerId = Date.now();

      const timer = {
        id: timerId,
        timeLeft: timeLeft,
        interval: undefined,
        isRunning: true,
        lastUpdatedAt: Date.now(),
      };

      if (runningTimersArray?.length > 0) {
        setRunningTimersArray((prev) => [...prev, timer]);
      } else {
        setRunningTimersArray([timer]);
      }

      sendMessage("setTimer", timer);
      audio.play();

      setHours(0);
      setMinutes(0);
      setSeconds(0);
    }
  };

  /** used for removing timer*/
  function removeTimerFromDom(timer: Timer, fromUI: boolean = false) {
    const filteredTimer = runningTimersArray.filter(
      (key) => key?.id !== timer?.id
    );
    setRunningTimersArray(filteredTimer);

    cancelSound.play();

    if (fromUI) {
      sendMessage("removeTimer", timer);
    }
  }

  /** method used for pausing a timer */
  function pauseTimer(timer: Timer) {
    sendMessage("pauseTimer", timer);
    unPauseOrCancel.play();
  }

  /** method used for playing a timer */
  function playTimer(timer: Timer) {
    sendMessage("playTimer", timer);
    audio.play();
  }

  /** method used for sending message to the background script */
  function sendMessage(action: string, data: Timer) {
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
  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function loadTimers() {
    chrome.storage.local.get("timers", (result) => {
      if (result.timers) {
        const timers = Array.isArray(result.timers) ? result.timers : [];

        for (const timer of timers) {
          const difference = Date.now() - timer.lastUpdatedAt;
          if (difference >= 10000 && timer.isRunning) {
            sendMessage("playTimer", timer);
          }
          if (runningTimersArray?.length > 0) {
            setRunningTimersArray((prev) => [...prev, timer]);
          } else {
            setRunningTimersArray([timer]);
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
      if (changes.timers) {
        const newTimers: Timer[] = changes.timers.newValue;
        // Replace the entire array instead of mapping
        setRunningTimersArray(newTimers);
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
      <div className="main-container">
        <div className="content">
          <p className="ext-heading theme">Timer for Focus</p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              className="clock"
              src="icons/clock.png"
              height="200px"
              width="200px"
              alt="Clock"
            />
          </div>

          {/* {!showTimerBlock && (
            <div id="button-block">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button
                  id="start"
                  style={{ marginTop: "3px" }}
                  onClick={() => setShowTimerBlock((prev) => !prev)}
                >
                  Set a Timer
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <button id="pomodoro" style={{ marginTop: "3px" }}>
                  Pomodoro Timer
                </button>
              </div>
            </div>
          )} */}

          {showTimerBlock && (
            <div id="entry-block">
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
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <a
          href="https://www.linkedin.com/in/shivansh-patel-4915b4171/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h5>created by Shivansh Patel</h5>
        </a>
      </footer>
    </>
  );
};

export default MyComponent;
