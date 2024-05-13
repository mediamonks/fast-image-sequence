export function createLogElement() {
  const logElement = document.createElement('div');
  logElement.style.position = 'absolute';
  logElement.style.top = '0';
  logElement.style.left = '0';
  logElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  logElement.style.color = 'white';
  logElement.style.padding = '8px';
  logElement.style.fontSize = '12px';
  logElement.style.zIndex = '1000';
  logElement.style.lineHeight = '20px';

  return logElement;
}

export function logToScreen(logElement: HTMLElement, log: string) {
  logElement.innerHTML = `<pre>${log}</pre>`;
}