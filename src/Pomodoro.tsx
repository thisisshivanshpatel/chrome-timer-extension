import { useState } from "react";

import { Slider } from "@heroui/react";
import { IoMdArrowRoundBack } from "react-icons/io";

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

const focusTimeNotificationMessage = [
  "Hurray Focus Time is over now enjoy the break 😎",
  "Time up take a Break 🍀",
];
const sessionEndNotificationMessage = ["you have done it ⌛️"];
const breakTimeNotificationMessage = [
  "Break is over now get back to work 🚀",
  "Break Time is up 😇",
];

export const Pomodoro = ({
  goBack,
  setPomodoroTimer,
}: {
  goBack: () => void;
  setPomodoroTimer: (
    pomodoroTimer: PomodoroTimer,
    isPomodoroTimerRunning: boolean
  ) => void;
}) => {
  const [focusTimeLength, setFocusTimeLength] = useState(25);
  const [breakTimeLength, setBreakTimeLength] = useState(5);
  const [sessionRoundsLength, setSessionRoundsLength] = useState(1);

  console.log(
    "hi.........>",
    focusTimeLength,
    breakTimeLength,
    sessionRoundsLength
  );

  const FocusTimer: PomodoroTimer = {
    focusTimeLength: focusTimeLength,
    focusTimeNotificationMessage,
    isFocusTimerRunning: true,
    breakTimeLength: breakTimeLength,
    breakTimeNotificationMessage,
    isBreakTimerRunning: false,
    remainingSessionRounds: sessionRoundsLength,
    sessionEndNotificationMessage,
  };

  return (
    <>
      <IoMdArrowRoundBack onClick={() => goBack()} cursor={"pointer"} />
      <div className="flex flex-col items-center w-full gap-3 p-4">
        <Slider
          className="w-full max-w-md"
          color="primary"
          defaultValue={25}
          label="Focus time Length"
          maxValue={50}
          minValue={15}
          onChange={(value) => setFocusTimeLength(value as number)}
          showSteps={true}
          size="lg"
          step={5}
        />

        <Slider
          className="w-full max-w-md"
          color="primary"
          defaultValue={10}
          label="Break time Length"
          maxValue={20}
          minValue={5}
          onChange={(value) => setBreakTimeLength(value as number)}
          showSteps={true}
          size="lg"
          step={5}
        />

        <Slider
          className="w-full max-w-md"
          color="primary"
          defaultValue={2}
          label="Session Rounds"
          maxValue={4}
          minValue={1}
          onChange={(value) => setSessionRoundsLength(value as number)}
          showSteps={true}
          size="lg"
          step={1}
        />

        <button
          className="button"
          onClick={() => {
            setPomodoroTimer(FocusTimer, true);
            goBack();
          }}
        >
          Start Pomodoro Timer
        </button>
      </div>
    </>
  );
};
