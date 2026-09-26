document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("mineral-grid");
  const categoryList = document.getElementById("category-list");
  const searchInput = document.getElementById("search");
  const loadMoreBtn = document.getElementById("load-more");

  const PAGE_SIZE = 24;
  let currentPage = 1;
  let filteredMinerals = [];
  let minerals = [];

  // Modes:
  // "ALL" | "FEATURED" | categoryName
  let activeCategory = "FEATURED";
  let activeSubcategory = null;

  const filterLocality = document.getElementById("filter-locality");
  const filterSize = document.getElementById("filter-size");
  const filterWeightMin = document.getElementById("filter-weight-min");
  const filterWeightMax = document.getElementById("filter-weight-max");
  const filterPriceMin = document.getElementById("filter-price-min");
  const filterPriceMax = document.getElementById("filter-price-max");
  const filterSystem = document.getElementById("filter-system");
  const filterPersonal = document.getElementById("filter-personal");
  const filterForSale = document.getElementById("filter-forsale");
  const filterReset = document.getElementById("filter-reset");

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

  /* ---------------- Status helpers ---------------- */
  // Shared so the sidebar categories, the toggle filters, and the card/
  // modal rendering all agree on what counts as "personally collected"
  // or "for sale" for a given mineral.

  function isSelfCollected(m) {
    return (m.selfCollected || "").toString().toLowerCase() === "yes";
  }

  function isForSale(m) {
    // Prefer an explicit "forSale" field on the mineral if one is set.
    if (m.forSale !== undefined && m.forSale !== null && m.forSale !== "") {
      return m.forSale.toString().toLowerCase() === "yes";
    }
    // Otherwise fall back to inferring it from the price: anything
    // other than "NFS" (Not For Sale) or a blank price counts as for sale.
    const price = (m.price || "").toString().trim().toUpperCase();
    return price !== "" && price !== "NFS";
  }

  /* ---------------- Modal ---------------- */

  function openMineralModal(card) {
    modalImage.src = card.dataset.image;
    modalName.textContent = card.dataset.name;
    modalLocality.textContent = card.dataset.locality;
    modalDimensions.textContent = card.dataset.dimensions || "N/A";
    modalSize.textContent = card.dataset.size || "N/A";
    modalWeight.textContent = card.dataset.weight;

    if (card.dataset.forSale === "Yes" && card.dataset.ebayLink) {
      modalPrice.innerHTML = "";
      const priceLink = document.createElement("a");
      priceLink.href = card.dataset.ebayLink;
      priceLink.target = "_blank";
      priceLink.rel = "noopener noreferrer";
      priceLink.textContent = card.dataset.price;
      modalPrice.appendChild(priceLink);
    } else {
      modalPrice.textContent = card.dataset.price;
    }

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
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  document.addEventListener("keydown", e => {
    if (modal.classList.contains("hidden")) return;

    if (e.key === "Escape") modal.classList.add("hidden");

    if (e.key === "ArrowLeft" && currentGalleryImages.length > 1) {
      currentImageIndex =
        (currentImageIndex - 1 + currentGalleryImages.length) %
        currentGalleryImages.length;
      modalImage.src = currentGalleryImages[currentImageIndex];
    }

    if (e.key === "ArrowRight" && currentGalleryImages.length > 1) {
      currentImageIndex =
        (currentImageIndex + 1) % currentGalleryImages.length;
      modalImage.src = currentGalleryImages[currentImageIndex];
    }
  });

  /* ---------------- CARD ---------------- */

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
      selfCollected: isSelfCollected(mineral) ? "Yes" : "No",
      forSale: isForSale(mineral) ? "Yes" : "No",
      ebayLink: mineral.ebayLink || "",
      image: mineral.image,
      images: (mineral.images || []).join(","),
      description: mineral.description,
      category: mineral.category,
      subcategory: mineral.subcategory || ""
    });

    card.innerHTML = `
      <img src="${mineral.thumbnail || mineral.image}" alt="${mineral.name}" loading="lazy">
      <h3>
        ${mineral.name}
      </h3>
      <p>${mineral.locality}</p>
    `;

    card.addEventListener("click", () => openMineralModal(card));
    return card;
  }

  /* ---------------- RENDER ---------------- */

  function renderPage(reset = false) {
    if (reset) {
      grid.innerHTML = "";
      currentPage = 1;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    filteredMinerals.slice(start, end).forEach(m => {
      grid.appendChild(createCard(m));
    });

    loadMoreBtn.style.display =
      end < filteredMinerals.length ? "block" : "none";

    currentPage++;
  }

  /* ---------------- FILTERING ---------------- */

  function getFilters() {
    return {
      locality: filterLocality.value,
      size: filterSize.value,
      weightMin: parseFloat(filterWeightMin.value),
      weightMax: parseFloat(filterWeightMax.value),
      priceMin: parseFloat(filterPriceMin.value),
      priceMax: parseFloat(filterPriceMax.value),
      system: filterSystem.value,
      personalOnly: filterPersonal.checked,
      forSaleOnly: filterForSale.checked
    };
  }

  function applyFilters() {
    const f = getFilters();

    filteredMinerals = minerals.filter(m => {
      // ---------------- FEATURED BLEND ----------------
      if (activeCategory === "FEATURED" && !m.featured) {
        return false;
      }

      // ---------------- PERSONALLY COLLECTED CATEGORY ----------------
      if (activeCategory === "PERSONAL" && !isSelfCollected(m)) {
        return false;
      }

      // ---------------- FOR SALE CATEGORY ----------------
      if (activeCategory === "FORSALE" && !isForSale(m)) {
        return false;
      }

      // ---------------- CATEGORY FILTER ----------------
      if (
        activeCategory !== "FEATURED" &&
        activeCategory !== "PERSONAL" &&
        activeCategory !== "FORSALE" &&
        activeCategory !== "All"
      ) {
        if (m.category !== activeCategory) return false;
      }

      // Subcategory filter
      if (activeSubcategory && m.subcategory !== activeSubcategory) {
        return false;
      }

      // Search
      if (
        searchInput.value &&
        !m.name.toLowerCase().includes(searchInput.value.toLowerCase())
      ) return false;

      // Locality
      if (f.locality && !m.locality.toLowerCase().includes(f.locality.toLowerCase())) return false;

      // Size
      if (f.size && m.size !== f.size) return false;

      // Numeric filters
      const weight = parseFloat(m.weight) || 0;
      const price = parseFloat((m.price || "").replace("$", "")) || 0;

      if (f.weightMin && weight < f.weightMin) return false;
      if (f.weightMax && weight > f.weightMax) return false;
      if (f.priceMin && price < f.priceMin) return false;
      if (f.priceMax && price > f.priceMax) return false;
      if (f.system && m.system !== f.system) return false;

      // ---------------- TOGGLE FILTERS ----------------
      // Independent of category/sidebar selection -- these narrow down
      // whatever is currently showing, e.g. "Silicates" + "For sale" together.
      if (f.personalOnly && !isSelfCollected(m)) return false;
      if (f.forSaleOnly && !isForSale(m)) return false;

      return true;
    });

    renderPage(true);
  }

  /* ---------------- CATEGORY UI ---------------- */

  function highlight(el) {
    categoryList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    el.classList.add("active");
  }

  /* ---------------- INIT ---------------- */

const mineralFiles = [
  "minerals/silicates/garnets/uvarovites.json",
  "minerals/halides/fluorite/fluorites.json",
  "minerals/molybdates/wulfenite.json",
  "minerals/carbonates/calcite.json"
];

const responses = await Promise.all(
  mineralFiles.map(async f => {
    try {
      const r = await fetch(f);
      if (!r.ok) {
        console.warn("Failed to load:", f);
        return [];
      }
      return await r.json();
    } catch (err) {
      console.warn("Error loading:", f, err);
      return [];
    }
  })
);

minerals = responses.flat();

  const categoryMap = {};
  minerals.forEach(m => {
    if (!categoryMap[m.category]) categoryMap[m.category] = new Set();
    if (m.subcategory) categoryMap[m.category].add(m.subcategory);
  });

  // FEATURED (default landing)
  const featuredItem = document.createElement("li");
  featuredItem.textContent = "Featured";
  featuredItem.classList.add("active");

  featuredItem.onclick = () => {
    activeCategory = "FEATURED";
    activeSubcategory = null;
    highlight(featuredItem);
    applyFilters();
  };

  categoryList.appendChild(featuredItem);

  // PERSONALLY COLLECTED
  const personalItem = document.createElement("li");
  personalItem.textContent = "Personally Collected";

  personalItem.onclick = () => {
    activeCategory = "PERSONAL";
    activeSubcategory = null;
    highlight(personalItem);
    applyFilters();
  };

  categoryList.appendChild(personalItem);

  // FOR SALE
  const forSaleItem = document.createElement("li");
  forSaleItem.textContent = "For Sale";

  forSaleItem.onclick = () => {
    activeCategory = "FORSALE";
    activeSubcategory = null;
    highlight(forSaleItem);
    applyFilters();
  };

  categoryList.appendChild(forSaleItem);

  // ALL
  const allItem = document.createElement("li");
  allItem.textContent = "All";

  allItem.onclick = () => {
    activeCategory = "All";
    activeSubcategory = null;
    highlight(allItem);
    applyFilters();
  };

  categoryList.appendChild(allItem);

  // Categories
  Object.entries(categoryMap).forEach(([cat, subs]) => {
    const li = document.createElement("li");
    li.textContent = cat;

    li.onclick = () => {
      activeCategory = cat;
      activeSubcategory = null;
      highlight(li);
      applyFilters();
    };

    if (subs.size) {
      const ul = document.createElement("ul");

      subs.forEach(sub => {
        const subLi = document.createElement("li");
        subLi.innerHTML = `<span class="icon solid fa-folder"></span>${sub}`;

        subLi.onclick = e => {
          e.stopPropagation();
          activeCategory = cat;
          activeSubcategory = sub;
          highlight(subLi);
          applyFilters();
        };

        ul.appendChild(subLi);
      });

      li.appendChild(ul);
    }

    categoryList.appendChild(li);
  });

  /* ---------------- EVENTS ---------------- */

  [
    searchInput,
    filterLocality,
    filterSize,
    filterWeightMin,
    filterWeightMax,
    filterPriceMin,
    filterPriceMax,
    filterSystem,
    filterPersonal,
    filterForSale
  ].forEach(el => el.addEventListener("input", applyFilters));

  filterReset.addEventListener("click", () => {
    [
      filterLocality,
      filterSize,
      filterWeightMin,
      filterWeightMax,
      filterPriceMin,
      filterPriceMax,
      filterSystem
    ].forEach(i => (i.value = ""));

    filterPersonal.checked = false;
    filterForSale.checked = false;

    activeCategory = "FEATURED";
    activeSubcategory = null;

    highlight(featuredItem);
    applyFilters();
  });

  loadMoreBtn.addEventListener("click", () => renderPage());

  applyFilters();
});