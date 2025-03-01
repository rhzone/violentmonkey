import { makePause } from '@/common';
import { addPublicCommands } from '@/background/utils';

let chain = Promise.resolve();

addPublicCommands({
  DownloadBlob(args) {
    downloadBlob(...args);
  },
});

/**
 * @param {Blob|string} what
 * @param {string} name
 * @param {boolean} force
 * @param {string|null} [subpath]
 */
export function downloadBlob(what, name, force, subpath) {
  // Frequent downloads are ignored in Chrome and possibly other browsers
  if (!force) {
    chain = chain.then(() => (downloadBlob(what, name, true, subpath), makePause(150)));
    return;
  }

  if (typeof browser !== 'undefined' && browser.downloads && browser.downloads.download) {
    // Use the browser.downloads API
    const url = isObject(what) ? URL.createObjectURL(what) : what;
    
    // Create the download options
    const options = {
      url,
      filename: subpath ? `${subpath}/${name}` : name,
      saveAs: false,
    };
    
    // Start the download
    browser.downloads.download(options).catch(err => {
      console.error('Download API error:', err);
      // Fall back to the old method if there's an error
      fallbackDownload(what, name);
    });
    
    // Clean up the blob URL if we created one
    if (isObject(what)) makePause(3000).then(() => URL.revokeObjectURL(url));
  } else {
    // Fall back to the old method if browser.downloads is not available
    fallbackDownload(what, name);
  }
}

/**
 * Fallback download method using a link click
 * @param {Blob|string} what
 * @param {string} name
 */
function fallbackDownload(what, name) {
  const url = isObject(what) ? URL.createObjectURL(what) : what;
  const a = document.createElement('a');
  a.href = url;
  a.download = name || '';
  a.click();
  if (isObject(what)) makePause(3000).then(() => URL.revokeObjectURL(url));
}
