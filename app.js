// app.js - Mi Barrunto (Refactored)
const state = {
  menu: [],
  cart: [],
  transactions: [],
  comandas: [],
  currentUser: null, // null or 'admin'
  reservations: [], // list of reservation objects
  reviews: [], // list of review objects
  reviews: [], // list of review objects
  promotions: [], // list of active promotions
  editingProductIndex: null // Track which product is being edited
};

const $ = (s) => document.querySelector(s);
const $all = (s) => Array.from(document.querySelectorAll(s));

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  loadPromotions();
  setupSlider();
  setupGallery(); // New Gallery
  setupInteractions();
  setupAdmin();
});

async function loadMenu() {
  try {
    const res = await fetch('menu.json');
    state.menu = await res.json();
    renderMenu();
  } catch (e) {
    console.error('Error loading menu:', e);
  }
}

function loadPromotions() {
  const stored = localStorage.getItem('mb_promotions_v3');
  if (stored) {
    state.promotions = JSON.parse(stored);
  } else {
    // Default grouped offers
    state.promotions = [
      {
        id: 'promo-10.5',
        title: '👑 Bidón 10.5L - El Emperador',
        desc: 'Ofertas imperiales para la máxima hidratación.',
        img: 'assets/water_bottle_premium.png',
        tiers: [
          { id: 't1', label: 'Pack 10 + 1 Gratis', price: 45.00, oldPrice: 66.00 },
          { id: 't2', label: 'Pack 20 + 2 Gratis', price: 90.00, oldPrice: 132.00 },
          { id: 't3', label: 'Pack Mayorista (30 Und)', price: 100.00, oldPrice: 180.00 }
        ]
      },
      {
        id: 'promo-8.5',
        title: '🛡️ Bidón 8.5L - El Príncipe',
        desc: 'Nobleza y frescura en packs de ahorro.',
        img: 'assets/water_bottle_premium.png',
        tiers: [
          { id: 't4', label: 'Pack 10 + 1 Gratis', price: 35.00, oldPrice: 55.00 },
          { id: 't5', label: 'Pack 20 + 2 Gratis', price: 60.00, oldPrice: 110.00 },
          { id: 't6', label: 'Pack Mayorista (30 Und)', price: 80.00, oldPrice: 150.00 }
        ]
      }
    ];
  }
  renderPromotions();
}

function savePromotions() {
  localStorage.setItem('mb_promotions_v3', JSON.stringify(state.promotions));
  renderPromotions();
  if (state.currentUser === 'admin') renderAdminPromos();
}

// --- GALLERY SECTION ---
function setupGallery() {
  const track = $('.gallery-track');
  const slides = $all('.gallery-slide');
  const prevBtn = $('#gallery-prev');
  const nextBtn = $('#gallery-next');
  const counter = $('.gallery-counter');
  
  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  function updateGallery() {
    // Move track
    const amount = -(currentIndex * 100);
    track.style.transform = `translateX(${amount}%)`;
    
    // Update counter
    counter.textContent = `${currentIndex + 1} • ${totalSlides}`;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateGallery();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateGallery();
    });
  }
  
  // Init
  updateGallery();
}

// --- SLIDER ---
// --- SLIDER ---
function setupSlider() {
  const slides = $all('.slide');
  const dotsContainer = $('.slider-dots');
  const prevBtn = $('.prev-btn');
  const nextBtn = $('.next-btn');
  
  if (slides.length === 0) return;
  
  let current = 0;
  let timer;

  // Create Dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });
  
  const dots = $all('.dot');

  function updateSlider() {
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === current);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function goToSlide(index) {
    current = index;
    if (current >= slides.length) current = 0;
    if (current < 0) current = slides.length - 1;
    updateSlider();
    resetTimer();
  }

  function nextSlide() {
    goToSlide(current + 1);
  }

  function prevSlide() {
    goToSlide(current - 1);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(nextSlide, 5000);
  }

  // Event Listeners
  if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    resetTimer();
  });
  
  if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    resetTimer();
  });

  // Init Timer
  resetTimer();
}

