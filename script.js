/* =========================================================
   DAPUR MOMS – script.js
   Semua pengaturan yang sering diganti ada di bagian CONFIG
   dan MENU di bawah ini.
   ========================================================= */

/* ---------- 1. PENGATURAN USAHA (mudah diganti) ---------- */
const CONFIG = {
  brandName: "Dapur Moms",                 // nama usaha
  whatsappNumber: "62859191551086",         // GANTI: format internasional tanpa +, 0, atau spasi. Contoh: 6281234567890
  address: "bukit kemunin,lampung utara",     // GANTI dengan alamat usaha Anda
  hours: "Senen-sabtu, 7.00 – 17.00 WIB",// GANTI jam operasional
  instagramUrl: "https://www.instagram.com/dapurmoms_23?obrf=MXYzaW0yM3V3OTJjYg==/",  // GANTI dengan link Instagram Anda
  instagramHandle: "@dapurmoms_23 ",      // GANTI nama akun Instagram
  currency: "Rp",
  storageKey: "dapur-moms-cart"            // kunci penyimpanan keranjang di browser
};

/* ---------- 2. DAFTAR MENU (mudah diedit) ----------
   price : harga contoh (angka, tanpa titik). Isi null jika "Harga belum ditentukan".
   image : letakkan foto di folder "images/" lalu tulis nama filenya di sini.
   cats  : "berat" | "pedas" | "camilan"
   badge : "Best Seller" | "Favorit" | "" (kosong)
*/
const MENU = [
  { id: "ayam-geprek", name: "Ayam Geprek", emoji: "🍗",
    desc: "Ayam renyah dengan sambal pedas yang menggugah selera.",
    price: 13000, cats: ["berat", "pedas"], badge: "Best Seller", image: "images/ayam-geprek.jpg" },
  { id: "rice-bowl", name: "Rice Bowl", emoji: "🍚",
    desc: "Nasi dengan lauk ayam dan pilihan saus atau topping.",
    price: 15000, cats: ["berat"], badge: "", image: "images/rice-bowl.jpg" },
  { id: "ayam ketumbar", name: "Ayam ketumbar", emoji: "🍖",
    desc: "Pilihan hidangan ayam dengan bumbu dan saus yang lezat.",
    price: 15000, cats: ["berat"], badge: "", image: "images/aneka-olahan-ayam.jpg" },
  { id: "mie-jebew", name: "Mie Jebew", emoji: "🍜",
    desc: "Mi pedas dengan bumbu gurih dan topping pilihan.",
    price: 10000, cats: ["berat", "pedas"], badge: "Favorit", image: "images/mie-jebew.jpg" },
  { id: "cireng-jontor", name: "Cireng Jontor", emoji: "🥟",
    desc: "Cireng renyah dengan sensasi pedas.",
    price: 10000, cats: ["camilan", "pedas"], badge: "", image: "images/cireng-jontor.jpg" },
  { id: "pangsit-chili-oil", name: "Pangsit Chili Oil", emoji: "🥠",
    desc: "Pangsit dengan saus chili oil gurih dan pedas.",
    price: 10000, cats: ["camilan", "pedas"], badge: "Favorit", image: "images/pangsit-chili-oil.jpg" },
  { id: "dimsum-goreng-keju", name: "Dimsum Goreng Keju", emoji: "🧀",
    desc: "Dimsum goreng renyah dengan isian atau topping keju.",
    price: 10000, cats: ["camilan"], badge: "", image: "images/dimsum-goreng-keju.jpg" }
];

const CATEGORIES = [
  { key: "semua", label: "Semua Menu" },
  { key: "berat", label: "Makanan Berat" },
  { key: "pedas", label: "Makanan Pedas" },
  { key: "camilan", label: "Camilan" },
  { key: "favorit", label: "Menu Favorit" }
];

/* ---------- 3. STATE ---------- */
let cart = [];                 // [{ id, qty }]
let activeCategory = "semua";
let searchTerm = "";
const cardQty = {};            // jumlah sementara di kartu menu

/* ---------- 4. UTILITAS ---------- */
const $ = (sel) => document.querySelector(sel);
const rupiah = (n) => CONFIG.currency + " " + Number(n).toLocaleString("id-ID");
const findItem = (id) => MENU.find((m) => m.id === id);
const priceOf = (item) => (typeof item.price === "number" ? item.price : 0);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Gambar cadangan (SVG) bila foto gagal dimuat */
function placeholder(name, emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#d62828"/></linearGradient></defs>
    <rect width="600" height="450" fill="url(#g)"/>
    <text x="300" y="240" font-size="130" text-anchor="middle">${emoji || "🍽️"}</text>
    <text x="300" y="330" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${esc(name || "Menu")}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && !img.dataset.fb) {
    img.dataset.fb = "1";
    img.src = placeholder(img.dataset.name, img.dataset.emoji);
  }
}, true);

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- 5. PENYIMPANAN KERANJANG ---------- */
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]");
    cart = saved.filter((c) => findItem(c.id) && c.qty > 0);
  } catch (e) { cart = []; }
}
function saveCart() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart)); } catch (e) { /* abaikan */ }
}

