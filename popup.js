let intervalId;

function startTimer() {
  intervalId = setInterval(() => {
    let i = 0;
    ++i;
    console.log(i);

    document.getElementById("time").innerText = i;
  }, 1000);
}

function stopTimer() {
  clearInterval(intervalId);
}
