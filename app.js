const state = {
  results: [],
  boardDateIndex: 0
};

const dreams = [
  ["00", "Huevos"], ["01", "Agua"], ["02", "Niño"], ["03", "San Cono"],
  ["04", "La Cama"], ["05", "Gato"], ["06", "Perro"], ["07", "Revolver"],
  ["08", "Incendio"], ["09", "Arroyo"], ["10", "Cañon"], ["11", "Minero"],
  ["12", "Soldado"], ["13", "La Yeta"], ["14", "Borracho"], ["15", "Niña Bonita"],
  ["16", "Anillo"], ["17", "Desgracia"], ["18", "Sangre"], ["19", "Pescado"],
  ["20", "La Fiesta"], ["21", "Mujer"], ["22", "Loco"], ["23", "Cocinero"],
  ["24", "Caballo"], ["25", "Gallina"], ["26", "La Misa"], ["27", "El Peine"],
  ["28", "El Cerro"], ["29", "San Pedro"], ["30", "Santa Rosa"], ["31", "La Luz"],
  ["32", "Dinero"], ["33", "Cristo"], ["34", "La Cabeza"], ["35", "Pajarito"],
  ["36", "Castañas"], ["37", "Eucaliptus"], ["38", "Piedras"], ["39", "Lluvia"],
  ["40", "El Cura"], ["41", "El Cuchillo"], ["42", "Zapatillas"], ["43", "Balcón"],
  ["44", "La Carcel"], ["45", "El Vino"], ["46", "Tomates"], ["47", "Muerto"],
  ["48", "Muerto que Habla"], ["49", "La Carne"], ["50", "El Pan"], ["51", "Serrucho"],
  ["52", "Madre e Hijo"], ["53", "El Barco"], ["54", "La Vaca"], ["55", "La Música"],
  ["56", "La Caída"], ["57", "El Jorobado"], ["58", "Ahogado"], ["59", "Las Plantas"],
  ["60", "La Virgen"], ["61", "Escopeta"], ["62", "Inundación"], ["63", "Casamiento"],
  ["64", "Llanto"], ["65", "El Cazador"], ["66", "Lombriz"], ["67", "Mordida"],
  ["68", "Sobrinos"], ["69", "Vicios"], ["70", "Muerto Sueño"], ["71", "Excremento"],
  ["72", "Sorpresa"], ["73", "Hospital"], ["74", "Gente Negra"], ["75", "Los Besos"],
  ["76", "Las Llamas"], ["77", "Piernas de Mujer"], ["78", "Ramera"], ["79", "Ladrón"],
  ["80", "La Bocha"], ["81", "Las Flores"], ["82", "La Pelea"], ["83", "Mal Tiempo"],
  ["84", "La Iglesia"], ["85", "Linterna"], ["86", "El Humo"], ["87", "Piojos"],
  ["88", "El Papa"], ["89", "La Rata"], ["90", "El Miedo"], ["91", "Excusado"],
  ["92", "El Médico"], ["93", "Enamorado"], ["94", "Cementerio"], ["95", "Anteojos"],
  ["96", "Marido"], ["97", "Mesa"], ["98", "Lavandera"], ["99", "Hermano"]
].map(([number, name]) => ({ number, name }));