/* ---------- 6. RENDER MENU ---------- */
function priceHtml(item) {
  return typeof item.price === "number"
    ? `<div class="price">${rupiah(item.price)}<small>harga contoh</small></div>`
    : `<div class="price"><small>Harga belum ditentukan</small></div>`;
}

function matchesCategory(item) {
  if (activeCategory === "semua") return true;
  if (activeCategory === "favorit") return item.badge === "Best Seller" || item.badge === "Favorit";
  return item.cats.includes(activeCategory);
}

function renderFilters() {
  $("#filters").innerHTML = CATEGORIES.map((c) =>
    `<button class="filter-btn ${c.key === activeCategory ? "active" : ""}" data-cat="${c.key}" aria-pressed="${c.key === activeCategory}">${c.label}</button>`
  ).join("");
}

function renderMenu() {
  const q = searchTerm.trim().toLowerCase();
  const list = MENU.filter((m) => matchesCategory(m) && m.name.toLowerCase().includes(q));
  $("#menu-grid").innerHTML = list.map((m, i) => {
    const qty = cardQty[m.id] || 1;
    const badge = m.badge ? `<span class="badge ${m.badge === "Best Seller" ? "best" : "fav"}">${m.badge === "Best Seller" ? "🔥 " : "❤ "}${m.badge}</span>` : "";
    return `
    <article class="card" style="animation-delay:${i * 60}ms">
      <div class="card-img">
        <img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy" data-name="${esc(m.name)}" data-emoji="${m.emoji}" />
        ${badge}
      </div>
      <div class="card-body">
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.desc)}</p>
        ${priceHtml(m)}
        <div class="card-actions">
          <div class="qty" role="group" aria-label="Jumlah ${esc(m.name)}">
            <button data-act="card-minus" data-id="${m.id}" aria-label="Kurangi jumlah">−</button>
            <span id="cq-${m.id}">${qty}</span>
            <button data-act="card-plus" data-id="${m.id}" aria-label="Tambah jumlah">+</button>
          </div>
          <button class="btn btn-primary" data-act="add" data-id="${m.id}">Pesan</button>
        </div>
      </div>
    </article>`;
  }).join("");
  $("#empty").hidden = list.length > 0;
}

function renderFavorites() {
  const favs = MENU.filter((m) => m.badge).slice(0, 3);
  $("#fav-grid").innerHTML = favs.map((m) => `
    <article class="fav-card">
      <img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy" data-name="${esc(m.name)}" data-emoji="${m.emoji}" />
      <div>
        <h3>${esc(m.name)}</h3>
        <small>${m.badge}</small>
      </div>
      <button class="btn btn-primary" data-act="add-one" data-id="${m.id}">+ Pesan</button>
    </article>`).join("");
}

/* ---------- 7. LOGIKA KERANJANG ---------- */
function addToCart(id, qty) {
  const found = cart.find((c) => c.id === id);
  if (found) found.qty += qty; else cart.push({ id, qty });
  saveCart();
  renderCart();
  toast(`✅ ${findItem(id).name} (${qty}) ditambahkan ke keranjang`);
}

function changeQty(id, delta) {
  const found = cart.find((c) => c.id === id);
  if (!found) return;
  found.qty += delta;
  if (found.qty <= 0) cart = cart.filter((c) => c.id !== id);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
  renderCart();
}

function cartTotals() {
  let count = 0, total = 0;
  cart.forEach((c) => { count += c.qty; total += c.qty * priceOf(findItem(c.id)); });
  return { count, total };
}

function renderCart() {
  const box = $("#cart-items");
  box.innerHTML = cart.map((c) => {
    const m = findItem(c.id);
    const sub = c.qty * priceOf(m);
    const unit = typeof m.price === "number" ? rupiah(m.price) : "Harga belum ditentukan";
    return `
    <div class="cart-item">
      <img src="${esc(m.image)}" alt="" data-name="${esc(m.name)}" data-emoji="${m.emoji}" />
      <div>
        <h4>${esc(m.name)}</h4>
        <div class="unit">${unit} / porsi</div>
        <div class="qty">
          <button data-act="cart-minus" data-id="${m.id}" aria-label="Kurangi ${esc(m.name)}">−</button>
          <span>${c.qty}</span>
          <button data-act="cart-plus" data-id="${m.id}" aria-label="Tambah ${esc(m.name)}">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <button class="remove" data-act="remove" data-id="${m.id}" aria-label="Hapus ${esc(m.name)}">🗑</button>
        <div class="sub">${rupiah(sub)}</div>
      </div>
    </div>`;
  }).join("");

  const { count, total } = cartTotals();
  $("#cart-empty").hidden = cart.length > 0;
  $("#cart-total").textContent = rupiah(total);
  $("#cart-count").textContent = count;
  $("#fab-count").textContent = count;
  $("#fab-total").textContent = rupiah(total);
  $("#fab-cart").classList.toggle("show", count > 0);
}

