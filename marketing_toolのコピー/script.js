document.getElementById("analyzeBtn").addEventListener("click", () => {
  const google = {
    name: "Google",
    cost: Number(document.getElementById("gCost").value),
    sales: Number(document.getElementById("gSales").value),
    clicks: Number(document.getElementById("gClicks").value),
    imp: Number(document.getElementById("gImp").value),
    cv: Number(document.getElementById("gCv").value)
  };

  const meta = {
    name: "Meta",
    cost: Number(document.getElementById("mCost").value),
    roasInput: Number(document.getElementById("mRoas").value),
    clicks: Number(document.getElementById("mClicks").value),
    imp: Number(document.getElementById("mImp").value),
    cv: Number(document.getElementById("mCv").value)
  };

  const prev = {
    cost: Number(document.getElementById("prevCost").value),
    sales: Number(document.getElementById("prevSales").value),
    clicks: Number(document.getElementById("prevClicks").value),
    imp: Number(document.getElementById("prevImp").value),
    cv: Number(document.getElementById("prevCv").value)
  };

  const memo = document.getElementById("memo").value.trim();

  if (
    !google.cost || !google.sales || !google.clicks || !google.imp || !google.cv ||
    !meta.cost || !meta.roasInput || !meta.clicks || !meta.imp || !meta.cv
  ) {
    document.getElementById("summary").innerText = "Google / Meta の今週数値をすべて入力してください。";
    document.getElementById("result").innerHTML = "";
    document.getElementById("comparisonCards").innerHTML = "";
    document.getElementById("memoDisplay").innerText = memo || "施策メモはまだありません。";
    return;
  }

  google.ctr = google.clicks / google.imp;
  google.roas = google.sales / google.cost;
  google.cpa = google.cost / google.cv;
  google.unitPrice = google.sales / google.cv;
  google.costRatio = google.cost / google.sales;

  meta.roas = meta.roasInput;
  meta.sales = meta.cost * meta.roas;
  meta.ctr = meta.clicks / meta.imp;
  meta.cpa = meta.cost / meta.cv;
  meta.unitPrice = meta.sales / meta.cv;
  meta.costRatio = meta.cost / meta.sales;

  const total = {
    name: "Total",
    cost: google.cost + meta.cost,
    sales: google.sales + meta.sales,
    clicks: google.clicks + meta.clicks,
    imp: google.imp + meta.imp,
    cv: google.cv + meta.cv
  };

  total.ctr = total.clicks / total.imp;
  total.roas = total.sales / total.cost;
  total.cpa = total.cost / total.cv;
  total.unitPrice = total.sales / total.cv;
  total.costRatio = total.cost / total.sales;

  renderChannelCards([google, meta, total]);
  renderComparisonCards(total, prev);
  renderSummary(google, meta, total, prev);
  document.getElementById("memoDisplay").innerText = memo || "施策メモはまだありません。";
});

function renderChannelCards(channels) {
  const result = document.getElementById("result");
  result.innerHTML = "";

  channels.forEach(channel => {
    const card = document.createElement("div");
    card.className = `report-card ${channel.name === "Total" ? "highlight-card" : ""}`;

    card.innerHTML = `
      <div class="report-card-head">
        <div class="report-title">${channel.name}</div>
        <div class="report-sub">${channel.name === "Meta" ? "売上はROASから逆算" : "売上ベース"}</div>
      </div>

      <div class="metric-list">
        ${metricRow("広告費", `${formatNumber(channel.cost)}円`)}
        ${metricRow("売上", `${formatNumber(channel.sales)}円`)}
        ${metricRow("売上広告費用割合", `${(channel.costRatio * 100).toFixed(2)}%`, getStatusClassByCostRatio(channel.costRatio))}
        ${metricRow("クリック数", `${formatNumber(channel.clicks)}`)}
        ${metricRow("imp", `${formatNumber(channel.imp)}`)}
        ${metricRow("CTR", `${(channel.ctr * 100).toFixed(2)}%`, getStatusClassByCtr(channel.ctr))}
        ${metricRow("CV数", `${formatNumber(channel.cv)}`)}
        ${metricRow("客単価", `${formatNumber(Math.round(channel.unitPrice))}円`)}
        ${metricRow("ROAS", `${channel.roas.toFixed(2)}`, getStatusClassByRoas(channel.roas))}
        ${metricRow("CPA", `${formatNumber(Math.round(channel.cpa))}円`, getStatusClassByCpa(channel.cpa))}
      </div>
    `;

    result.appendChild(card);
  });
}

function metricRow(label, value, statusClass = "") {
  return `
    <div class="metric-row">
      <span class="metric-label">${label}</span>
      <span class="metric-value ${statusClass}">${value}</span>
    </div>
  `;
}