const els = {
  status: document.querySelector("#status"),
  fromDate: document.querySelector("#fromDate"),
  toDate: document.querySelector("#toDate"),
  importBtn: document.querySelector("#importBtn"),
  officialBtn: document.querySelector("#officialBtn"),
  officialText: document.querySelector("#officialText"),
  pasteBtn: document.querySelector("#pasteBtn"),
  dreamInput: document.querySelector("#dreamInput"),
  dreamBtn: document.querySelector("#dreamBtn"),
  dreamResult: document.querySelector("#dreamResult"),
  dreamPosterBtn: document.querySelector("#dreamPosterBtn"),
  weekTop: document.querySelector("#weekTop"),
  weekTopLabel: document.querySelector("#weekTopLabel"),
  monthTop: document.querySelector("#monthTop"),
  monthTopLabel: document.querySelector("#monthTopLabel"),
  todayTop: document.querySelector("#todayTop"),
  todayTopLabel: document.querySelector("#todayTopLabel"),
  witchCard: document.querySelector("#witchCard"),
  luckyNumber: document.querySelector("#luckyNumber"),
  boardDate: document.querySelector("#boardDate"),
  drawCards: document.querySelector("#drawCards"),
  prevDayBtn: document.querySelector("#prevDayBtn"),
  nextDayBtn: document.querySelector("#nextDayBtn"),
  manualForm: document.querySelector("#manualForm"),
  manualDate: document.querySelector("#manualDate"),
  manualTurn: document.querySelector("#manualTurn"),
  manualPosition: document.querySelector("#manualPosition"),
  manualNumber: document.querySelector("#manualNumber"),
  checkNumber: document.querySelector("#checkNumber"),
  checkFrom: document.querySelector("#checkFrom"),
  checkTo: document.querySelector("#checkTo"),
  checkBtn: document.querySelector("#checkBtn"),
  checkResult: document.querySelector("#checkResult"),
  rangeFilter: document.querySelector("#rangeFilter"),
  turnFilter: document.querySelector("#turnFilter"),
  dayFilter: document.querySelector("#dayFilter"),
  positionFilter: document.querySelector("#positionFilter"),
  comboBtn: document.querySelector("#comboBtn"),
  ranking: document.querySelector("#ranking"),
  combo: document.querySelector("#combo"),
  countLabel: document.querySelector("#countLabel")
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchDream() {
  const query = normalizeText(els.dreamInput.value);
  if (!query) {
    els.dreamResult.textContent = "Escribí una palabra del sueño y te digo el número.";
    return;
  }

  const matches = dreams.filter(item => {
    const name = normalizeText(item.name);
    return name.includes(query) || query.includes(name);
  });

  if (!matches.length) {
    els.dreamResult.innerHTML = `No encontré <strong>?</strong> <small>Probá con otra palabra del afiche.</small>`;
    return;
  }

  els.dreamResult.innerHTML = matches.slice(0, 4).map(item =>
    `<strong>${item.number}</strong>${item.name}`
  ).join("<br>");
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function setStatus(message) {
  els.status.textContent = message;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Algo no salió bien");
  return body;
}

function getDateParts(value) {
  const date = new Date(`${value}T12:00:00`);
  return {
    date,
    day: date.getDay(),
    month: date.getMonth(),
    year: date.getFullYear()
  };
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function filteredResults() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  return state.results.filter(item => {
    const parts = getDateParts(item.date);
    const range = els.rangeFilter.value;
    const turn = els.turnFilter.value;
    const day = els.dayFilter.value;
    const position = els.positionFilter.value;

    if (turn !== "all" && item.turn !== turn) return false;
    if (day !== "all" && String(parts.day) !== day) return false;
    if (position === "head" && item.position !== 1) return false;
    if (range === "week" && parts.date < weekStart) return false;
    if (range === "month" && (parts.month !== now.getMonth() || parts.year !== now.getFullYear())) return false;
    if (range === "lastMonth") {
      const wanted = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (parts.month !== wanted.getMonth() || parts.year !== wanted.getFullYear()) return false;
    }
    if (range === "year" && parts.year !== now.getFullYear()) return false;
    return true;
  });
}

function rankNumbers(items) {
  const counts = new Map();
  for (const item of items) {
    const current = counts.get(item.number) || { number: item.number, count: 0, turns: new Set(), dates: new Set() };
    current.count += 1;
    current.turns.add(item.turn);
    current.dates.add(item.date);
    counts.set(item.number, current);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.number.localeCompare(b.number))
    .map(item => ({
      ...item,
      turns: [...item.turns],
      dates: [...item.dates]
    }));
}

function setHeroCard(numberEl, labelEl, ranking, emptyText) {
  if (!ranking.length) {
    numberEl.textContent = "--";
    labelEl.textContent = emptyText;
    return;
  }
  numberEl.textContent = ranking[0].number;
  labelEl.textContent = `${ranking[0].count} vez/veces`;
}

function renderHighlights() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const today = todayIso();

  const weekItems = state.results.filter(item => getDateParts(item.date).date >= weekStart);
  const monthItems = state.results.filter(item => {
    const parts = getDateParts(item.date);
    return parts.month === now.getMonth() && parts.year === now.getFullYear();
  });
  const todayItems = state.results.filter(item => item.date === today);

  setHeroCard(els.weekTop, els.weekTopLabel, rankNumbers(weekItems), "Sin datos esta semana");
  setHeroCard(els.monthTop, els.monthTopLabel, rankNumbers(monthItems), "Sin datos este mes");
  setHeroCard(els.todayTop, els.todayTopLabel, rankNumbers(todayItems), "Sin datos de hoy");
}

function renderRanking() {
  const items = filteredResults();
  const ranking = rankNumbers(items);
  const max = Math.max(...ranking.map(item => item.count), 1);
  els.countLabel.textContent = `${items.length} resultados`;

  if (!ranking.length) {
    els.ranking.innerHTML = `<div class="empty">Todavía no hay datos para esta pregunta.</div>`;
    return;
  }

  els.ranking.innerHTML = ranking.slice(0, 12).map(item => `
    <div class="rank-row">
      <div class="number">${item.number}</div>
      <div>
        <div class="bar"><span style="width:${(item.count / max) * 100}%"></span></div>
        <small>${item.turns.join(", ")}</small>
      </div>
      <div class="times">${item.count} veces</div>
    </div>
  `).join("");
}

function buildCombo() {
  const groups = [
    state.results,
    state.results.filter(item => item.position === 1),
    state.results.filter(item => getDateParts(item.date).day === new Date().getDay()),
    filteredResults()
  ];
  const score = new Map();
  groups.forEach((group, index) => {
    rankNumbers(group).slice(0, 10).forEach((item, place) => {
      score.set(item.number, (score.get(item.number) || 0) + (12 - place) + index);
    });
  });

  const picks = [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6);

  els.combo.innerHTML = picks.length
    ? picks.map(([number, points]) => `
      <div class="pick">
        <div class="number">${number}</div>
        <div>Coincidió en varios filtros</div>
        <div class="times">${points} pts</div>
      </div>
    `).join("")
    : `<div class="empty">Importá algunos resultados y armamos una jugada.</div>`;
}

function rollLuckyNumber() {
  let spins = 0;
  els.luckyNumber.classList.remove("spin");
  void els.luckyNumber.offsetWidth;
  els.luckyNumber.classList.add("spin");

  const timer = setInterval(() => {
    const value = Math.floor(Math.random() * 100);
    els.luckyNumber.textContent = String(value).padStart(2, "0");
    spins += 1;
    if (spins >= 12) {
      clearInterval(timer);
      const finalValue = Math.floor(Math.random() * 100);
      els.luckyNumber.textContent = String(finalValue).padStart(2, "0");
    }
  }, 70);
}

function availableDates() {
  return [...new Set(state.results.map(item => item.date))]
    .sort((a, b) => b.localeCompare(a));
}

function turnClass(turn) {
  return turn.toLowerCase().replace(/\s+/g, "-");
}

function officialTurnItems(date, turn) {
  const byPosition = new Map();
  const items = state.results
    .filter(item => item.date === date && item.turn === turn)
    .sort((a, b) => {
      const officialA = a.source === "Caja Social SDE" ? 0 : 1;
      const officialB = b.source === "Caja Social SDE" ? 0 : 1;
      return officialA - officialB || a.position - b.position;
    });

  for (const item of items) {
    if (!byPosition.has(item.position)) byPosition.set(item.position, item);
  }

  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

function renderDrawBoard() {
  const dates = availableDates();
  if (!dates.length) {
    els.boardDate.textContent = "Sin fecha";
    els.drawCards.innerHTML = `<div class="draw-empty">Todavía no hay sorteos cargados para mostrar.</div>`;
    els.prevDayBtn.disabled = true;
    els.nextDayBtn.disabled = true;
    return;
  }

  if (state.boardDateIndex > dates.length - 1) state.boardDateIndex = 0;
  const date = dates[state.boardDateIndex];
  els.boardDate.textContent = formatDate(date);
  els.prevDayBtn.disabled = state.boardDateIndex >= dates.length - 1;
  els.nextDayBtn.disabled = state.boardDateIndex <= 0;

  const wantedTurns = ["Previa", "Matutina", "Vespertina"];
  els.drawCards.innerHTML = wantedTurns.map(turn => {
    const items = officialTurnItems(date, turn);

    if (!items.length) {
      return `
        <article class="draw-card ${turnClass(turn)}">
          <div class="draw-title"><h3>${turn}</h3><span>Sin datos</span></div>
          <div class="draw-grid"><div class="draw-empty">No cargado</div></div>
        </article>
      `;
    }

    return `
      <article class="draw-card ${turnClass(turn)}">
        <div class="draw-title">
          <h3>${turn}</h3>
          <span>${items.length} números</span>
        </div>
        <div class="draw-grid">
          ${items.map(item => `
            <div class="draw-number">
              <em>${item.position}°</em>
              <strong>${item.number}</strong>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function checkNumber() {
  const typed = String(els.checkNumber.value || "").replace(/\D/g, "").slice(0, 4);
  const from = els.checkFrom.value;
  const to = els.checkTo.value;

  if (!/^\d{2,4}$/.test(typed)) {
    els.checkResult.textContent = "Ingresá 4 cifras, o las últimas 3 / 2 para consultarlo.";
    return;
  }

  const matches = state.results
    .filter(item => item.number.endsWith(typed))
    .filter(item => !from || item.date >= from)
    .filter(item => !to || item.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date) || a.position - b.position);

  if (!matches.length) {
    els.checkResult.innerHTML = `<span class="miss">No aparecen números terminados en <strong>${typed}</strong> en las fechas elegidas.</span>`;
    return;
  }

  const preview = matches.slice(0, 4).map(item =>
    `${formatDate(item.date)} - ${item.turn}, puesto ${item.position}: ${item.number}`
  ).join("<br>");
  const more = matches.length > 4 ? `<br>Y ${matches.length - 4} coincidencias más.` : "";
  const label = typed.length === 4 ? `El <strong>${typed}</strong>` : `Terminados en <strong>${typed}</strong>`;
  els.checkResult.innerHTML = `${label}: ${matches.length} coincidencia/s.<br>${preview}${more}`;
}

function render() {
  renderHighlights();
  renderRanking();
  renderDrawBoard();
  buildCombo();
  checkNumber();
}

async function loadResults() {
  const body = await api("/api/results");
  state.results = body.results || [];
  render();
}

async function importRange() {
  els.importBtn.disabled = true;
  setStatus("Importando...");
  try {
    const body = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ from: els.fromDate.value, to: els.toDate.value })
    });
    state.results = body.results || [];
    setStatus(`Traídos ${body.imported}`);
    render();
  } catch (error) {
    setStatus(error.message);
  } finally {
    els.importBtn.disabled = false;
  }
}

