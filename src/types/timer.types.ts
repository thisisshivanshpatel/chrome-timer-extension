export enum TimerActions {
  SET_TIMER = "setTimer",
  REMOVE_TIMER = "removeTimer",
  PLAY_TIMER = "playTimer",
  PAUSE_TIMER = "pauseTimer",
}

export type Timer = {
  id: number;
  timeLeft: number;
  interval: number | undefined;
  isRunning: boolean;
  lastUpdatedAt: number;
};
