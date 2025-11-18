/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
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

/* Generate Routine button handler */
generateRoutineBtn.addEventListener('click', async () => {
  // Check if any products are selected
  if (selectedProducts.length === 0) {
    addMessageToChat('assistant', 'Please select at least one product to generate a personalized routine.');
    return;
  }
  
  // Disable button and change text while processing
  generateRoutineBtn.disabled = true;
  const originalText = generateRoutineBtn.innerHTML;
  generateRoutineBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Your Routine...';
  
  // Show loading message in chat
  addMessageToChat('assistant', 'Creating your personalized routine...');
  
  try {
    // Prepare detailed product data for the AI
    const productDetails = selectedProducts.map(product => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description
    }));
    
    // Create comprehensive prompt for routine generation
    const routinePrompt = `Please create a detailed, step-by-step beauty routine using these specific products: ${JSON.stringify(productDetails, null, 2)}
    
    Include:
    1. The correct order of application
    2. Best time to use each product (morning/evening)
    3. How to apply each product
    4. Any important tips or warnings
    5. Expected benefits
    
    Format the response as a clear, easy-to-follow routine.`;
    
    // Make request to OpenAI API for routine generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional L\'Oréal beauty expert and skincare specialist. Create detailed, personalized beauty routines based on the specific products provided. Focus on proper application order, timing, and maximizing product benefits. Be specific about techniques and provide helpful tips.'
          },
          {
            role: 'user',
            content: routinePrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const routine = data.choices[0].message.content;
    
    // Remove loading message and display the generated routine
    removeLastMessage();
    addMessageToChat('assistant', routine);
    
  } catch (error) {
    console.error('Error generating routine:', error);
    removeLastMessage();
    addMessageToChat('assistant', 'Sorry, I couldn\'t generate your routine right now. Please try again in a moment.');
  } finally {
    // Re-enable button and restore original text
    generateRoutineBtn.disabled = false;
    generateRoutineBtn.innerHTML = originalText;
  }
});

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const userInput = document.getElementById('userInput');
  const userMessage = userInput.value.trim();
  
  if (!userMessage) return;
  
  // Clear input and show user message
  userInput.value = '';
  addMessageToChat('user', userMessage);
  
  // Show loading indicator
  addMessageToChat('assistant', 'Thinking...');
  
  try {
    // Create context about selected products for the AI
    const selectedProductsContext = selectedProducts.length > 0 
      ? `\n\nSelected products: ${selectedProducts.map(p => `${p.name} by ${p.brand}`).join(', ')}`
      : '';
    
    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a L'Oréal beauty expert helping customers build personalized skincare and beauty routines. Provide helpful, friendly advice about products, routines, and beauty tips. Keep responses concise but informative.${selectedProductsContext}`
          },
          {
            role: 'user', 
            content: userMessage
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Remove loading indicator and show AI response
    removeLastMessage();
    addMessageToChat('assistant', aiResponse);
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    removeLastMessage();
    addMessageToChat('assistant', 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.');
  }
});

/* Add message to chat window */
function addMessageToChat(sender, message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  
  if (sender === 'user') {
    messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    messageDiv.innerHTML = `<strong>L'Oréal Assistant:</strong> ${message}`;
  }
  
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Remove the last message (used for removing loading indicator) */
function removeLastMessage() {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage) {
    lastMessage.remove();
  }
}