async function importOfficialToday() {
  els.officialBtn.disabled = true;
  setStatus("Leyendo oficial...");
  try {
    const body = await api("/api/import-official", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.results = body.results || [];
    setStatus(`Oficial: ${body.imported}`);
    render();
  } catch (error) {
    setStatus("No se pudo importar");
    els.checkResult.innerHTML = `<span class="miss">${error.message}</span>`;
  } finally {
    els.officialBtn.disabled = false;
  }
}

async function importOfficialText() {
  els.pasteBtn.disabled = true;
  setStatus("Cargando texto...");
  try {
    const body = await api("/api/import-official-text", {
      method: "POST",
      body: JSON.stringify({ text: els.officialText.value })
    });
    state.results = body.results || [];
    els.officialText.value = "";
    setStatus(`Texto: ${body.imported}`);
    render();
  } catch (error) {
    setStatus("Revisar texto");
    els.checkResult.innerHTML = `<span class="miss">${error.message}</span>`;
  } finally {
    els.pasteBtn.disabled = false;
  }
}

async function saveManual(event) {
  event.preventDefault();
  setStatus("Guardando...");
  try {
    const body = await api("/api/results", {
      method: "POST",
      body: JSON.stringify({
        date: els.manualDate.value,
        turn: els.manualTurn.value,
        position: els.manualPosition.value,
        number: els.manualNumber.value
      })
    });
    state.results = body.results || [];
    els.manualNumber.value = "";
    setStatus("Guardado");
    render();
  } catch (error) {
    setStatus(error.message);
  }
}

els.fromDate.value = daysAgoIso(7);
els.toDate.value = todayIso();
els.manualDate.value = todayIso();
els.checkFrom.value = daysAgoIso(30);
els.checkTo.value = todayIso();
els.importBtn.addEventListener("click", importRange);
els.officialBtn.addEventListener("click", importOfficialToday);
els.pasteBtn.addEventListener("click", importOfficialText);
els.dreamBtn.addEventListener("click", searchDream);
els.dreamInput.addEventListener("input", searchDream);
els.dreamInput.addEventListener("keydown", event => {
  if (event.key === "Enter") searchDream();
});
els.dreamPosterBtn.addEventListener("click", () => {
  window.open("/numeros-suenos.gif", "_blank");
});
els.witchCard.addEventListener("click", rollLuckyNumber);
els.prevDayBtn.addEventListener("click", () => {
  state.boardDateIndex += 1;
  renderDrawBoard();
});
els.nextDayBtn.addEventListener("click", () => {
  state.boardDateIndex -= 1;
  renderDrawBoard();
});
els.manualForm.addEventListener("submit", saveManual);
els.comboBtn.addEventListener("click", buildCombo);
els.checkBtn.addEventListener("click", checkNumber);
[els.checkNumber, els.checkFrom, els.checkTo].forEach(el => {
  el.addEventListener("input", checkNumber);
  el.addEventListener("change", checkNumber);
});
[els.rangeFilter, els.turnFilter, els.dayFilter, els.positionFilter].forEach(el => {
  el.addEventListener("change", render);
});

loadResults().catch(error => setStatus(error.message));
