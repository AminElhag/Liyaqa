// Liyaqa Admin Portal - JavaScript

// Language switching
function setLanguage(lang) {
  const html = document.documentElement;

  if (lang === 'ar') {
    html.lang = 'ar';
    html.dir = 'rtl';
  } else {
    html.lang = 'en';
    html.dir = 'ltr';
  }

  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`.lang-btn[onclick="setLanguage('${lang}')"]`)?.classList.add('active');

  // Update text content
  document.querySelectorAll('[data-en][data-ar]').forEach(el => {
    const text = lang === 'ar' ? el.dataset.ar : el.dataset.en;
    if (text) {
      el.textContent = text;
    }
  });

  // Store preference
  localStorage.setItem('liyaqa-lang', lang);
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('liyaqa-lang') || 'en';
  setLanguage(savedLang);
});

// Dropdown toggle
function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// Modal functions
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Close modal when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.style.display = 'none';
    document.body.style.overflow = '';
  }
});

// Tab switching
function switchTab(tabId, groupId) {
  // Remove active from all tabs in group
  document.querySelectorAll(`[data-tab-group="${groupId}"]`).forEach(tab => {
    tab.classList.remove('active');
  });

  // Add active to clicked tab
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

  // Hide all tab panels in group
  document.querySelectorAll(`[data-panel-group="${groupId}"]`).forEach(panel => {
    panel.classList.add('hidden');
  });

  // Show selected panel
  document.getElementById(tabId)?.classList.remove('hidden');
}

// Checkbox handling for bulk actions
let selectedItems = new Set();

function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checkbox.checked;
    if (checkbox.checked) {
      selectedItems.add(cb.value);
    } else {
      selectedItems.delete(cb.value);
    }
  });
  updateBulkActionBar();
}

function toggleSelectItem(checkbox) {
  if (checkbox.checked) {
    selectedItems.add(checkbox.value);
  } else {
    selectedItems.delete(checkbox.value);
  }

  // Update select all checkbox
  const allCheckboxes = document.querySelectorAll('.row-checkbox');
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.checked = selectedItems.size === allCheckboxes.length;
    selectAll.indeterminate = selectedItems.size > 0 && selectedItems.size < allCheckboxes.length;
  }

  updateBulkActionBar();
}

function updateBulkActionBar() {
  const bar = document.getElementById('bulkActionBar');
  const count = document.getElementById('selectedCount');

  if (bar && count) {
    if (selectedItems.size > 0) {
      bar.classList.remove('hidden');
      count.textContent = selectedItems.size;
    } else {
      bar.classList.add('hidden');
    }
  }
}

// Clear selection
function clearSelection() {
  selectedItems.clear();
  document.querySelectorAll('.row-checkbox, #selectAll').forEach(cb => {
    cb.checked = false;
    cb.indeterminate = false;
  });
  updateBulkActionBar();
}

// Format money
function formatMoney(amount, currency = 'SAR') {
  return new Intl.NumberFormat('en-SA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ' + currency;
}

// Format date
function formatDate(dateString, locale = 'en') {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Relative time
function relativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Style the toast
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '500',
    fontSize: '14px',
    zIndex: '9999',
    animation: 'slideIn 0.3s ease'
  });

  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#16a34a';
      break;
    case 'error':
      toast.style.backgroundColor = '#dc2626';
      break;
    case 'warning':
      toast.style.backgroundColor = '#d97706';
      break;
    default:
      toast.style.backgroundColor = '#0284c7';
  }

  document.body.appendChild(toast);

  // RTL support
  if (document.documentElement.dir === 'rtl') {
    toast.style.right = 'auto';
    toast.style.left = '20px';
  }

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  [dir="rtl"] @keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  [dir="rtl"] @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Form validation helper
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  let isValid = true;

  form.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('error');

      // Add error message if not exists
      if (!input.nextElementSibling?.classList.contains('form-error')) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = 'This field is required';
        input.parentNode.insertBefore(error, input.nextSibling);
      }
    } else {
      input.classList.remove('error');
      input.nextElementSibling?.classList.contains('form-error') && input.nextElementSibling.remove();
    }
  });

  return isValid;
}

// Status badge helper
function getStatusBadge(status) {
  const statusLower = status.toLowerCase().replace(' ', '_');
  return `<span class="badge badge-${statusLower}">${status}</span>`;
}

// Debounce helper for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Search handler
const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
  // In real app, this would call the API
}, 300);

// Export functions for global use
window.setLanguage = setLanguage;
window.toggleDropdown = toggleDropdown;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.toggleSelectAll = toggleSelectAll;
window.toggleSelectItem = toggleSelectItem;
window.clearSelection = clearSelection;
window.showToast = showToast;
window.validateForm = validateForm;
window.handleSearch = handleSearch;
