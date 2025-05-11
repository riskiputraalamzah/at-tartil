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

  // Generate Tartil cards dynamically
  for (let i = 1; i <= 6; i++) {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4";
    const card = document.createElement("div");
    card.className = "card card-glass text-center ";
    card.setAttribute("data-tartil", i);
    card.setAttribute("data-bs-toggle", "modal");
    card.setAttribute("data-bs-target", "#tartilModal");
    card.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = `img/tartil${i}/cover.png`;
    img.className = "img-fluid";
    img.alt = `Cover Tartil ${i}`;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "cover";

    // const title = document.createElement("h5");
    // title.className = "card-title";
    // title.textContent = `At-Tartil ${i}`;

    // const button = document.createElement("button");
    // button.className = "btn btn-success mt-3";
    // button.setAttribute("data-bs-toggle", "modal");
    // button.setAttribute("data-bs-target", "#tartilModal");
    // button.textContent = "Lihat Halaman";

    // card.appendChild(title);
    card.appendChild(img);
    // card.appendChild(button);
    col.appendChild(card);
    tartilCards.appendChild(col);
  }

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

  // Function to update the displayed image
  const updateImage = () => {
    currentImage.classList.add("hidden");
    setTimeout(() => {
      const pagePath = currentPage === 0 ? "cover" : currentPage;
      currentImage.src = `img/tartil${currentTartil}/${pagePath}.png`;
      currentImage.alt = `Halaman ${
        currentPage === 0 ? "Cover" : currentPage
      } dari Tartil ${currentTartil}`;
      currentImage.classList.remove("hidden");
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
