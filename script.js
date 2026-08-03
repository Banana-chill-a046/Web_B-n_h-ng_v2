// ============ FIREBASE CONFIG ============
const firebaseConfig = {
    apiKey: "AIzaSyBqwerty1234567890abcdefghijklm",
    authDomain: "annampos.firebaseapp.com",
    databaseURL: "https://annampos-default-rtdb.firebaseio.com",
    projectId: "annampos",
    storageBucket: "annampos.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ============ CONFIG ============
const WEBHOOKS = {
    inventory: 'https://discord.com/api/webhooks/1533699757049118731/jAVrg13jZraPwIAuxjWFnXGeZxL6uJIC2Cu8b1CVyEEIGMR4taRHraQei_FGj8ambeOB',
    invoice: 'https://discord.com/api/webhooks/1533700334566768820/MlEO3FoUN869lsDP8o7UsoGjB0fFuloTv8LgHjjrIwNRTyE7FdwMwTyFm3eCDl-pSzbA',
    payment: 'https://discord.com/api/webhooks/1533701759338287195/zelCI_7px4GaTu86TW368pvWHi2BIbjZkJhOMlSQJPZF0SgQ_hyuqHXLXexrmsnLOEYb'
};

const USERS = {
    'nampc211': { password: '88884444', name: 'Vũ Hoàng An Nam', role: 'staff' },
    'anhoang85': { password: '20061985', name: 'Vũ Hoàng An', role: 'staff' }
};

const ADMIN = { username: 'toiratdeptrai123', password: 'taphoaannam' };

const QR_CODES = {
    viettel: 'https://files.catbox.moe/qxc2io.jpg',
    bidv: 'https://img.vietqr.io/image/BIDV-3600868497-compact.png'
};

// ============ STATE ============
let currentUser = null;
let cart = [];
let selectedPayment = 'cash';
let currentTotal = 0;

// ============ LOGIN ============
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('loginError');

    if (USERS[username] && USERS[username].password === password) {
        currentUser = USERS[username];
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('salesScreen').style.display = 'block';
        document.getElementById('userNameDisplay').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        loadProducts();
        errorDiv.style.display = 'none';
    } else {
        errorDiv.textContent = '❌ Sai tên đăng nhập hoặc mật khẩu!';
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        currentUser = null;
        cart = [];
        document.getElementById('salesScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        updateCartDisplay();
    }
}

// ============ PRODUCTS ============
function loadProducts() {
    database.ref('products').on('value', (snapshot) => {
        const products = snapshot.val();
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        if (products) {
            Object.entries(products).forEach(([id, product]) => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.onclick = () => addToCart(id, product);
                
                let stockClass = '';
                if (product.stock <= 0) stockClass = 'stock-out';
                else if (product.stock <= 5) stockClass = 'stock-low';

                card.innerHTML = `
                    <span class="stock-badge ${stockClass}">${product.stock > 0 ? 'Còn ' + product.stock : 'Hết hàng'}</span>
                    <img src="${product.image}" alt="${product.name}" class="product-img" 
                         onerror="this.src='https://via.placeholder.com/200x150/1a1a2e/00b4d8?text=🐟'">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price.toLocaleString('vi-VN')}đ</div>
                    <div class="product-unit">/ ${product.unit}</div>
                `;

                if (product.stock <= 0) {
                    card.style.opacity = '0.5';
                    card.style.pointerEvents = 'none';
                }

                grid.appendChild(card);
            });
        }
    });
}

function addToCart(productId, product) {
    if (product.stock <= 0) {
        alert('Sản phẩm đã hết hàng!');
        return;
    }

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            alert('Đã đạt số lượng tối đa trong kho!');
            return;
        }
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            unit: product.unit,
            quantity: 1,
            image: product.image
        });
    }
    updateCartDisplay();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartDisplay();
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function updateCartDisplay() {
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalAmount');
    
    container.innerHTML = '';
    currentTotal = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.3); padding: 40px 0;">Giỏ hàng trống</p>';
    }

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        currentTotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price.toLocaleString('vi-VN')}đ x ${item.quantity} = ${itemTotal.toLocaleString('vi-VN')}đ</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });

    totalSpan.textContent = currentTotal.toLocaleString('vi-VN') + 'đ';
}

