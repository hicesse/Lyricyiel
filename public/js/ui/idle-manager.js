/**
 * Module (UI Controls): Auto-hide Idle State UI Controls & Motion Sensor
 */
function initIdleStateEngine(getIsPlaying, containerElem = null, timeoutMs = 3000) {
  let idleTimer = null;

  function resetIdleTimer() {
    const container = typeof containerElem === "string" 
      ? document.getElementById(containerElem) 
      : (containerElem || document.getElementById("visualizer-container"));

    if (container) {
      container.classList.remove("idle-active");
    }

    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    const isPlaying = typeof getIsPlaying === "function" ? getIsPlaying() : Boolean(getIsPlaying);

    if (isPlaying) {
      idleTimer = setTimeout(() => {
        const stillPlaying = typeof getIsPlaying === "function" ? getIsPlaying() : Boolean(getIsPlaying);
        if (stillPlaying && container) {
          container.classList.add("idle-active");
        }
      }, timeoutMs);
    }
  }

  const userEvents = ["mousemove", "mousedown", "touchstart", "touchmove", "pointermove", "keydown"];
  userEvents.forEach((evt) => {
    window.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  return { resetIdleTimer };
}

window.initIdleStateEngine = initIdleStateEngine;
