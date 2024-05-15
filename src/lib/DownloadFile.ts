export function downloadFile(url: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onprogress = function(event: ProgressEvent) {
      if (event.lengthComputable && onProgress) {
        const progress = event.loaded / event.total;
        onProgress(progress);
      }
    };

    xhr.onload = function() {
      if (xhr.status === 200) {
        onProgress && onProgress(1);
        resolve(xhr.response);
      } else {
        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Request failed'));
    };

    xhr.send();
  });
}