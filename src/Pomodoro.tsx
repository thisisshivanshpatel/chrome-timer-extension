import { useState } from "react";

import { Slider } from "@heroui/react";
import { IoMdArrowRoundBack } from "react-icons/io";

export const Pomodoro = ({ goBack }: { goBack: () => void }) => {
  const [focusTimeLength, setFocusTimeLength] = useState(25);
  const [breakTimeLength, setBreakTimeLength] = useState(5);
  const [sessionRoundsLength, setSessionRoundsLength] = useState(1);

  console.log(
    "hi.........>",
    focusTimeLength,
    breakTimeLength,
    sessionRoundsLength
  );

  return (
    <>
      <IoMdArrowRoundBack onClick={() => goBack()} cursor={"pointer"} />
      <div className="flex flex-col items-center w-full p-4 gap-3">
        <Slider
          className="max-w-md w-full"
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
          className="max-w-md w-full"
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
          className="max-w-md w-full"
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

        <button className="button">Start Pomodoro Timer</button>
      </div>
    </>
  );
};