// --- NAVIGATION & VIEWS ---
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function switchView(viewId) {
  ['client-view', 'login-view', 'admin-view'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(viewId).classList.remove('hidden');
}

// --- CLIENT LOGIC ---
function renderMenu() {
  const grid = $('#menu-grid');
  grid.innerHTML = '';

  state.menu.forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-card';
    
    // Generate Tiers HTML if present
    let tiersHtml = '';
    if (item.tiers && item.tiers.length > 0) {
      tiersHtml = `<div class="promo-tiers" style="margin-top:1rem; border-top:1px solid #eee; padding-top:0.5rem;">`;
      item.tiers.forEach(t => {
        tiersHtml += `
          <div class="tier-item">
            <div class="tier-info">
              <span class="tier-label">${t.label}</span>
              <div class="tier-price-box">
                ${t.oldPrice ? `<span class="tier-old-price">S/ ${t.oldPrice.toFixed(2)}</span>` : ''}
                <span class="tier-price">S/ ${t.price.toFixed(2)}</span>
              </div>
            </div>
            <button class="btn btn-primary tier-btn" data-code="${item.code}-${t.id}" data-name="${item.name} (${t.label})" data-price="${t.price}">Pedir</button>
          </div>
        `;
      });
      tiersHtml += `</div>`;
    }

    div.innerHTML = `
      <div class="menu-img" style="background: url('${item.img}') center/cover no-repeat;"></div>
      <div class="menu-body">
        <h4 class="menu-title">${item.name}</h4>
        <p class="menu-desc">${item.desc}</p>
        <div class="menu-footer">
          <span class="menu-price">S/ ${item.price.toFixed(2)} (Unidad)</span>
          <button class="btn btn-outline add-btn" data-code="${item.code}" data-name="${item.name}" data-price="${item.price}">Agregar</button>
        </div>
        ${tiersHtml}
      </div>
    `;

    // Attach listeners
    div.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const data = e.target.dataset;
        addToCart({
          code: data.code,
          name: data.name,
          price: parseFloat(data.price)
        });
        updateCartCount();
      });
    });

    grid.appendChild(div);
  });
}

function renderPromotions() {
  const grid = $('#promos-grid');
  if (!grid) return;
  
  if (state.promotions.length === 0) {
    $('#promociones').classList.add('hidden');
    return;
  }
  
  $('#promociones').classList.remove('hidden');
  grid.innerHTML = '';
  
  state.promotions.forEach(p => {
    const div = document.createElement('div');
    div.className = 'menu-card promo-card';
    div.style.border = '2px solid var(--accent)';
    
    const bgStyle = p.img 
      ? `background: url('${p.img}') center/cover no-repeat;` 
      : `background: linear-gradient(135deg, var(--primary), var(--secondary));`;
      
    div.innerHTML = `
      <div class="menu-img" style="${bgStyle} position:relative;">
        <div class="promo-badge">🔥 OFERTA</div>
      </div>
      <div class="menu-body">
        <h4 class="menu-title">${p.title}</h4>
        <p class="menu-desc">${p.desc}</p>
        <div style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); font-weight:bold;">
          ⏳ ${p.duration}
        </div>
        <div class="menu-footer">
          <div style="display:flex; flex-direction:column;">
            ${p.oldPrice ? `<span style="text-decoration:line-through; color:#999; font-size:0.9rem;">S/ ${parseFloat(p.oldPrice).toFixed(2)}</span>` : ''}
            <span class="menu-price">S/ ${parseFloat(p.price).toFixed(2)}</span>
          </div>
          <button class="btn btn-primary add-promo-btn">Pedir</button>
        </div>
      </div>
    `;
    
    div.querySelector('.add-promo-btn').addEventListener('click', () => {
      addToCart({
        code: p.id,
        name: p.title,
        price: parseFloat(p.price)
      });
      updateCartCount();
    });
    
    grid.appendChild(div);
  });
}

