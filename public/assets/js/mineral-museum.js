document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("mineral-grid");
  const categoryList = document.getElementById("category-list");
  const searchInput = document.getElementById("search");

  // Filter inputs
  const filterLocality = document.getElementById("filter-locality");
  const filterSize = document.getElementById("filter-size");
  const filterWeightMin = document.getElementById("filter-weight-min");
  const filterWeightMax = document.getElementById("filter-weight-max");
  const filterPriceMin = document.getElementById("filter-price-min");
  const filterPriceMax = document.getElementById("filter-price-max");
  const filterSystem = document.getElementById("filter-system");
  const filterReset = document.getElementById("filter-reset");

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
  const modalSelfCollected = document.getElementById("modal-self-collected");
  const modalDescription = document.getElementById("modal-description");
  const gallery = document.getElementById("modal-gallery");
  const closeBtn = document.querySelector(".close");

  let currentGalleryImages = [];
  let currentImageIndex = 0;

  const sizeOrder = ["Micromount", "Thumbnail", "Miniature", "Small Cabinet", "Cabinet"];

  // Track active category/subcategory
  let activeCategory = "All";
  let activeSubcategory = null;

  // Open modal
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
    modalSelfCollected.textContent = card.dataset.selfCollected;
    modalDescription.textContent = card.dataset.description;

    gallery.innerHTML = "";
    currentGalleryImages = [card.dataset.image];
    if (card.dataset.images) {
      currentGalleryImages.push(...card.dataset.images.split(",").map(img => img.trim()));
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

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

  document.addEventListener("keydown", (e) => {
    if (modal.classList.contains("hidden")) return;
    switch (e.key) {
      case "Escape": modal.classList.add("hidden"); break;
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

  // Fetch minerals
  let minerals = [];
  try {
    const response = await fetch("minerals.json");
    minerals = await response.json();

    const categoryMap = {};
    minerals.forEach(mineral => {
      if (!categoryMap[mineral.category]) categoryMap[mineral.category] = new Set();
      if (mineral.subcategory) categoryMap[mineral.category].add(mineral.subcategory);
    });

    // Create cards
    minerals.forEach(mineral => {
      const card = document.createElement("div");
      card.classList.add("mineral-card");
      card.dataset.name = mineral.name;
      card.dataset.locality = mineral.locality;
      card.dataset.dimensions = mineral.dimensions || "";
      card.dataset.size = mineral.size || "";
      card.dataset.weight = mineral.weight;
      card.dataset.price = mineral.price;
      card.dataset.system = mineral.system;
      card.dataset.selfCollected = (mineral.selfCollected && mineral.selfCollected.toLowerCase() === "yes") ? "Yes" : "No";
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

    // Add "All" category
    const allItem = document.createElement("li");
    allItem.textContent = "All";
    allItem.classList.add("active");
    allItem.style.cursor = "pointer";
    allItem.addEventListener("click", () => {
      activeCategory = "All";
      activeSubcategory = null;
      filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters());
      highlightActive(allItem);
    });
    categoryList.appendChild(allItem);

    // Populate categories/subcategories
    for (const [cat, subcats] of Object.entries(categoryMap)) {
      const li = document.createElement("li");
      li.textContent = cat;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        activeCategory = cat;
        activeSubcategory = null;
        filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters());
        highlightActive(li);
      });

      if (subcats.size > 0) {
        const ul = document.createElement("ul");
        ul.style.paddingLeft = "12px";
        subcats.forEach(sub => {
          const subLi = document.createElement("li");
          subLi.textContent = sub;
          subLi.style.cursor = "pointer";
          subLi.addEventListener("click", e => {
            e.stopPropagation();
            activeCategory = cat;
            activeSubcategory = sub;
            filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters());
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

  function getCurrentFilters() {
    return {
      locality: filterLocality.value || null,
      size: filterSize.value || null,
      weightMin: parseFloat(filterWeightMin.value) || null,
      weightMax: parseFloat(filterWeightMax.value) || null,
      priceMin: parseFloat(filterPriceMin.value) || null,
      priceMax: parseFloat(filterPriceMax.value) || null,
      system: filterSystem.value || null
    };
  }

  function filterCards(category, subcategory = null, searchText = "", filters = {}) {
    document.querySelectorAll(".mineral-card").forEach(card => {
      const matchesCategory = category === "All" || card.dataset.category === category;
      const matchesSub = !subcategory || card.dataset.subcategory === subcategory;
      const matchesSearch = card.dataset.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesLocality = !filters.locality || card.dataset.locality.toLowerCase().includes(filters.locality.toLowerCase());
      const matchesSize = !filters.size || card.dataset.size === filters.size;
      const weight = parseFloat(card.dataset.weight) || 0;
      const price = parseFloat(card.dataset.price.replace(/\$/,'') || 0);
      const matchesWeight = (!filters.weightMin || weight >= filters.weightMin) && (!filters.weightMax || weight <= filters.weightMax);
      const matchesPrice = (!filters.priceMin || price >= filters.priceMin) && (!filters.priceMax || price <= filters.priceMax);
      const matchesSystem = !filters.system || card.dataset.system.toLowerCase() === filters.system.toLowerCase();

      card.style.display = (matchesCategory && matchesSub && matchesSearch && matchesLocality &&
                            matchesSize && matchesWeight && matchesPrice && matchesSystem) ? "flex" : "none";
    });
  }

  // Event listeners
  searchInput.addEventListener("input", () => filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters()));
  [filterLocality, filterSize, filterWeightMin, filterWeightMax, filterPriceMin, filterPriceMax, filterSystem].forEach(input => {
    input.addEventListener("input", () => filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters()));
  });
  filterReset.addEventListener("click", () => {
    [filterLocality, filterSize, filterWeightMin, filterWeightMax, filterPriceMin, filterPriceMax, filterSystem].forEach(i => i.value = "");
    activeCategory = "All";
    activeSubcategory = null;
    highlightActive(categoryList.querySelector("li")); // highlight "All"
    filterCards(activeCategory, activeSubcategory, searchInput.value, getCurrentFilters());
  });

});