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
