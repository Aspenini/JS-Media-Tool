import type { NotificationType } from './types.js';

export function showNotification(message: string, type: NotificationType = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification ${type} fade-in`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
