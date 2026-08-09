// TSUBASA-Legacy フロントエンド (意図的にレガシーな素朴jQuery風実装)

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

function api(path, opts) {
  return fetch(path, opts).then(function (r) {
    return r.json().then(function (body) {
      if (!r.ok) { throw new Error(body.detail || "エラー"); }
      return body;
    });
  });
}

function setMsg(id, text, isError) {
  var el = $(id);
  el.textContent = text;
  el.className = isError ? "msgline error" : "msgline";
}

// ---------------- タブ切替 ----------------
$all(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    $all(".tab").forEach(function (t) { t.classList.remove("active"); });
    $all(".panel").forEach(function (p) { p.classList.add("hidden"); });
    tab.classList.add("active");
    $("#" + tab.dataset.panel).classList.remove("hidden");
  });
});

// ---------------- 時計 ----------------
setInterval(function () {
  $("#clock").textContent = new Date().toLocaleString("ja-JP");
}, 1000);

// ---------------- 航空 ----------------
function loadFlights() {
  api("/api/flights").then(function (flights) {
    var tbody = $("#tbl-flights tbody");
    tbody.innerHTML = "";
    var sel = $("#res-flight");
    sel.innerHTML = "";
    flights.forEach(function (f) {
      var cls = "";
      if (f.status.indexOf("遅延") === 0) { cls = "status-delay"; }
      if (f.status === "欠航") { cls = "status-cancel"; }
      tbody.innerHTML +=
        "<tr><td>" + f.flight_no + "</td><td>" + f.origin + "</td><td>" + f.dest +
        "</td><td>" + f.dep + "</td><td>" + f.arr + "</td><td>" + f.aircraft +
        "</td><td class='" + cls + "'>" + f.status + "</td><td>" +
        f.seats_booked + " / " + f.seats_total + "</td></tr>";
      sel.innerHTML += "<option>" + f.flight_no + "</option>";
    });
  });
}

function loadReservations() {
  api("/api/reservations").then(function (rows) {
    var tbody = $("#tbl-reservations tbody");
    tbody.innerHTML = "";
    rows.forEach(function (r) {
      tbody.innerHTML +=
        "<tr><td>" + r.pnr + "</td><td>" + r.name + "</td><td>" + r.flight_no +
        "</td><td>" + r["class"] + "</td><td>" + r.status + "</td><td>" + r.created + "</td></tr>";
    });
  });
}

$("#btn-reserve").addEventListener("click", function () {
  api("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: $("#res-name").value,
      flight_no: $("#res-flight").value,
      seat_class: $("#res-class").value,
    }),
  }).then(function (rec) {
    setMsg("#msg-air", "予約を登録しました。PNR: " + rec.pnr, false);
    loadFlights();
    loadReservations();
  }).catch(function (e) {
    setMsg("#msg-air", "エラー: " + e.message, true);
  });
});

// ---------------- 金融 ----------------
function loadAccounts() {
  api("/api/accounts").then(function (rows) {
    var tbody = $("#tbl-accounts tbody");
    tbody.innerHTML = "";
    var from = $("#tr-from");
    var to = $("#tr-to");
    from.innerHTML = "";
    to.innerHTML = "";
    rows.forEach(function (a) {
      tbody.innerHTML +=
        "<tr><td>" + a.account_no + "</td><td>" + a.name + "</td><td>" + a.type +
        "</td><td style='text-align:right'>" + a.balance.toLocaleString() +
        "</td><td>" + a.branch + "</td></tr>";
      from.innerHTML += "<option>" + a.account_no + "</option>";
      to.innerHTML += "<option>" + a.account_no + "</option>";
    });
  });
}

function loadTransactions() {
  api("/api/transactions").then(function (rows) {
    var tbody = $("#tbl-transactions tbody");
    tbody.innerHTML = "";
    rows.forEach(function (t) {
      tbody.innerHTML +=
        "<tr><td>" + t.id + "</td><td>" + t.date + "</td><td>" + t.from_no +
        "</td><td>" + t.to_no + "</td><td style='text-align:right'>" +
        t.amount.toLocaleString() + "</td><td>" + t.memo + "</td><td>" + t.status + "</td></tr>";
    });
  });
}

$("#btn-transfer").addEventListener("click", function () {
  api("/api/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_no: $("#tr-from").value,
      to_no: $("#tr-to").value,
      amount: parseInt($("#tr-amount").value, 10) || 0,
      memo: $("#tr-memo").value,
    }),
  }).then(function () {
    setMsg("#msg-bank", "振込が完了しました。", false);
    loadAccounts();
    loadTransactions();
  }).catch(function (e) {
    setMsg("#msg-bank", "エラー: " + e.message, true);
  });
});

// ---------------- 小売 ----------------
function loadInventory() {
  api("/api/inventory").then(function (rows) {
    var tbody = $("#tbl-inventory tbody");
    tbody.innerHTML = "";
    var sel = $("#sale-sku");
    sel.innerHTML = "";
    rows.forEach(function (i) {
      var warn = i.stock <= i.reorder_point;
      tbody.innerHTML +=
        "<tr><td>" + i.sku + "</td><td>" + i.name + "</td><td>" + i.category +
        "</td><td style='text-align:right'>" + i.price.toLocaleString() +
        "</td><td style='text-align:right'>" + i.stock +
        "</td><td style='text-align:right'>" + i.reorder_point +
        "</td><td class='" + (warn ? "status-warn" : "") + "'>" +
        (warn ? "要発注" : "適正") + "</td></tr>";
      sel.innerHTML += "<option value='" + i.sku + "'>" + i.sku + " " + i.name + "</option>";
    });
  });
}

function loadSales() {
  api("/api/sales").then(function (rows) {
    var tbody = $("#tbl-sales tbody");
    tbody.innerHTML = "";
    rows.forEach(function (s) {
      tbody.innerHTML +=
        "<tr><td>" + s.id + "</td><td>" + s.date + "</td><td>" + s.sku +
        "</td><td style='text-align:right'>" + s.qty + "</td><td>" + s.store + "</td></tr>";
    });
  });
}

$("#btn-sale").addEventListener("click", function () {
  api("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sku: $("#sale-sku").value,
      qty: parseInt($("#sale-qty").value, 10) || 0,
      store: $("#sale-store").value,
    }),
  }).then(function () {
    setMsg("#msg-retail", "売上を登録しました。", false);
    loadInventory();
    loadSales();
  }).catch(function (e) {
    setMsg("#msg-retail", "エラー: " + e.message, true);
  });
});

// 初期ロード
loadFlights();
loadReservations();
loadAccounts();
loadTransactions();
loadInventory();
loadSales();