function renderComparisonCards(total, prev) {
  const container = document.getElementById("comparisonCards");

  if (!prev.cost || !prev.sales || !prev.clicks || !prev.imp || !prev.cv) {
    container.innerHTML = `<div class="empty-card">先週の数値を入力すると、今週合算との比較が表示されます。</div>`;
    return;
  }

  const prevCtr = prev.clicks / prev.imp;
  const prevRoas = prev.sales / prev.cost;
  const prevCpa = prev.cost / prev.cv;

  const items = [
    buildComparisonItem("広告費", total.cost, prev.cost, "円", false, true),
    buildComparisonItem("売上", total.sales, prev.sales, "円"),
    buildComparisonItem("クリック数", total.clicks, prev.clicks, ""),
    buildComparisonItem("imp", total.imp, prev.imp, ""),
    buildComparisonItem("CV数", total.cv, prev.cv, ""),
    buildComparisonItem("CTR", total.ctr * 100, prevCtr * 100, "%"),
    buildComparisonItem("ROAS", total.roas, prevRoas, ""),
    buildComparisonItem("CPA", total.cpa, prevCpa, "円", false, true)
  ];

  container.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = `compare-card ${item.status}`;
    card.innerHTML = `
      <div class="compare-label">${item.label}</div>
      <div class="compare-value">${item.value}</div>
      <div class="compare-sub">${item.sub}</div>
    `;
    container.appendChild(card);
  });
}

function buildComparisonItem(label, current, previous, unit = "", integer = true, reverseGood = false) {
  const diff = current - previous;
  const rate = ((diff / previous) * 100);

  let status = "neutral";
  if (reverseGood) {
    status = diff < 0 ? "good" : diff > 0 ? "bad" : "neutral";
  } else {
    status = diff > 0 ? "good" : diff < 0 ? "bad" : "neutral";
  }

  let value = "";
  if (unit === "%") {
    value = `${current.toFixed(2)}%`;
  } else if (unit === "円") {
    value = `${formatNumber(Math.round(current))}円`;
  } else if (!integer) {
    value = `${current.toFixed(2)}`;
  } else {
    value = `${formatNumber(Math.round(current))}`;
  }

  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";

  return {
    label,
    value,
    sub: `先週比 ${arrow} ${Math.abs(rate).toFixed(1)}%`,
    status
  };
}

function renderSummary(google, meta, total, prev) {
  const lines = [];

  if (google.roas > meta.roas) {
    lines.push(`GoogleのROAS（${google.roas.toFixed(2)}）がMeta（${meta.roas.toFixed(2)}）を上回っており、現状はGoogleの方が効率優位です。`);
  } else if (google.roas < meta.roas) {
    lines.push(`MetaのROAS（${meta.roas.toFixed(2)}）がGoogle（${google.roas.toFixed(2)}）を上回っており、現状はMetaの方が効率優位です。`);
  } else {
    lines.push("GoogleとMetaのROASは同水準です。");
  }

  if (total.roas >= 3) {
    lines.push(`全体ROASは${total.roas.toFixed(2)}で良好水準です。`);
  } else if (total.roas < 2) {
    lines.push(`全体ROASは${total.roas.toFixed(2)}で弱めのため、配信設計や訴求見直し余地があります。`);
  } else {
    lines.push(`全体ROASは${total.roas.toFixed(2)}で標準水準です。`);
  }

  if (total.ctr < 0.01) {
    lines.push(`CTRは${(total.ctr * 100).toFixed(2)}%で低めのため、クリエイティブ改善余地があります。`);
  } else {
    lines.push(`CTRは${(total.ctr * 100).toFixed(2)}%で一定水準を確保しています。`);
  }

  if (total.cpa > 3000) {
    lines.push(`CPAは${formatNumber(Math.round(total.cpa))}円で高めです。獲得効率の改善が必要です。`);
  } else {
    lines.push(`CPAは${formatNumber(Math.round(total.cpa))}円で許容範囲です。`);
  }

  if (prev.cost && prev.sales && prev.clicks && prev.imp && prev.cv) {
    const prevRoas = prev.sales / prev.cost;
    const prevCpa = prev.cost / prev.cv;
    const salesDiff = ((total.sales - prev.sales) / prev.sales) * 100;
    const roasDiff = ((total.roas - prevRoas) / prevRoas) * 100;
    const cpaDiff = ((total.cpa - prevCpa) / prevCpa) * 100;

    lines.push(
      `先週比では、売上 ${getDirectionText(salesDiff)} ${Math.abs(salesDiff).toFixed(1)}%、ROAS ${getDirectionText(roasDiff)} ${Math.abs(roasDiff).toFixed(1)}%、CPA ${getDirectionText(cpaDiff)} ${Math.abs(cpaDiff).toFixed(1)}% です。`
    );
  }

  document.getElementById("summary").innerText = lines.join("\n");
}

function getDirectionText(value) {
  if (value > 0) return "増加";
  if (value < 0) return "減少";
  return "同水準";
}

function getStatusClassByRoas(roas) {
  if (roas >= 3) return "good-text";
  if (roas < 2) return "bad-text";
  return "normal-text";
}

function getStatusClassByCpa(cpa) {
  if (cpa <= 3000) return "good-text";
  if (cpa > 5000) return "bad-text";
  return "normal-text";
}

function getStatusClassByCtr(ctr) {
  if (ctr >= 0.01) return "good-text";
  if (ctr < 0.005) return "bad-text";
  return "normal-text";
}

function getStatusClassByCostRatio(costRatio) {
  if (costRatio <= 0.2) return "good-text";
  if (costRatio > 0.35) return "bad-text";
  return "normal-text";
}

function formatNumber(num) {
  return Number(num).toLocaleString();
}