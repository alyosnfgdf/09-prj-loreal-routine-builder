/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Array to store selected products */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, index) => `
    <div class="product-card" data-product-id="${product.id}" onclick="toggleProductSelection(${product.id})">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-tooltip">
        ${product.description}
      </div>
    </div>
  `
    )
    .join("");
  
  /* Update visual state for already selected products */
  updateProductCardStyles();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Toggle product selection when clicked */
async function toggleProductSelection(productId) {
  const products = await loadProducts();
  const product = products.find(p => p.id === productId);
  
  if (!product) return;
  
  /* Check if product is already selected */
  const existingIndex = selectedProducts.findIndex(p => p.id === productId);
  
  if (existingIndex > -1) {
    /* Remove product from selection */
    selectedProducts.splice(existingIndex, 1);
  } else {
    /* Add product to selection */
    selectedProducts.push(product);
  }
  
  /* Update both the product cards and selected products list */
  updateProductCardStyles();
  updateSelectedProductsList();
}

/* Update visual styling of product cards based on selection */
function updateProductCardStyles() {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some(p => p.id === productId);
    
    if (isSelected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

/* Update the selected products list display */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = '<p style="color: #666; font-style: italic;">No products selected yet. Click on product cards to add them.</p>';
    return;
  }
  
  selectedProductsList.innerHTML = selectedProducts.map(product => `
    <div class="selected-product-item">
      <span>${product.name}</span>
      <button class="remove-btn" onclick="removeSelectedProduct(${product.id})" title="Remove product">
        ×
      </button>
    </div>
  `).join('');
}

/* Remove a product from the selected products list */
function removeSelectedProduct(productId) {
  selectedProducts = selectedProducts.filter(p => p.id !== productId);
  updateSelectedProductsList();
  updateProductCardStyles();
}

/* Initialize the selected products list on page load */
document.addEventListener('DOMContentLoaded', () => {
  updateSelectedProductsList();
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
