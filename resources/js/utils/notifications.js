/**
 * Modern notification system with color-coded action types
 * Positioned at the top center of the screen
 * Enhanced with: 
 * - Support for icons (using simple Unicode or optional SVG)
 * - Progress bar for auto-dismiss
 * - Pause on hover
 * - Stack limit (max 5 toasts)
 * - Accessibility improvements (ARIA roles)
 * - Dismiss all functionality
 */
const notifications = {
  container: null,
  maxToasts: 5,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'custom-toast-container';
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
      
      // Add styles (using CSS variables for theming)
      if (!document.getElementById('custom-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-toast-styles';
        style.textContent = `
          :root {
            --toast-success: #10b981;
            --toast-warning: #f59e0b;
            --toast-error: #ef4444;
            --toast-info: #3b82f6;
            --toast-bg: rgba(0, 0, 0, 0.1);
            --toast-shadow: 0 4px 16px rgba(0,0,0,0.2);
            --toast-radius: 12px;
            --toast-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          @media (prefers-color-scheme: dark) {
            :root {
              --toast-bg: rgba(255, 255, 255, 0.1);
              --toast-shadow: 0 4px 16px rgba(0,0,0,0.4);
            }
          }
          
          .custom-toast-container {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
            pointer-events: none;
          }
          
          .custom-toast {
            min-width: 320px;
            max-width: 480px;
            padding: 16px 20px;
            border-radius: var(--toast-radius);
            color: white;
            font-size: 16px;
            box-shadow: var(--toast-shadow);
            animation: toast-in 0.4s ease forwards;
            display: flex;
            align-items: center;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            pointer-events: auto;
            backdrop-filter: blur(10px);
            background-color: var(--toast-bg);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .custom-toast-icon {
            margin-right: 12px;
            font-size: 20px;
          }
          
          .custom-toast-content {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          
          .custom-toast-message {
            font-weight: 500;
          }
          
          .custom-toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.3);
            width: 100%;
            transform-origin: left;
            animation: progress-linear 0s linear forwards;
          }
          
          .custom-toast-add {
            background-color: var(--toast-success);
          }
          
          .custom-toast-edit {
            background-color: var(--toast-warning);
            color: #333;
          }
          
          .custom-toast-delete {
            background-color: var(--toast-error);
          }
          
          .custom-toast-info {
            background-color: var(--toast-info);
          }
          
          .custom-toast-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 24px;
            font-weight: bold;
            opacity: 0.7;
            padding: 0 8px;
            margin-left: 12px;
            transition: opacity 0.2s;
          }
          
          .custom-toast-close:hover {
            opacity: 1;
          }
          
          .custom-toast:hover .custom-toast-progress {
            animation-play-state: paused;
          }
          
          @keyframes toast-in {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          @keyframes toast-out {
            from { transform: translateY(0) scale(1); opacity: 1; }
            to { transform: translateY(-20px) scale(0.95); opacity: 0; }
          }
          
          @keyframes progress-linear {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  },
  
  enforceStackLimit() {
    const toasts = this.container.querySelectorAll('.custom-toast');
    if (toasts.length > this.maxToasts) {
      const excess = toasts.length - this.maxToasts;
      for (let i = 0; i < excess; i++) {
        this.removeToast(toasts[i]);
      }
    }
  },
  
  removeToast(toast, duration = 300) {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentElement) {
        this.container.removeChild(toast);
      }
    }, duration);
  },
  
  create(message, type = 'info', duration = 3000, icon = null) {
    this.init();
    this.enforceStackLimit();
    
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    // Icon
    if (!icon) {
      switch (type) {
        case 'add': icon = '✓'; break;
        case 'edit': icon = '✎'; break;
        case 'delete': icon = '✖'; break;
        case 'info': icon = 'ℹ'; break;
        default: icon = 'ℹ';
      }
    }
    const iconEl = document.createElement('span');
    iconEl.className = 'custom-toast-icon';
    iconEl.textContent = icon;
    toast.appendChild(iconEl);
    
    // Content
    const content = document.createElement('div');
    content.className = 'custom-toast-content';
    
    const text = document.createElement('span');
    text.className = 'custom-toast-message';
    text.textContent = message;
    content.appendChild(text);
    
    toast.appendChild(content);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'custom-toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => this.removeToast(toast));
    toast.appendChild(closeBtn);
    
    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'custom-toast-progress';
    progress.style.animationDuration = `${duration}ms`;
    toast.appendChild(progress);
    
    // Hover pause logic
    let timeoutId;
    let startTime = Date.now();
    const startProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      progress.style.animation = 'none';
      setTimeout(() => {
        progress.style.animation = `progress-linear ${remaining}ms linear forwards`;
      }, 10);
    };
    
    toast.addEventListener('mouseenter', () => {
      progress.style.animationPlayState = 'paused';
      if (timeoutId) clearTimeout(timeoutId);
    });
    
    toast.addEventListener('mouseleave', () => {
      startTime = Date.now();
      startProgress();
      timeoutId = setTimeout(() => this.removeToast(toast), Math.max(0, duration - (Date.now() - startTime)));
    });
    
    this.container.appendChild(toast);
    
    // Auto dismiss
    timeoutId = setTimeout(() => this.removeToast(toast), duration);
    
    return toast; // Return for manual control if needed
  },
  
  // Action-specific notification methods
  add(message, duration = 3000) {
    return this.create(message, 'add', duration, '✓');
  },
  
  edit(message, duration = 3000) {
    return this.create(message, 'edit', duration, '✎');
  },
  
  delete(message, duration = 3000) {
    return this.create(message, 'delete', duration, '✖');
  },
  
  info(message, duration = 3000) {
    return this.create(message, 'info', duration, 'ℹ');
  },
  
  // Utility: Dismiss all
  clearAll() {
    const toasts = this.container.querySelectorAll('.custom-toast');
    toasts.forEach(toast => this.removeToast(toast));
  }
};

export default notifications;