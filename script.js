// Formatter for currency
const formatCurrency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
});

// Format date to word short format
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

$(document).ready(function () {
  let cart = [];
  let currentSessionId = loadCurrentSession() || null;

  // Load current session from localStorage
  function loadCurrentSession() {
    const currentSession = localStorage.getItem("currentSession");
    if (currentSession) {
      cart = JSON.parse(currentSession).items || [];
      renderCart();
      return JSON.parse(currentSession).id;
    }
    return null;
  }

  // Save current cart to localStorage
  function saveCurrentCart() {
    if (currentSessionId) {
      localStorage.setItem(
        "currentSession",
        JSON.stringify({
          id: currentSessionId,
          items: cart,
        })
      );
    }
  }

  // Load data from localStorage
  function loadFromStorage() {
    const sessions = JSON.parse(localStorage.getItem("shoppingHistory")) || [];
    return sessions;
  }

  // Save data to localStorage
  function saveToStorage(sessions) {
    localStorage.setItem("shoppingHistory", JSON.stringify(sessions));
  }

  // Create new shopping session
  function createNewSession() {
    currentSessionId = Date.now();
    cart = [];
    renderCart();
    $("#currentSession").show();
    renderHistory();
    saveCurrentCart();
  }

  // Save current session
  function saveCurrentSession() {
    if (cart.length === 0) return;

    const sessions = loadFromStorage();
    const sessionTitle = $("#sessionTitle").val();
    const discount = parseInt($("#itemDiscount").val()) || 0;
    const total = calculateTotal();
    const discountedTotal = total * (1 - discount / 100);

    const sessionData = {
      id: currentSessionId,
      title: sessionTitle || "Untitled Session",
      date: Date.now(), // Store timestamp for consistent date formatting
      items: cart,
      discount: discount,
      total: discountedTotal,
    };

    const existingSessionIndex = sessions.findIndex(
      (s) => s.id === currentSessionId
    );
    if (existingSessionIndex !== -1) {
      sessions[existingSessionIndex] = sessionData;
    } else {
      sessions.unshift(sessionData);
    }

    saveToStorage(sessions);
    localStorage.removeItem("currentSession"); // Clear current session
    currentSessionId = null;
    cart = [];
    renderCart();
    renderHistory();
    $("#sessionTitle").val("");
    $("#itemDiscount").val(0);
  }

  // Add item to cart
  $("#addItem").click(function () {
    const name = $("#itemName").val();
    const price = parseFloat($("#itemPrice").val());
    const quantity = parseInt($("#itemQuantity").val());

    if (!name || isNaN(price) || isNaN(quantity)) {
      showAlert("Please fill all fields correctly");
      return;
    }

    if (!currentSessionId) {
      createNewSession();
    }

    const item = {
      id: Date.now(),
      name,
      price,
      quantity,
    };

    cart.push(item);
    renderCart();
    clearForm();
    saveCurrentCart();
  });

  // Remove item from cart
  $(document).on("click", ".remove", function () {
    const itemId = $(this).data("id");
    cart = cart.filter((item) => item.id !== itemId);
    renderCart();
    saveCurrentCart();
  });

  // Edit quantity
  $(document).on("change", ".quantity", function () {
    const itemId = $(this).data("id");
    const newQuantity = parseInt($(this).val());

    if (newQuantity < 1) {
      $(this).val(1);
      return;
    }

    cart = cart.map((item) => {
      if (item.id === itemId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    updateTotal();
    saveCurrentCart();
  });

  // Handle discount changes
  $("#itemDiscount").on("change", function () {
    updateTotal();
  });

  // End session button
  $("#endSession").click(function () {
    if (cart.length === 0) {
      showAlert("Add items to cart before ending session");
      return;
    }
    if (!$("#sessionTitle").val()) {
      showAlert("Please add a session title");
      return;
    }
    saveCurrentSession();
    createNewSession();
  });

  // Clear history button
  $("#clearHistory").click(function () {
    if (confirm("Are you sure you want to clear all shopping history?")) {
      localStorage.removeItem("shoppingHistory");
      renderHistory();
      showAlert("Shopping history cleared successfully");
    }
  });

  // Toggle session details
  $(document).on("click", ".session", function () {
    $(this).find(".session-details").slideToggle();
  });

  // Toggle session history
  $(document).on("click", ".controls h2", function () {
    $("#sessionHistory").slideToggle();
    $(".fa-angle-down").toggleClass("rotate");
  });

  function renderCart() {
    const cartHtml = cart
      .map(
        (item) => `
              <div class="item" role="listitem">
                  <div class="item-details">
                      <strong>${item.name}</strong>
                      <br>
                      ${formatCurrency.format(item.price)}
                  </div>
                  <input type="number" 
                         class="quantity" 
                         value="${item.quantity}" 
                         min="1" 
                         data-id="${item.id}"
                         aria-label="Quantity for ${item.name}">
                  <div class="actions">
                      <button class="remove" 
                              data-id="${item.id}"
                              aria-label="Remove ${item.name} from cart">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              </div>
          `
      )
      .join("");

    $("#cartItems").html(cartHtml || "<p>No items in cart</p>");
    updateTotal();
  }

  function renderHistory() {
    const sessions = loadFromStorage();
    const historyHtml = sessions
      .map(
        (session) => `
              <div class="session">
                  <h3>
                      <i class="fas fa-shopping-bag"></i> 
                      ${session.title} - ${formatDate(session.date)}
                      - ${formatCurrency.format(session.total)} ${
          session.discount > 0 ? `(${session.discount}% off)` : ""
        }
                  </h3>
                  <div class="session-details">
                      ${session.items
                        .map(
                          (item) => `
                          <div class="item">
                              <div class="item-details">
                                  <strong>${item.name}</strong>
                                  <br>
                                  ${formatCurrency.format(
                                    item.price * (1 - session.discount * 0.01)
                                  )} x ${item.quantity}
                                   ${
                                     session.discount > 0
                                       ? `<del>(${formatCurrency.format(
                                           item.price
                                         )})</del>`
                                       : ""
                                   }
                            
                              </div>
                          </div>
                      `
                        )
                        .join("")}
                  </div>
              </div>
          `
      )
      .join("");

    $("#sessionHistory").html(historyHtml || "<p>No shopping history</p>");
  }

  function calculateTotal() {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount = parseInt($("#itemDiscount").val()) || 0;
    return subtotal * (1 - discount / 100);
  }

  function updateTotal() {
    const total = calculateTotal();
    $("#cartTotal").text(
      formatCurrency.format(total).replace("GHS", "").trim()
    );
  }

  function clearForm() {
    $("#itemName").val("");
    $("#itemPrice").val("");
    $("#itemQuantity").val(1);
    $("#itemName").focus();
  }

  function showAlert(message) {
    const alert = $(`<div role="alert">${message}</div>`);
    $("#currentSession").before(alert);
    setTimeout(
      () =>
        alert.fadeOut("slow", function () {
          $(this).remove();
        }),
      3000
    );
  }

  // Initialize
  renderHistory();
  if (cart.length > 0) {
    renderCart();
  }
});
