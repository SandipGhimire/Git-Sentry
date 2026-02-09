/**
 * Spinner frames for loading
 */
const spinnerFrames = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
/**
 * Spinner index
 */
let spinnerIndex = 0;
/**
 * Spinner interval
 */
let spinnerInterval: NodeJS.Timeout | undefined;

/**
 * Starts the spinner
 * @param {string} text - The text to display with the spinner
 */
const startSpinner = (text = "Executing commands…") => {
  stopSpinner();
  spinnerInterval = setInterval(() => {
    const frame = spinnerFrames[spinnerIndex % spinnerFrames.length];
    spinnerIndex++;
    process.stdout.write(`\r\x1b[2K${frame} ${text}`);
  }, 100);
};

/**
 * Stops the running spinner
 */
const stopSpinner = () => {
  if (spinnerInterval != null) {
    clearInterval(spinnerInterval);
    spinnerInterval = undefined;
  }
  process.stdout.write("\r\x1b[2K");
};

export { startSpinner, stopSpinner };
