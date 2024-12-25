$(document).ready(function () {
  let cart = [];
  let currentSessionId = null;

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
  }

  // Save current session
  function saveCurrentSession() {
    if (cart.length === 0) return;

    const sessions = loadFromStorage();
    const sessionData = {
      id: currentSessionId,
      date: new Date().toLocaleDateString(),
      items: cart,
      total: calculateTotal(),
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
    renderHistory();
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
    saveCurrentSession();
  });

  // Remove item from cart
  $(document).on("click", ".remove", function () {
    const itemId = $(this).data("id");
    cart = cart.filter((item) => item.id !== itemId);
    renderCart();
    saveCurrentSession();
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
    saveCurrentSession();
  });

  // New session button
  $("#newSession").click(function () {
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
  $(document).on("click", ".history-section", function () {
    $(this).find("#sessionHistory").slideToggle();
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
                    ₵${item.price.toFixed(2)}
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
                    ${session.date} - GH₵${session.total.toFixed(2)}
                </h3>
                <div class="session-details">
                    ${session.items
                      .map(
                        (item) => `
                        <div class="item">
                            <div class="item-details">
                                <strong>${item.name}</strong>
                                <br>
                                GH₵${item.price.toFixed(2)} x ${item.quantity}
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
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function updateTotal() {
    const total = calculateTotal();
    $("#cartTotal").text(total.toFixed(2));
  }

  function clearForm() {
    $("#itemName").val("");
    $("#itemPrice").val("");
    $("#itemQuantity").val(1);
    $("#itemName").focus();
  }

  function showAlert(message) {
    const alert = $(`<div role="alert">${message}</div>`);
    $(".controls").first().after(alert);
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
});
