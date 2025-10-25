import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

interface AccessibilityOptions {
  announcePageChanges?: boolean;
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    announcePageChanges = true,
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
  } = options;

  const { theme } = useAppStore();

  // Announce page changes to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Focus management utilities
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip navigation if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      // Global keyboard shortcuts
      switch (e.key) {
        case '/':
          e.preventDefault();
          focusElement('[data-search-input]');
          break;
        case 'Escape':
          // Close modals, dropdowns, etc.
          const activeModal = document.querySelector('[data-modal][aria-hidden="false"]');
          if (activeModal) {
            const closeButton = activeModal.querySelector('[data-close-modal]') as HTMLElement;
            closeButton?.click();
          }
          break;
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            // Show keyboard shortcuts help
            announceToScreenReader('Keyboard shortcuts: Press / to search, Escape to close modals, Arrow keys to navigate lists');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, focusElement, announceToScreenReader]);

  // High contrast mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
        announceToScreenReader('High contrast mode enabled');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    };

    // Initial check
    if (mediaQuery.matches) {
      document.documentElement.classList.add('high-contrast');
    }

    mediaQuery.addEventListener('change', handleContrastChange);
    return () => mediaQuery.removeEventListener('change', handleContrastChange);
  }, [announceToScreenReader]);

  // Reduced motion detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    // Initial check
    if (mediaQuery.matches) {
      document.documentElement.classList.add('reduce-motion');
    }

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  return {
    announceToScreenReader,
    focusElement,
    trapFocus,
  };
};

// Hook for managing skip links
export const useSkipLinks = () => {
  useEffect(() => {
    const skipLinks = document.querySelectorAll('[data-skip-link]');
    
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        if (target) {
          const targetElement = document.querySelector(target) as HTMLElement;
          if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }, []);
};

// Hook for managing ARIA live regions
export const useLiveRegion = () => {
  const announceToLiveRegion = useCallback((message: string, regionId: string = 'live-region') => {
    let liveRegion = document.getElementById(regionId);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = regionId;
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, []);

  return { announceToLiveRegion };
};