function addToCart(item) {
  const found = state.cart.find(i => i.code === item.code);
  if (found) found.qty++;
  else state.cart.push({ ...item, qty: 1 });

  // Visual feedback
  const btn = $('#btn-float-cart');
  btn.style.transform = 'scale(1.1)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function updateCartCount() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  $('#cart-count').textContent = count;
}

function renderCartModal() {
  const list = $('#cart-items-list');
  const totalEl = $('#cart-total');
  list.innerHTML = '';

  if (state.cart.length === 0) {
    list.innerHTML = '<p>Carrito vacío</p>';
    totalEl.textContent = '';
    $('#btn-place-order').style.display = 'none';
    return;
  }

  // Ensure buttons are visible
  $('#btn-place-order').style.display = 'block';

  let total = 0;
  state.cart.forEach((i, idx) => {
    total += i.price * i.qty;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '0.5rem';
    div.style.paddingBottom = '0.5rem';
    div.style.borderBottom = '1px solid #eee';
    
    div.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:bold;">${i.name}</div>
        <div style="font-size:0.9rem; color:#666;">S/ ${i.price.toFixed(2)} c/u</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <button class="btn btn-outline" style="padding:0.2rem 0.5rem; min-width:30px;" onclick="updateItemQty(${idx}, -1)">-</button>
        <span style="font-weight:bold; min-width:20px; text-align:center;">${i.qty}</span>
        <button class="btn btn-outline" style="padding:0.2rem 0.5rem; min-width:30px;" onclick="updateItemQty(${idx}, 1)">+</button>
      </div>
      <div style="min-width:60px; text-align:right; font-weight:bold;">
        S/ ${(i.price * i.qty).toFixed(2)}
      </div>
      <button class="btn btn-outline" style="margin-left:0.5rem; border-color:#ff6b6b; color:#ff6b6b; padding:0.2rem 0.5rem;" onclick="removeItem(${idx})">🗑️</button>
    `;
    list.appendChild(div);
  });
  totalEl.textContent = 'Total: S/ ' + total.toFixed(2);

  // Remove Clear Cart Button if exists (cleanup from previous version)
  const clearBtn = $('#btn-clear-cart');
  if (clearBtn) {
    clearBtn.remove();
  }
}

window.updateItemQty = function(index, delta) {
  const item = state.cart[index];
  if (!item) return;
  
  item.qty += delta;
  if (item.qty <= 0) {
    // If quantity goes to 0, we can remove it or keep it at 1?
    // Usually - button at 1 removes it.
    state.cart.splice(index, 1);
  }
  updateCartCount();
  renderCartModal();
};

window.removeItem = function(index) {
  if (confirm('¿Eliminar este producto del pedido?')) {
    state.cart.splice(index, 1);
    updateCartCount();
    renderCartModal();
  }
};

// Replaced placeOrder with openCheckout
function openCheckout() {
  if (state.cart.length === 0) return;
  $('#cart-modal').classList.add('hidden');
  $('#checkout-modal').classList.remove('hidden');
}

function finalizeOrder(customerData) {
  const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const txId = 'TX-' + Date.now().toString().slice(-6);

  // Create Transaction & Comanda
  const tx = { 
    id: txId, 
    items: [...state.cart], 
    total, 
    date: new Date().toISOString(),
    customer: customerData 
  };
  
  const comanda = { 
    id: 'CMD-' + Date.now().toString().slice(-6), 
    txId, 
    items: state.cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })), 
    total: total,
    status: 'pendiente', 
    time: new Date().toISOString(),
    customer: customerData
  };

  // state.transactions.unshift(tx); // REMOVED: Transaction is now created only when order is ready
  state.comandas.push(comanda);

  // Show Ticket
  showTicket(tx);

  // Clear Cart
  state.cart = [];
  updateCartCount();
  closeModal('checkout-modal');

  // Refresh Admin Views if active
  if (state.currentUser === 'admin') {
    renderAdminCaja();
    renderAdminComandas();
  }
}

function showTicket(tx) {
  const content = $('#ticket-content');
  content.innerHTML = `
    <div class="receipt-header">
      <h3>BOLETA DE VENTA</h3>
      <p>RUC: 20123456789</p>
      <p>Mi Barrunto S.A.C.</p>
      <small>Ticket #${tx.id}</small>
      <div style="margin-top:0.5rem; text-align:left; border-top:1px dashed #ccc; padding-top:0.5rem;">
        <strong>Cliente:</strong> ${tx.customer.name}<br>
        <strong>Teléfono:</strong> ${tx.customer.phone}
      </div>
    <div class="receipt-items">
      ${tx.items.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.qty} x ${i.name}</span> <span>${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
    </div>
    <div class="receipt-total">TOTAL: S/ ${tx.total.toFixed(2)}</div>
    <div style="text-align:center; margin-top:1rem; font-size:0.8rem;">¡Gracias por su preferencia! 👑</div>
  `;
  $('#ticket-id').textContent = ''; 
  $('#ticket-modal').classList.remove('hidden');
}

// --- DATA LOADING ---
async function loadMenu() {
  const stored = localStorage.getItem('mb_menu_v1');
  if (stored) {
    state.menu = JSON.parse(stored);
    renderMenu();
  } else {
    try {
      const res = await fetch('menu.json');
      const data = await res.json();
      state.menu = data;
      saveMenu(); // Save initial data to storage
      renderMenu();
    } catch (e) {
      console.error('Error loading menu', e);
    }
  }
}

function saveMenu() {
  localStorage.setItem('mb_menu_v1', JSON.stringify(state.menu));
  renderMenu();
  if (state.currentUser === 'admin') renderAdminProducts();
}

// --- ADMIN LOGIC ---
function setupAdmin() {
  // Login
  $('#btn-client-login').addEventListener('click', () => switchView('login-view'));
  $('#btn-back-home').addEventListener('click', () => switchView('client-view'));

  $('#btn-do-login').addEventListener('click', () => {
    const u = $('#login-user').value;
    const p = $('#login-pass').value;
    if (u === 'admin' && p === 'admin') {
      state.currentUser = 'admin';
      switchView('admin-view');
      renderAdminCaja();
    } else {
      alert('Credenciales incorrectas');
    }
  });

  $('#btn-logout').addEventListener('click', () => {
    state.currentUser = null;
    switchView('client-view');
  });

  // Tabs
  const tabs = ['caja', 'comandas', 'reservas', 'products', 'promos'];
  tabs.forEach(t => {
    $(`#tab-${t}`).addEventListener('click', () => {
      tabs.forEach(x => {
        $(`#view-${x}`).classList.add('hidden');
        $(`#tab-${x}`).classList.remove('active');
      });
      $(`#view-${t}`).classList.remove('hidden');
      $(`#tab-${t}`).classList.add('active');
      
      if (t === 'caja') renderAdminCaja();
      if (t === 'comandas') renderAdminComandas();
      if (t === 'reservas') renderAdminReservas();
      if (t === 'products') renderAdminProducts();
      if (t === 'promos') renderAdminPromos();
    });
  });
  
  // Helper: Process Image (File -> Base64 with Resize)
  const processImageFile = (fileInput) => {
    return new Promise((resolve, reject) => {
      const file = fileInput.files[0];
      if (!file) return resolve(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 400; // Limit size to save space

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Product Form
  $('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Process Image
    const imgData = await processImageFile($('#prod-img'));
    const currentImg = state.editingProductIndex !== null ? state.menu[state.editingProductIndex].img : 'assets/water_bottle_premium.png';
    const finalImg = imgData || currentImg;

    // Collect Tiers
    const tiers = [];
    for(let i=1; i<=3; i++) {
      const label = $(`#tier${i}-label`).value;
      const price = $(`#tier${i}-price`).value;
      if (label && price) {
        tiers.push({
          id: 't' + Date.now() + i,
          label: label,
          price: parseFloat(price),
          oldPrice: $(`#tier${i}-old`).value ? parseFloat($(`#tier${i}-old`).value) : null
        });
      }
    }

    const newProd = {
      code: state.editingProductIndex !== null ? state.menu[state.editingProductIndex].code : 'P-' + Date.now(),
      name: $('#prod-name').value,
      desc: $('#prod-desc').value,
      price: parseFloat($('#prod-price').value),
      img: finalImg,
      tiers: tiers
    };

    if (state.editingProductIndex !== null) {
      // Update existing
      state.menu[state.editingProductIndex] = newProd;
      alert('Producto actualizado');
      cancelEdit();
    } else {
      // Create new
      state.menu.push(newProd);
      alert('Producto guardado');
      $('#product-form').reset();
    }
    
    saveMenu();
  });

  // Cancel Edit Listener
  $('#btn-cancel-edit').addEventListener('click', cancelEdit);

  // Promo Form
  $('#promo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imgData = await processImageFile($('#promo-img'));
    const finalImg = imgData || null;

    const newPromo = {
      id: 'promo-' + Date.now(),
      title: $('#promo-title').value,
      desc: $('#promo-desc').value,
      price: parseFloat($('#promo-price').value),
      oldPrice: $('#promo-old-price').value ? parseFloat($('#promo-old-price').value) : null,
      img: finalImg,
      duration: $('#promo-duration').value
    };
    state.promotions.push(newPromo);
    savePromotions();
    alert('Promoción creada con éxito');
    $('#promo-form').reset();
  });

  // Filter listener
  const filterSelect = $('#comandas-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderAdminComandas();
    });
  }
}

