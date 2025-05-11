document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  const modal = document.getElementById("tartilModal");
  const pageSelector = document.getElementById("pageSelector");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const currentImage = document.getElementById("currentImage");
  const tartilCards = document.getElementById("tartilCards");
  const fullscreenToggle = document.getElementById("fullscreenToggle");

  let currentPage = 0; // Start with the cover page
  let currentTartil = 1;

  // Removed the loop for dynamically generating Tartil cards
  // The cards are now statically defined in the HTML file

  // Modal event listener
  modal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    currentTartil = button.closest(".card").getAttribute("data-tartil");
    document.getElementById("tartilNum").textContent = currentTartil;

    // Reset to the cover page when modal is opened
    currentPage = 0; // 0 represents the cover page
    pageSelector.value = currentPage;
    updateImage();
  });

  // Populate page selector
  pageSelector.innerHTML = ""; // Clear existing options
  const coverOption = document.createElement("option");
  coverOption.value = 0;
  coverOption.textContent = "Cover";
  pageSelector.appendChild(coverOption);

  for (let i = 1; i <= 36; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Halaman ${i}`;
    pageSelector.appendChild(option);
  }

  // Function to update the displayed image with loading effect
  const updateImage = () => {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    loadingOverlay.innerHTML =
      '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>';
    currentImage.parentElement.appendChild(loadingOverlay);

    currentImage.classList.add("hidden");
    setTimeout(() => {
      const pagePath = currentPage === 0 ? "cover" : currentPage;
      currentImage.src = `img/tartil${currentTartil}/${pagePath}.png`;
      currentImage.alt = `Halaman ${
        currentPage === 0 ? "Cover" : currentPage
      } dari Tartil ${currentTartil}`;
      currentImage.onload = () => {
        currentImage.classList.remove("hidden");
        loadingOverlay.remove();
      };
    }, 500);
  };

  // Event listeners for navigation
  prevPageButton.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      pageSelector.value = currentPage;
      updateImage();
    }
  });

  nextPageButton.addEventListener("click", () => {
    if (currentPage < 36) {
      currentPage++;
      pageSelector.value = currentPage;
      updateImage();
    }
  });

  pageSelector.addEventListener("change", (event) => {
    currentPage = parseInt(event.target.value, 10);
    updateImage();
  });

  fullscreenToggle.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      currentImage.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable fullscreen mode: ${err.message}`
        );
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(
          `Error attempting to exit fullscreen mode: ${err.message}`
        );
      });
    }
  });
});

// Dynamic copyright year
const startYear = 2025; // Tahun dibuat
const currentYear = new Date().getFullYear();
const yearText =
  startYear === currentYear ? `${startYear}` : `${startYear} - ${currentYear}`;
document.getElementById("dynamicYear").textContent = yearText;

// Hide loading overlay after page load with fade-out effect
window.addEventListener("load", () => {
  const loadingOverlay = document.getElementById("loadingOverlay");
  setTimeout(() => {
    document.body.classList.remove("overflow-hidden"); // Remove overflow hidden
    loadingOverlay.classList.add("hidden"); // Add hidden class
    // to trigger fade-out
    setTimeout(() => {
      loadingOverlay.style.display = "none"; // Ensure it's
      // removed after fade-out
    }, 500); // Match the CSS transition duration
  }, 500); // Delay before starting fade-out
});
