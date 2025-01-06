export function createLogElement() {
  const logElement = document.createElement('pre');
  Object.assign(logElement.style, {
    position:        'absolute',
    top:             '0',
    left:            '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color:           'white',
    padding:         '8px',
    fontSize:        '12px',
    zIndex:          '1000',
    lineHeight:      '20px',
    margin:          0,
    maxWidth:        'calc(100% - 16px)',
  });
  return logElement;
}

export function logToScreen(logElement: HTMLElement, log: string) {
  logElement.textContent = `${log}`;
}