// ============ PAYMENT ============
function selectPayment(method) {
    selectedPayment = method;
    
    document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn${method.charAt(0).toUpperCase() + method.slice(1)}`).classList.add('active');
}

async function sendInvoice() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    if (selectedPayment === 'viettel' || selectedPayment === 'bidv') {
        showQR(selectedPayment);
    } else if (selectedPayment === 'cash') {
        showCashPayment();
    }
}

function showQR(type) {
    const modal = document.getElementById('qrModal');
    const img = document.getElementById('qrImage');
    const title = document.getElementById('qrTitle');
    const amount = document.getElementById('qrAmount');

    img.src = QR_CODES[type];
    title.textContent = type === 'viettel' ? 'Quét ViettelMoney' : 'Quét BIDV';
    amount.textContent = `Số tiền: ${currentTotal.toLocaleString('vi-VN')}đ`;
    modal.classList.add('active');

    // Gửi hóa đơn sau khi hiện QR
    processInvoice(type);
}

function closeQR() {
    document.getElementById('qrModal').classList.remove('active');
}

function showCashPayment() {
    const modal = document.getElementById('cashModal');
    document.getElementById('cashTotal').textContent = currentTotal.toLocaleString('vi-VN') + 'đ';
    document.getElementById('cashReceived').value = '';
    document.getElementById('changeAmount').textContent = 'Tiền thừa: 0đ';
    modal.classList.add('active');
}

function calculateChange() {
    const received = parseInt(document.getElementById('cashReceived').value) || 0;
    const change = received - currentTotal;
    const changeDiv = document.getElementById('changeAmount');
    
    if (change >= 0) {
        changeDiv.textContent = `Tiền thừa: ${change.toLocaleString('vi-VN')}đ`;
        changeDiv.style.color = '#06d6a0';
    } else {
        changeDiv.textContent = `Còn thiếu: ${Math.abs(change).toLocaleString('vi-VN')}đ`;
        changeDiv.style.color = '#ef476f';
    }
}

async function confirmCashPayment() {
    const received = parseInt(document.getElementById('cashReceived').value) || 0;
    
    if (received < currentTotal) {
        alert('Số tiền khách đưa chưa đủ!');
        return;
    }

    document.getElementById('cashModal').classList.remove('active');
    await processInvoice('cash', received);
}

function closeCash() {
    document.getElementById('cashModal').classList.remove('active');
}

async function processInvoice(paymentMethod, cashReceived = 0) {
    const itemsList = cart.map(item => 
        `${item.name} x${item.quantity} ${item.unit} = ${(item.price * item.quantity).toLocaleString('vi-VN')}đ`
    ).join('\n');

    const changeAmount = cashReceived - currentTotal;
    const paymentInfo = paymentMethod === 'cash' 
        ? `💵 Tiền mặt\nKhách đưa: ${cashReceived.toLocaleString('vi-VN')}đ\nTiền thừa: ${changeAmount.toLocaleString('vi-VN')}đ`
        : `📱 ${paymentMethod === 'viettel' ? 'ViettelMoney' : 'BIDV'}`;

    // Gửi webhook hóa đơn
    await sendDiscordWebhook(WEBHOOKS.invoice, {
        title: '🧾 HÓA ĐƠN BÁN HÀNG',
        color: 0x0077b6,
        fields: [
            { name: '👤 Nhân viên', value: currentUser.name, inline: true },
            { name: '⏰ Thời gian', value: new Date().toLocaleString('vi-VN'), inline: true },
            { name: '💳 Thanh toán', value: paymentInfo },
            { name: '🛒 Chi tiết', value: itemsList || 'Không có' },
            { name: '💰 Tổng tiền', value: `${currentTotal.toLocaleString('vi-VN')}đ`, inline: true },
            { name: '💵 Tiền thừa', value: `${changeAmount.toLocaleString('vi-VN')}đ`, inline: true }
        ],
        timestamp: new Date().toISOString()
    });

    // Gửi webhook nhận tiền
    await sendDiscordWebhook(WEBHOOKS.payment, {
        title: '💰 NHẬN TIỀN THÀNH CÔNG',
        color: 0x06d6a0,
        fields: [
            { name: '👤 Nhân viên', value: currentUser.name, inline: true },
            { name: '💳 Phương thức', value: paymentInfo.split('\n')[0], inline: true },
            { name: '💵 Số tiền', value: `${currentTotal.toLocaleString('vi-VN')}đ`, inline: true },
            { name: '⏰ Thời gian', value: new Date().toLocaleString('vi-VN') }
        ],
        timestamp: new Date().toISOString()
    });

    // Cập nhật tồn kho
    await updateStock();
    
    // Reset
    cart = [];
    updateCartDisplay();
    alert('✅ Thanh toán thành công!');
}

async function sendDiscordWebhook(url, embed) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Webhook error:', error);
    }
}

async function updateStock() {
    for (const item of cart) {
        const snap = await database.ref(`products/${item.id}`).once('value');
        const product = snap.val();
        if (product) {
            const newStock = product.stock - item.quantity;
            await database.ref(`products/${item.id}`).update({ 
                stock: Math.max(0, newStock) 
            });

            if (newStock <= 0) {
                await sendDiscordWebhook(WEBHOOKS.inventory, {
                    title: '⚠️ HẾT HÀNG',
                    color: 0xef476f,
                    fields: [
                        { name: 'Sản phẩm', value: product.name },
                        { name: 'Thời gian', value: new Date().toLocaleString('vi-VN') }
                    ]
                });
            }
        }
    }
}

function printInvoice() {
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    window.print();
}

// Enter key login
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen.style.display !== 'none') {
            login();
        }
    }
});