function renderAdminProducts() {
  const container = $('#admin-products-list');
  container.innerHTML = '';
  
  state.menu.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'receipt'; // reuse receipt style for card
    div.style.marginBottom = '1rem';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    
    div.innerHTML = `
      <div style="display:flex; align-items:center; gap:1rem;">
        <img src="${p.img}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
        <div>
          <strong>${p.name}</strong>
          <div style="font-size:0.8rem; color:#666;">S/ ${p.price.toFixed(2)} - ${p.tiers ? p.tiers.length + ' ofertas' : 'Sin ofertas'}</div>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" onclick="editProduct(${index})">Editar</button>
        <button class="btn btn-outline" style="color:red; border-color:red;" onclick="deleteProduct(${index})">Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
}

window.deleteProduct = function(index) {
  if (confirm('¿Seguro de eliminar este producto?')) {
    state.menu.splice(index, 1);
    saveMenu();
  }
};

window.editProduct = function(index) {
  const p = state.menu[index];
  state.editingProductIndex = index;
  
  // Populate form
  $('#prod-name').value = p.name;
  $('#prod-desc').value = p.desc;
  $('#prod-price').value = p.price;
  // File input cannot be set value
  
  // Show current image preview
  let preview = $('#prod-img-preview');
  if (!preview) {
    preview = document.createElement('img');
    preview.id = 'prod-img-preview';
    preview.style.width = '50px';
    preview.style.height = '50px';
    preview.style.objectFit = 'cover';
    preview.style.marginTop = '0.5rem';
    $('#prod-img').parentNode.appendChild(preview);
  }
  preview.src = p.img;
  
  // Clear tiers first
  for(let i=1; i<=3; i++) {
    $(`#tier${i}-label`).value = '';
    $(`#tier${i}-price`).value = '';
    $(`#tier${i}-old`).value = '';
  }

  // Populate tiers
  if (p.tiers) {
    p.tiers.forEach((t, i) => {
      if (i < 3) {
        $(`#tier${i+1}-label`).value = t.label;
        $(`#tier${i+1}-price`).value = t.price;
        if (t.oldPrice) $(`#tier${i+1}-old`).value = t.oldPrice;
      }
    });
  }

  // Update UI
  $('#btn-save-prod').textContent = 'Actualizar Producto';
  $('#btn-cancel-edit').classList.remove('hidden');
  
  // Scroll to form
  $('#product-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelEdit = function() {
  state.editingProductIndex = null;
  $('#product-form').reset();
  
  // Remove preview
  const preview = $('#prod-img-preview');
  if (preview) preview.remove();
  
  $('#btn-save-prod').textContent = 'Guardar Producto';
  $('#btn-cancel-edit').classList.add('hidden');
};

