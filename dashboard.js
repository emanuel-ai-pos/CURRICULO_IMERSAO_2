const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const CHART_COLORS = {
  entrada: "#10b981",
  entradaBg: "rgba(16, 185, 129, 0.7)",
  saida: "#f43f5e",
  saidaBg: "rgba(244, 63, 94, 0.7)",
  accent: "#6366f1",
  accentBg: "rgba(99, 102, 241, 0.7)",
  grid: "rgba(255, 255, 255, 0.06)",
  text: "#8b95a8"
};

let chartInstances = [];

Chart.defaults.color = CHART_COLORS.text;
Chart.defaults.borderColor = CHART_COLORS.grid;
Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = values[i]?.trim(); });
    return {
      data: row.data,
      tipo: row.tipo_movimentacao,
      qtde: Number(row.qtde),
      custo: Number(row.custo_unitario),
      produto: row.codigo_produto
    };
  });
}

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function formatMonth(key) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[Number(month) - 1]}/${year.slice(2)}`;
}

function formatNumber(n) {
  return n.toLocaleString("pt-BR");
}

function formatCurrency(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function aggregateData(rows) {
  const monthly = {};
  let totalEntrada = 0;
  let totalSaida = 0;
  let totalValor = 0;
  const products = new Set();

  rows.forEach((row) => {
    const key = monthKey(row.data);
    if (!monthly[key]) {
      monthly[key] = { count: 0, entrada: 0, saida: 0, valorEntrada: 0, valorSaida: 0 };
    }

    const m = monthly[key];
    m.count += 1;
    const valor = row.qtde * row.custo;
    totalValor += valor;
    products.add(row.produto);

    if (row.tipo === "Entrada") {
      m.entrada += row.qtde;
      m.valorEntrada += valor;
      totalEntrada += row.qtde;
    } else {
      m.saida += row.qtde;
      m.valorSaida += valor;
      totalSaida += row.qtde;
    }
  });

  const months = Object.keys(monthly).sort();

  return {
    months,
    monthly,
    totals: {
      registros: rows.length,
      entrada: totalEntrada,
      saida: totalSaida,
      saldo: totalEntrada - totalSaida,
      valor: totalValor,
      produtos: products.size
    }
  };
}

function renderKPIs(totals) {
  const cards = [
    {
      label: "Movimentações",
      value: formatNumber(totals.registros),
      detail: "registros no período",
      variant: "purple"
    },
    {
      label: "Entradas",
      value: formatNumber(totals.entrada),
      detail: "unidades recebidas",
      variant: "green"
    },
    {
      label: "Saídas",
      value: formatNumber(totals.saida),
      detail: "unidades expedidas",
      variant: "red"
    },
    {
      label: "Saldo líquido",
      value: (totals.saldo >= 0 ? "+" : "") + formatNumber(totals.saldo),
      detail: "unidades (entrada − saída)",
      variant: totals.saldo >= 0 ? "green" : "red"
    },
    {
      label: "Valor total",
      value: formatCurrency(totals.valor),
      detail: "volume financeiro",
      variant: "amber",
      small: true
    },
    {
      label: "Produtos",
      value: formatNumber(totals.produtos),
      detail: "códigos distintos",
      variant: "blue"
    }
  ];

  document.getElementById("kpiGrid").innerHTML = cards.map((c) => `
    <div class="kpi-card kpi-card--${c.variant}">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value${c.small ? " kpi-value--sm" : ""}">${c.value}</div>
      <div class="kpi-detail">${c.detail}</div>
    </div>
  `).join("");
}

function renderTable(months, monthly) {
  const tbody = document.getElementById("summaryBody");
  tbody.innerHTML = months.map((key) => {
    const m = monthly[key];
    const saldo = m.entrada - m.saida;
    const valor = m.valorEntrada + m.valorSaida;
    const saldoClass = saldo > 0 ? "td-positive" : saldo < 0 ? "td-negative" : "td-neutral";
    const saldoText = (saldo > 0 ? "+" : "") + formatNumber(saldo);

    return `
      <tr>
        <td><strong>${formatMonth(key)}</strong></td>
        <td>${formatNumber(m.count)}</td>
        <td>${formatNumber(m.entrada)}</td>
        <td>${formatNumber(m.saida)}</td>
        <td class="${saldoClass}">${saldoText}</td>
        <td>${formatCurrency(valor)}</td>
      </tr>
    `;
  }).join("");
}

function buildCharts(months, monthly, totals) {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];

  const labels = months.map(formatMonth);
  const entradas = months.map((k) => monthly[k].entrada);
  const saidas = months.map((k) => monthly[k].saida);
  const counts = months.map((k) => monthly[k].count);
  const saldos = months.map((k) => monthly[k].entrada - monthly[k].saida);
  const valoresEntrada = months.map((k) => monthly[k].valorEntrada);
  const valoresSaida = months.map((k) => monthly[k].valorSaida);

  const tooltipStyle = {
    backgroundColor: "#1a2235",
    titleColor: "#f0f4fc",
    bodyColor: "#8b95a8",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8
  };

  chartInstances.push(new Chart(document.getElementById("chartQuantidade"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Entradas",
          data: entradas,
          backgroundColor: CHART_COLORS.entradaBg,
          borderColor: CHART_COLORS.entrada,
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: "Saídas",
          data: saidas,
          backgroundColor: CHART_COLORS.saidaBg,
          borderColor: CHART_COLORS.saida,
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", align: "end" },
        tooltip: tooltipStyle
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { callback: (v) => formatNumber(v) } }
      }
    }
  });

  chartInstances.push(new Chart(document.getElementById("chartMovimentacoes"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Movimentações",
        data: counts,
        borderColor: CHART_COLORS.accent,
        backgroundColor: "rgba(99, 102, 241, 0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: CHART_COLORS.accent
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 10 } }
      }
    }
  });

  chartInstances.push(new Chart(document.getElementById("chartProporcao"), {
    type: "doughnut",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{
        data: [totals.entrada, totals.saida],
        backgroundColor: [CHART_COLORS.entrada, CHART_COLORS.saida],
        borderColor: "#131927",
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (ctx) => {
              const total = totals.entrada + totals.saida;
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${formatNumber(ctx.raw)} un. (${pct}%)`;
            }
          }
        }
      }
    }
  });

  chartInstances.push(new Chart(document.getElementById("chartValor"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Valor entradas",
          data: valoresEntrada,
          backgroundColor: CHART_COLORS.entradaBg,
          borderColor: CHART_COLORS.entrada,
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: "Valor saídas",
          data: valoresSaida,
          backgroundColor: CHART_COLORS.saidaBg,
          borderColor: CHART_COLORS.saida,
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", align: "end" },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => "R$ " + (v / 1000).toFixed(0) + "k"
          }
        }
      }
    }
  });

  chartInstances.push(new Chart(document.getElementById("chartSaldo"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Saldo",
        data: saldos,
        backgroundColor: saldos.map((v) =>
          v >= 0 ? CHART_COLORS.entradaBg : CHART_COLORS.saidaBg
        ),
        borderColor: saldos.map((v) =>
          v >= 0 ? CHART_COLORS.entrada : CHART_COLORS.saida
        ),
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (ctx) => {
              const sign = ctx.raw >= 0 ? "+" : "";
              return ` Saldo: ${sign}${formatNumber(ctx.raw)} un.`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: { callback: (v) => formatNumber(v) }
        }
      }
    }
  });
}

async function loadCSV() {
  const res = await fetch("movimentacao_estoque_ficticia.csv");
  if (!res.ok) throw new Error("Arquivo CSV não encontrado.");
  return res.text();
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsText(file, "UTF-8");
  });
}

function renderDashboard(csvText) {
  const rows = parseCSV(csvText);
  const { months, monthly, totals } = aggregateData(rows);

  renderKPIs(totals);
  renderTable(months, monthly);
  buildCharts(months, monthly, totals);
}

async function init() {
  const upload = document.getElementById("csvUpload");

  upload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const csvText = await readFileAsText(file);
      document.querySelector(".file-name").textContent = file.name;
      renderDashboard(csvText);
    } catch (err) {
      alert(err.message);
    }
  });

  try {
    const csvText = await loadCSV();
    renderDashboard(csvText);
  } catch {
    document.querySelector(".badge-live").textContent = "Aguardando CSV";
    document.querySelector(".badge-live").style.color = "#f59e0b";
    document.querySelector(".badge-live").style.background = "rgba(245, 158, 11, 0.15)";
    document.querySelector(".badge-live").style.borderColor = "rgba(245, 158, 11, 0.3)";
    upload.click();
  }
}

init();
