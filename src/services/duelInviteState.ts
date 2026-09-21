// Set just before a duel invite pulls the player out of a screen that normally
// asks "are you sure you want to leave?" (the weekly tournament run), so that
// confirmation doesn't pop up on top of the match they just accepted.
let leavingForDuel = false;

export const setLeavingForDuel = (value: boolean) => { leavingForDuel = value; };
export const isLeavingForDuel = () => leavingForDuel;