function renderAdminCaja() {
  const container = $('#admin-transactions');
  if (state.transactions.length === 0) {
    container.innerHTML = '<p>No hay ventas registradas.</p>';
    return;
  }
  container.innerHTML = state.transactions.map(t => `
    <div style="background:white; padding:1rem; margin-bottom:1rem; border-radius:8px; border:1px solid #eee;">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
        <strong>${t.id}</strong>
        <span style="font-weight:bold; color:green;">S/ ${t.total.toFixed(2)}</span>
      </div>
      <div style="font-size:0.9rem; margin-bottom:0.5rem;">
        <strong>Cliente:</strong> ${t.customer ? t.customer.name : 'Anónimo'}<br>
        <strong>Tel:</strong> ${t.customer ? t.customer.phone : '-'}
      </div>
      <small style="color:#666;">${new Date(t.date).toLocaleString()}</small>
    </div>
  `).join('');
}

function renderAdminComandas() {
  const container = $('#admin-comandas');
  const filter = $('#comandas-filter') ? $('#comandas-filter').value : 'all';
  
  let list = state.comandas;
  if (filter !== 'all') {
    list = list.filter(c => c.status === filter);
  }

  if (list.length === 0) {
    container.innerHTML = '<p>No hay comandas con este estado.</p>';
    return;
  }
  
  container.innerHTML = list.map(c => {
    let statusColor = 'orange';
    if (c.status === 'listo') statusColor = 'green';
    if (c.status === 'cancelado') statusColor = 'red';

    return `
    <div style="background:white; padding:1rem; margin-bottom:1rem; border-radius:8px; border-left:4px solid ${statusColor};">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
        <strong>${c.id}</strong>
        <span style="text-transform:uppercase; font-size:0.8rem; font-weight:bold; color:${statusColor}">${c.status}</span>
      </div>
      <div style="font-size:0.9rem; margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px dashed #eee;">
        <strong>Cliente:</strong> ${c.customer ? c.customer.name : 'Anónimo'}<br>
        <strong>Tel:</strong> ${c.customer ? c.customer.phone : '-'}
         ${c.customer && c.customer.address ? `<br><strong>Dir:</strong> ${c.customer.address}` : ''}
      </div>
      <ul style="margin:0.5rem 0; padding-left:1.2rem;">${c.items.map(i => `<li>${i.name} x ${i.qty}</li>`).join('')}</ul>
      <div style="display:flex; gap:0.5rem;">
        ${c.status === 'pendiente' ? `<button onclick="markReady('${c.id}')" class="btn btn-primary" style="padding:0.5rem; font-size:0.8rem; flex:1;">Marcar Listo</button>` : ''}
        ${c.status === 'pendiente' ? `<button onclick="cancelOrder('${c.id}')" class="btn btn-outline" style="padding:0.5rem; font-size:0.8rem; flex:1; border-color:red; color:red;">Cancelar</button>` : ''}
      </div>
    </div>
  `}).join('');
}

