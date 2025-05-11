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
  "Great work! Time for a well-deserved break 🌟",
  "Focus session complete! Take a moment to recharge 🎯",
  "You've crushed that focus session! Break time 🚀",
  "Excellent focus! Time to refresh your mind 🧠",
  "Mission accomplished! Enjoy your break 🎉",
];

const breakTimeNotificationMessage = [
  "Break's over! Ready to achieve more? 💪",
  "Time to get back in the zone! 🎯",
  "Recharged and ready? Let's continue! 🔋",
  "Break complete! Your next win awaits 🌟",
  "Back to making progress! You've got this 🚀",
];

const sessionEndNotificationMessage = [
  "Amazing job! You've completed all your sessions 🏆",
  "Congratulations on maintaining your focus streak! 🌟",
  "You've achieved your goal for today! Time to celebrate 🎉",
  "Fantastic work! Your dedication is inspiring ⭐",
  "Mission accomplished! You're crushing it 💪",
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
