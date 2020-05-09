/* @flow
 */

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
}

export async function copyCanvasToClipboard(canvas) {
  canvas.toBlob((blob) => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not implemented');
      }
      navigator.clipboard.write([
        // this is defined in current chrome, but not firefox
        // eslint-disable-next-line no-undef
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Couldn't copy canvas to clipboard", e);
    }
  }, 'image/png');
}

async function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    return fallbackCopyTextToClipboard(text);
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default copyTextToClipboard;