/* ---------- 8. DRAWER KERANJANG ---------- */
function openCart() {
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#overlay").hidden = false;
  document.body.style.overflow = "hidden";
  $("#close-cart").focus();
}
function closeCart() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#overlay").hidden = true;
  document.body.style.overflow = "";
}

/* ---------- 9. WHATSAPP ---------- */
function validWhatsApp() { return /^\d{9,15}$/.test(CONFIG.whatsappNumber); }

function waLink(text) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function sendWhatsApp() {
  const name = $("#cust-name").value.trim();
  const address = $("#cust-address").value.trim();
  const note = $("#cust-note").value.trim();
  const err = $("#form-error");
  err.hidden = true;

  if (cart.length === 0) { err.textContent = "Keranjang masih kosong."; err.hidden = false; return; }
  if (!name) { err.textContent = "Mohon isi nama pelanggan."; err.hidden = false; $("#cust-name").focus(); return; }
  if (!address) { err.textContent = "Mohon isi alamat pengiriman."; err.hidden = false; $("#cust-address").focus(); return; }
  if (!validWhatsApp()) {
    err.textContent = "Nomor WhatsApp pemilik belum diatur. Ubah whatsappNumber di script.js.";
    err.hidden = false; return;
  }

  const lines = cart.map((c, i) => {
    const m = findItem(c.id);
    const price = typeof m.price === "number" ? `${rupiah(m.price)} x ${c.qty} = ${rupiah(m.price * c.qty)}` : `${c.qty} porsi (harga belum ditentukan)`;
    return `${i + 1}. ${m.name} – ${price}`;
  });
  const { total } = cartTotals();
  const msg =
`Halo ${CONFIG.brandName}, saya ingin memesan:

${lines.join("\n")}

*Total: ${rupiah(total)}*

Nama: ${name}
Alamat: ${address}
Catatan: ${note || "-"}

Terima kasih!`;

  window.open(waLink(msg), "_blank", "noopener");
}

/* ---------- 10. KONTAK & BRAND ---------- */
function fillContact() {
  document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = CONFIG.brandName));
  document.title = `${CONFIG.brandName} – Jajanan Kekinian Enak & Terjangkau`;
  $("#c-address").textContent = CONFIG.address;
  $("#c-hours").textContent = CONFIG.hours;
  $("#c-ig").textContent = CONFIG.instagramHandle;
  $("#c-ig").href = CONFIG.instagramUrl;
  $("#c-wa").textContent = validWhatsApp() ? "+" + CONFIG.whatsappNumber : "Nomor belum diatur";
  const btn = $("#c-wa-btn");
  if (validWhatsApp()) {
    btn.href = waLink(`Halo ${CONFIG.brandName}, saya ingin memesan.`);
  } else {
    btn.href = "#";
    btn.addEventListener("click", (e) => { e.preventDefault(); toast("Nomor WhatsApp belum diatur di script.js"); });
  }
  $("#year").textContent = new Date().getFullYear();
}

/* ---------- 11. EVENT ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act], [data-cat]");
  if (!el) return;

  if (el.dataset.cat) {
    activeCategory = el.dataset.cat;
    renderFilters(); renderMenu(); return;
  }
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "card-plus":  cardQty[id] = Math.min((cardQty[id] || 1) + 1, 99); $("#cq-" + id).textContent = cardQty[id]; break;
    case "card-minus": cardQty[id] = Math.max((cardQty[id] || 1) - 1, 1);  $("#cq-" + id).textContent = cardQty[id]; break;
    case "add":        addToCart(id, cardQty[id] || 1); cardQty[id] = 1; $("#cq-" + id).textContent = 1; break;
    case "add-one":    addToCart(id, 1); break;
    case "cart-plus":  changeQty(id, 1); break;
    case "cart-minus": changeQty(id, -1); break;
    case "remove":     removeFromCart(id); break;
  }
});

$("#search").addEventListener("input", (e) => { searchTerm = e.target.value; renderMenu(); });
$("#open-cart").addEventListener("click", openCart);
$("#fab-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);
$("#send-wa").addEventListener("click", sendWhatsApp);
$("#clear-cart").addEventListener("click", () => { if (cart.length && confirm("Kosongkan keranjang?")) { cart = []; saveCart(); renderCart(); } });
$("#order-form").addEventListener("submit", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

/* Navbar mobile */
const burger = $("#burger"), navMenu = $("#nav-menu");
burger.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
navMenu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") { navMenu.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
});

/* Tombol kembali ke atas */
const toTop = $("#to-top");
window.addEventListener("scroll", () => { toTop.hidden = window.scrollY < 500; }, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- 12. MULAI ---------- */
loadCart();
fillContact();
renderFilters();
renderFavorites();
renderMenu();
renderCart();
