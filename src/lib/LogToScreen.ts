export function createLogElement() {
  const logElement = document.createElement('div');
  Object.assign(logElement.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '8px',
    fontSize: '12px',
    zIndex: '1000',
    lineHeight: '20px'
  });

  return logElement;
}

export function logToScreen(logElement: HTMLElement, log: string) {
  logElement.innerHTML = `<pre>${log}</pre>`;
}