function renderAdminPromos() {
  const container = $('#admin-promos-list');
  if (state.promotions.length === 0) {
    container.innerHTML = '<p>No hay promociones activas.</p>';
    return;
  }
  container.innerHTML = state.promotions.map(p => `
    <div style="background:white; padding:1rem; margin-bottom:1rem; border-radius:8px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <strong>${p.title}</strong>
        <p style="font-size:0.9rem; color:#666;">${p.desc} | S/ ${p.price}</p>
      </div>
      <button onclick="deletePromo('${p.id}')" class="btn btn-outline" style="border-color:#ff6b6b; color:#ff6b6b; padding:0.5rem;">Eliminar</button>
    </div>
  `).join('');
}

window.markReady = (id) => {
  const c = state.comandas.find(x => x.id === id);
  if (c) {
    c.status = 'listo';
    
    // Create Transaction now that it is completed
    const tx = { 
      id: 'TX-' + Date.now().toString().slice(-6), 
      items: c.items, 
      total: c.total, 
      date: new Date().toISOString(),
      customer: c.customer 
    };
    state.transactions.unshift(tx);
    
    renderAdminComandas();
    renderAdminCaja(); // Update Caja view
  }
};

window.cancelOrder = (id) => {
  if (confirm('¿Seguro de cancelar este pedido?')) {
    const c = state.comandas.find(x => x.id === id);
    if (c) {
      c.status = 'cancelado';
      renderAdminComandas();
    }
  }
};

