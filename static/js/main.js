// Initialize Lucide icons
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Initialize page-specific functionality
  const currentPath = window.location.pathname;

  if (currentPath === "/") {
    initializeHomePage();
  } else if (currentPath === "/devices") {
    initializeDevicesPage();
  } else if (currentPath === "/results") {
    initializeResultsPage();
  }
});


// Home page functionality
function initializeHomePage() {
  const queryInput = document.getElementById("queryInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const predefinedQueries = document.querySelectorAll(".predefined-query");

  if (queryInput && analyzeBtn) {
    // Initial button state
    analyzeBtn.disabled = !queryInput.value.trim();

    // Update UI based on input value
    const updateInputUI = () => {
      const hasText = queryInput.value.trim().length > 0;
      analyzeBtn.disabled = !hasText;

      if (hasText) {
        queryInput.classList.add("glow-border");
      } else {
        queryInput.classList.remove("glow-border");
      }
    };

    // Enable glow + enable button when typing
    queryInput.addEventListener("input", updateInputUI);
    updateInputUI(); // On load

    // Predefined query click → populate and activate button
    predefinedQueries.forEach((btn) => {
      btn.addEventListener("click", function () {
        const query = this.getAttribute("data-query");
        queryInput.value = query;
        queryInput.focus();
        updateInputUI();
      });
    });
  }
}


// Devices page functionality
function initializeDevicesPage() {
  const deviceSearch = document.getElementById("deviceSearch");
  const statusFilter = document.getElementById("statusFilter");
  const deviceGrid = document.getElementById("deviceGrid");
  const deviceCount = document.getElementById("deviceCount");
  const noDevicesMessage = document.getElementById("noDevicesMessage");
  const deviceCards = document.querySelectorAll(".device-card");

  // Device filtering
  function filterDevices() {
    const searchTerm = deviceSearch.value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let visibleCount = 0;

    deviceCards.forEach((card) => {
      const deviceName = card.getAttribute("data-device-name").toLowerCase();
      const deviceType = card.getAttribute("data-device-type").toLowerCase();
      const deviceDomain = card
        .getAttribute("data-device-domain")
        .toLowerCase();
      const deviceStatus = card.getAttribute("data-device-status");

      const matchesSearch =
        deviceName.includes(searchTerm) ||
        deviceType.includes(searchTerm) ||
        deviceDomain.includes(searchTerm);
      const matchesStatus =
        statusFilter === "all" || deviceStatus === statusFilter;

      if (matchesSearch && matchesStatus) {
        card.style.display = "block";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    // Update count and show/hide no results message
    deviceCount.textContent = `Showing ${visibleCount} devices`;

    if (visibleCount === 0) {
      noDevicesMessage.classList.remove("hidden");
      deviceGrid.style.display = "none";
    } else {
      noDevicesMessage.classList.add("hidden");
      deviceGrid.style.display = "grid";
    }
  }

  // Add event listeners for filtering
  if (deviceSearch) {
    deviceSearch.addEventListener("input", filterDevices);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterDevices);
  }

  // Handle device card clicks
  deviceCards.forEach((card) => {
    card.addEventListener("click", function () {
      const deviceId = this.getAttribute("data-device-id");
      const deviceName = this.getAttribute("data-device-name");
      const query = window.currentQuery || "";

      // Navigate to results page
      window.location.href = `/results?query=${encodeURIComponent(query)}&deviceId=${deviceId}&deviceName=${encodeURIComponent(deviceName)}`;
    });
  });
}

// Results page functionality
function initializeResultsPage() {
  // Add any results page specific functionality here
  // For example, table sorting, additional filtering, etc.

  // Add loading states for better UX
  const exportBtn = document.querySelector('a[href*="/export"]');
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      // Show loading state
      const originalText = this.innerHTML;
      this.innerHTML =
        '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Exporting...';

      // Reset after a delay (the download should start)
      setTimeout(() => {
        this.innerHTML = originalText;
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      }, 2000);
    });
  }
}

// Utility functions
function showLoading(element) {
  if (element) {
    element.innerHTML =
      '<div class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>';
  }
}

function hideLoading(element, originalContent) {
  if (element) {
    element.innerHTML = originalContent;
  }
}

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add keyboard navigation support
document.addEventListener("keydown", function (e) {
  // ESC key to go back
  if (e.key === "Escape") {
    const backButton = document.querySelector(
      'a[href="javascript:history.back()"], a[href="/"]',
    );
    if (backButton) {
      backButton.click();
    }
  }

  // Enter key on predefined queries
  if (e.key === "Enter" && e.target.classList.contains("predefined-query")) {
    e.target.click();
  }
});

// Add form validation
function validateForm(form) {
  const requiredFields = form.querySelectorAll("[required]");
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("border-red-500");
    } else {
      field.classList.remove("border-red-500");
    }
  });

  return isValid;
}

// Enhanced error handling
window.addEventListener("error", function (e) {
  console.error("Application error:", e.error);
  // You could add user-friendly error notifications here
});

// Service worker registration for better performance (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/static/js/sw.js")
      .then(function (registration) {
        console.log("ServiceWorker registration successful");
      })
      .catch(function (err) {
        console.log("ServiceWorker registration failed");
      });
  });
}