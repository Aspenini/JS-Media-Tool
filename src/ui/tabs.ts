import { showNotification } from './notification.js';

export function openTab(tabId: string): void {
  try {
    const allTabs = document.querySelectorAll<HTMLElement>('.tabcontent');
    allTabs.forEach((tab) => {
      if (tab.id !== tabId) {
        tab.style.display = 'none';
        tab.classList.remove('active');
      }
    });

    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach((btn) => btn.classList.remove('active'));

    const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetButton) {
      targetButton.classList.add('active');
    }

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.style.display = 'block';
      selectedTab.classList.add('active');
    } else {
      console.error(`Tab with id "${tabId}" not found`);
      showNotification('Tab not found', 'error');
    }
  } catch (error) {
    console.error('Error switching tabs:', error);
    showNotification('Error switching tabs', 'error');
  }
}

export function selectMobileTab(tabId: string): void {
  openTab(tabId);
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) mobileMenu.style.display = 'none';
  const button = document.querySelector(`[data-tab="${tabId}"]`);
  if (button) {
    document.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
  }
}

export function initTabs(): void {
  document.querySelectorAll<HTMLElement>('#tabs .tab-button[data-tab]').forEach((btn) => {
    const tabId = btn.dataset.tab;
    if (tabId) {
      btn.addEventListener('click', () => openTab(tabId));
    }
  });

  document.querySelectorAll<HTMLElement>('.mobile-menu-item[data-tab]').forEach((btn) => {
    const tabId = btn.dataset.tab;
    if (tabId) {
      btn.addEventListener('click', () => selectMobileTab(tabId));
    }
  });

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.style.display =
        mobileMenu.style.display === 'none' || mobileMenu.style.display === '' ? 'block' : 'none';
    });
  }
}