window.deletePromo = (id) => {
  if(confirm('¿Eliminar esta promoción?')) {
    state.promotions = state.promotions.filter(p => p.id !== id);
    savePromotions();
  }
};

// --- INTERACTIONS ---
function setupInteractions() {
  $('#btn-float-cart').addEventListener('click', () => {
    renderCartModal();
    $('#cart-modal').classList.remove('hidden');
  });

  $('#btn-close-cart').addEventListener('click', () => closeModal('cart-modal'));
  // Changed listener from placeOrder to openCheckout
  $('#btn-place-order').addEventListener('click', openCheckout);

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link (optional UX improvement)
    navLinks.querySelectorAll('a, button').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Checkout Form Listener
  const checkoutForm = $('#checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: $('#checkout-name').value,
        phone: $('#checkout-phone').value,
        address: $('#checkout-address').value
      };
      finalizeOrder(data);
      checkoutForm.reset();
    });
  }

  // Checkbox/Radio Logic for Reservation Product
  const productOptions = document.querySelectorAll('.product-option');
  if (productOptions.length > 0) {
    productOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        // Clear all selected
        productOptions.forEach(o => o.classList.remove('selected'));
        // Select clicked
        opt.classList.add('selected');
        // Update hidden input
        $('#res-product').value = opt.getAttribute('data-value');
      });
    });
  }

  // Reservation form submit
  const reservationForm = $('#reservation-form');
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = {
        product: $('#res-product').value,
        qty: parseInt($('#res-qty').value, 10),
        address: $('#res-address').value,
        date: $('#res-date').value,
        time: $('#res-time').value,
        phone: $('#res-phone').value,
        name: $('#res-name').value
      };
      state.reservations.push(res);
      alert('Reserva confirmada');
      reservationForm.reset();
      if (state.currentUser === 'admin') renderAdminReservas();
    });
  }

  // Review form submit
  const reviewForm = $('#review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rev = {
        name: $('#rev-name').value,
        text: $('#rev-text').value,
        rating: parseInt(reviewForm.querySelector('select[name="rating"]').value, 10)
      };
      state.reviews.push(rev);
      alert('Gracias por tu opinión');
      reviewForm.reset();
      renderReviewsList();
    });
  }
}

window.closeModal = (id) => {
  document.getElementById(id).classList.add('hidden');
};

// Render reviews list
function renderReviewsList() {
  const container = $('#reviews-list');
  if (!container) return;
  container.innerHTML = state.reviews.map(r => `
    <div class='review-card'>
      <div class='stars'>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p>${r.text}</p>
      <div class='review-author'>- ${r.name}</div>
    </div>`).join('');
}

// Render admin reservations
function renderAdminReservas() {
  const container = $('#admin-reservas-list');
  if (!container) return;
  if (state.reservations.length === 0) {
    container.innerHTML = '<p>No hay reservas.</p>';
    return;
  }
  container.innerHTML = state.reservations.map((r, idx) => `
    <div style='background:white; padding:1rem; margin-bottom:1rem; border-radius:8px; border:1px solid #eee;'>
      <strong>Reserva #${idx + 1}</strong> <span style="font-size:0.8rem; color:#666;">(${r.date} ${r.time})</span><br/>
      <div style="margin-top:0.5rem;">
        <strong>Producto:</strong> ${r.product} x ${r.qty}<br>
        <strong>Cliente:</strong> ${r.name}<br>
        <strong>Teléfono:</strong> ${r.phone}<br>
        <strong>Dirección:</strong> ${r.address}
      </div>
    </div>`).join('');
}

// Initialize render of reviews on load
renderReviewsList();