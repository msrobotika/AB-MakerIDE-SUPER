// Native browser confirm is unavailable in some embedded browsers.
// Closing, Escape or a concurrent request always means no authorization.
export async function confirmAction(message) {
  const dialog = document.querySelector('#actionConfirm');
  if (!dialog || dialog.open || typeof dialog.showModal !== 'function') return false;
  document.querySelector('#actionConfirmText').textContent = String(message);
  dialog.returnValue = '';
  return new Promise((resolve) => {
    const closed = () => resolve(dialog.returnValue === 'confirm');
    dialog.addEventListener('close', closed, { once: true });
    try {
      dialog.showModal();
    } catch (_error) {
      dialog.removeEventListener('close', closed);
      resolve(false);
    }
  });
}
