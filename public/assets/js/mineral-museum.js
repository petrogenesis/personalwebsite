document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("mineral-grid");
  const categoryList = document.getElementById("category-list");
  const searchInput = document.getElementById("search");

  // Modal elements
  const modal = document.getElementById("mineral-modal");
  const modalImage = document.getElementById("modal-image");
  const modalName = document.getElementById("modal-name");
  const modalLocality = document.getElementById("modal-locality");
  const modalDimensions = document.getElementById("modal-dimensions");
  const modalSize = document.getElementById("modal-size");
  const modalWeight = document.getElementById("modal-weight");
  const modalPrice = document.getElementById("modal-price");
  const modalSystem = document.getElementById("modal-system");
  const modalDescription = document.getElementById("modal-description");
  const gallery = document.getElementById("modal-gallery");
  const closeBtn = document.querySelector(".close");

  // Track current gallery images for keyboard navigation
  let currentGalleryImages = [];
  let currentImageIndex = 0;

  // Open modal for a given card
  function openMineralModal(card) {
    modalImage.src = card.dataset.image;
    modalImage.alt = card.dataset.name;
    modalName.textContent = card.dataset.name;
    modalLocality.textContent = card.dataset.locality;
    modalDimensions.textContent = card.dataset.dimensions || "N/A";
    modalSize.textContent = card.dataset.size || "N/A";
    modalWeight.textContent = card.dataset.weight;
    modalPrice.textContent = card.dataset.price;
    modalSystem.textContent = card.dataset.system;
    modalDescription.textContent = card.dataset.description;

    // Build gallery
    gallery.innerHTML = "";
    currentGalleryImages = [card.dataset.image];
    if (card.dataset.images) {
      const extraImages = card.dataset.images.split(",").map(img => img.trim());
      currentGalleryImages.push(...extraImages);
    }
    currentImageIndex = 0;

    currentGalleryImages.forEach((src, index) => {
      const thumb = document.createElement("img");
      thumb.src = src;
      thumb.alt = card.dataset.name;

      thumb.addEventListener("click", () => {
        currentImageIndex = index;
        modalImage.src = src;
      });

      gallery.appendChild(thumb);
    });

    modal.classList.remove("hidden");
  }

  // Close modal
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => { if(e.target === modal) modal.classList.add("hidden"); });

  // Keyboard navigation: ESC + arrow keys
  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains("hidden")) return;

    switch (e.key) {
      case "Escape":
        modal.classList.add("hidden");
        break;
      case "ArrowLeft":
        if (currentGalleryImages.length > 1) {
          currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
          modalImage.src = currentGalleryImages[currentImageIndex];
        }
        break;
      case "ArrowRight":
        if (currentGalleryImages.length > 1) {
          currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
          modalImage.src = currentGalleryImages[currentImageIndex];
        }
        break;
    }
  });

  // Fetch minerals from JSON
  let minerals = [];
  try {
    const response = await fetch("minerals.json");
    minerals = await response.json();

    // Track categories and subcategories
    const categoryMap = {};
    minerals.forEach(mineral => {
      if (!categoryMap[mineral.category]) categoryMap[mineral.category] = new Set();
      if (mineral.subcategory) categoryMap[mineral.category].add(mineral.subcategory);
    });

    // Create mineral cards
    minerals.forEach(mineral => {
      const card = document.createElement("div");
      card.classList.add("mineral-card");

      // Set data attributes
      card.dataset.name = mineral.name;
      card.dataset.locality = mineral.locality;
      card.dataset.dimensions = mineral.dimensions || "";
      card.dataset.size = mineral.size || "";
      card.dataset.weight = mineral.weight;
      card.dataset.price = mineral.price;
      card.dataset.system = mineral.system;
      card.dataset.image = mineral.image;
      card.dataset.images = mineral.images.join(",");
      card.dataset.description = mineral.description;
      card.dataset.category = mineral.category;
      card.dataset.subcategory = mineral.subcategory || "";

      card.innerHTML = `
        <img src="${mineral.image}" alt="${mineral.name}">
        <h3>${mineral.name}</h3>
        <p>${mineral.locality}</p>
      `;

      card.addEventListener("click", () => openMineralModal(card));
      grid.appendChild(card);
    });

    // Populate category sidebar with subcategories
    const allItem = document.createElement("li");
    allItem.textContent = "All";
    allItem.classList.add("active");
    allItem.style.cursor = "pointer";
    allItem.addEventListener("click", () => filterCards("All", null, searchInput.value));
    categoryList.appendChild(allItem);

    for (const [cat, subcats] of Object.entries(categoryMap)) {
      const li = document.createElement("li");
      li.textContent = cat;
      li.style.cursor = "pointer";

      // Main category click
      li.addEventListener("click", () => {
        filterCards(cat, null, searchInput.value);
        highlightActive(li);
      });

      // Subcategories
      if (subcats.size > 0) {
        const ul = document.createElement("ul");
        ul.style.paddingLeft = "12px";
        subcats.forEach(sub => {
          const subLi = document.createElement("li");
          subLi.textContent = sub;
          subLi.style.cursor = "pointer";
          subLi.addEventListener("click", e => {
            e.stopPropagation();
            filterCards(cat, sub, searchInput.value);
            highlightActive(subLi);
          });
          ul.appendChild(subLi);
        });
        li.appendChild(ul);
      }

      categoryList.appendChild(li);
    }

    function highlightActive(element) {
      categoryList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
      element.classList.add("active");
    }

  } catch(err) {
    console.error("Failed to load minerals.json", err);
  }

  // Filter function
  function filterCards(category, subcategory = null, searchText = "") {
    const cards = document.querySelectorAll(".mineral-card");
    cards.forEach(card => {
      const matchesCategory = category === "All" || card.dataset.category === category;
      const matchesSub = !subcategory || card.dataset.subcategory === subcategory;
      const matchesSearch = card.dataset.name.toLowerCase().includes(searchText.toLowerCase());
      card.style.display = matchesCategory && matchesSub && matchesSearch ? "flex" : "none";
    });
  }

  // Search input event
  searchInput.addEventListener("input", () => {
    const activeCategory = categoryList.querySelector("li.active").textContent;
    filterCards(activeCategory, null, searchInput.value);
  });

});