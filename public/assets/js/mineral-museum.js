document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("mineral-grid");
  const categoryList = document.getElementById("category-list");
  const searchInput = document.getElementById("search");
  const loadMoreBtn = document.getElementById("load-more");

  // Pagination
  const PAGE_SIZE = 24;
  let currentPage = 1;
  let filteredMinerals = [];

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

  let activeCategory = "All";
  let activeSubcategory = null;

  let minerals = [];

  /* ---------------- Modal ---------------- */

  function openMineralModal(card) {
    modalImage.src = card.dataset.image;
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
      currentGalleryImages.push(...card.dataset.images.split(","));
    }
    currentImageIndex = 0;

    currentGalleryImages.forEach((src, index) => {
      const img = document.createElement("img");
      img.src = src;
      img.addEventListener("click", () => {
        currentImageIndex = index;
        modalImage.src = src;
      });
      gallery.appendChild(img);
    });

    modal.classList.remove("hidden");
  }

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => e.target === modal && modal.classList.add("hidden"));

  document.addEventListener("keydown", e => {
    if (modal.classList.contains("hidden")) return;
    if (e.key === "Escape") modal.classList.add("hidden");
    if (e.key === "ArrowLeft" && currentGalleryImages.length > 1) {
      currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
      modalImage.src = currentGalleryImages[currentImageIndex];
    }
    if (e.key === "ArrowRight" && currentGalleryImages.length > 1) {
      currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
      modalImage.src = currentGalleryImages[currentImageIndex];
    }
  });

  /* ---------------- Rendering ---------------- */

  function createCard(mineral) {
    const card = document.createElement("div");
    card.className = "mineral-card";

    Object.assign(card.dataset, {
      name: mineral.name,
      locality: mineral.locality,
      dimensions: mineral.dimensions || "",
      size: mineral.size || "",
      weight: mineral.weight,
      price: mineral.price,
      system: mineral.system,
      selfCollected: mineral.selfCollected?.toLowerCase() === "yes" ? "Yes" : "No",
      image: mineral.image,
      images: mineral.images.join(","),
      description: mineral.description,
      category: mineral.category,
      subcategory: mineral.subcategory || ""
    });

    card.innerHTML = `
      <img src="${mineral.image}" alt="${mineral.name}" loading="lazy">
      <h3>${mineral.name}</h3>
      <p>${mineral.locality}</p>
    `;

    card.addEventListener("click", () => openMineralModal(card));
    return card;
  }

  function renderPage(reset = false) {
    if (reset) {
      grid.innerHTML = "";
      currentPage = 1;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filteredMinerals.slice(start, end);

    pageItems.forEach(m => grid.appendChild(createCard(m)));

    loadMoreBtn.style.display = end < filteredMinerals.length ? "block" : "none";
    currentPage++;
  }

  /* ---------------- Filtering ---------------- */

  function getCurrentFilters() {
    return {
      locality: filterLocality.value,
      size: filterSize.value,
      weightMin: parseFloat(filterWeightMin.value),
      weightMax: parseFloat(filterWeightMax.value),
      priceMin: parseFloat(filterPriceMin.value),
      priceMax: parseFloat(filterPriceMax.value),
      system: filterSystem.value
    };
  }

  function applyFilters() {
    const filters = getCurrentFilters();
    filteredMinerals = minerals.filter(m => {
      if (activeCategory !== "All" && m.category !== activeCategory) return false;
      if (activeSubcategory && m.subcategory !== activeSubcategory) return false;
      if (searchInput.value && !m.name.toLowerCase().includes(searchInput.value.toLowerCase())) return false;
      if (filters.locality && !m.locality.toLowerCase().includes(filters.locality.toLowerCase())) return false;
      if (filters.size && m.size !== filters.size) return false;

      const weight = parseFloat(m.weight) || 0;
      const price = parseFloat(m.price?.replace("$", "")) || 0;

      if (filters.weightMin && weight < filters.weightMin) return false;
      if (filters.weightMax && weight > filters.weightMax) return false;
      if (filters.priceMin && price < filters.priceMin) return false;
      if (filters.priceMax && price > filters.priceMax) return false;
      if (filters.system && m.system !== filters.system) return false;

      return true;
    });

    renderPage(true);
  }

  /* ---------------- Categories ---------------- */

  function highlightActive(el) {
    categoryList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    el.classList.add("active");
  }

  /* ---------------- Init ---------------- */

  const response = await fetch("minerals.json");
  minerals = await response.json();

  const categoryMap = {};
  minerals.forEach(m => {
    if (!categoryMap[m.category]) categoryMap[m.category] = new Set();
    if (m.subcategory) categoryMap[m.category].add(m.subcategory);
  });

  const allItem = document.createElement("li");
  allItem.textContent = "All";
  allItem.classList.add("active");
  allItem.onclick = () => {
    activeCategory = "All";
    activeSubcategory = null;
    highlightActive(allItem);
    applyFilters();
  };
  categoryList.appendChild(allItem);

  Object.entries(categoryMap).forEach(([cat, subs]) => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.onclick = () => {
      activeCategory = cat;
      activeSubcategory = null;
      highlightActive(li);
      applyFilters();
    };

    if (subs.size) {
      const ul = document.createElement("ul");
      subs.forEach(sub => {
        const subLi = document.createElement("li");
        subLi.textContent = sub;
        subLi.onclick = e => {
          e.stopPropagation();
          activeCategory = cat;
          activeSubcategory = sub;
          highlightActive(subLi);
          applyFilters();
        };
        ul.appendChild(subLi);
      });
      li.appendChild(ul);
    }

    categoryList.appendChild(li);
  });

  /* ---------------- Events ---------------- */

  [searchInput, filterLocality, filterSize, filterWeightMin, filterWeightMax,
   filterPriceMin, filterPriceMax, filterSystem]
   .forEach(el => el.addEventListener("input", applyFilters));

  filterReset.addEventListener("click", () => {
    [filterLocality, filterSize, filterWeightMin, filterWeightMax,
     filterPriceMin, filterPriceMax, filterSystem].forEach(i => i.value = "");
    activeCategory = "All";
    activeSubcategory = null;
    highlightActive(allItem);
    applyFilters();
  });

  loadMoreBtn.addEventListener("click", () => renderPage());

  applyFilters();
});
