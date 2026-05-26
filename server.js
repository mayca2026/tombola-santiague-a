const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "results.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]\n");
}

function readResults() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeResults(results) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2) + "\n");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        req.destroy();
        reject(new Error("Body demasiado grande"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function decodeText(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(br|p|div|li|tr|h\d|table|section|article|ul|ol)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+/)
    .map(line => decodeText(line))
    .filter(Boolean);
}

function normalizeTurn(turn) {
  const lower = turn.toLowerCase();
  if (lower.includes("previa")) return "Previa";
  if (lower.includes("primera")) return "Primera";
  if (lower.includes("matutina")) return "Matutina";
  if (lower.includes("vespertina")) return "Vespertina";
  if (lower.includes("tarde")) return "Tarde";
  if (lower.includes("nocturna")) return "Nocturna";
  return turn;
}

function parseResults(html, requestedDate) {
  const lines = htmlToLines(html);
  const titleLine = lines.find(line => /Quiniela Santiago del Estero \d{2}\/\d{2}\/\d{4}/i.test(line));
  const dateMatch = titleLine && titleLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : requestedDate;
  const turns = ["Previa", "Primera", "Matutina", "Vespertina", "Tarde", "Nocturna"];
  const records = [];
  let currentTurn = "";

  for (const line of lines) {
    const exactTurn = turns.find(turn => line === turn || line.startsWith(`${turn} -`));
    if (exactTurn) {
      currentTurn = normalizeTurn(exactTurn);
      continue;
    }

    const row = line.match(/^(\d{1,2})\s+(\d{4})$/);
    if (currentTurn && row) {
      records.push({
        date,
        lottery: "Tómbola de Santiago del Estero",
        turn: currentTurn,
        position: Number(row[1]),
        number: row[2],
        source: "nacionalquiniela.com"
      });
    }
  }

  return records;
}

function parseOfficialToday(html) {
  const lines = htmlToLines(html);
  const dateLine = lines.find(line => /\d{2}\/\d{2}\/\d{4}/.test(line));
  const dateMatch = dateLine && dateLine.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const date = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
    : new Date().toISOString().slice(0, 10);
  const joined = lines.join(" ");
  const turns = [
    ["Previa", /(?:TOMBOLA\s+SANTIAGUEÑA\s+)?(?:LA\s+)?PREVIA/i],
    ["Matutina", /(?:TOMBOLA\s+SANTIAGUEÑA\s+)?MATUTINA/i],
    ["Vespertina", /(?:TOMBOLA\s+SANTIAGUEÑA\s+)?VESPERTINA/i],
    ["Tardecita", /(?:TOMBOLA\s+SANTIAGUEÑA\s+)?(?:LA\s+)?TARDECITA/i],
    ["Nocturna", /(?:TOMBOLA\s+SANTIAGUEÑA\s+)?NOCTURNA/i]
  ];
  const markers = turns
    .map(([turn, pattern]) => {
      const match = joined.match(pattern);
      return match ? { turn, index: match.index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
  const records = [];

  for (let i = 0; i < markers.length; i += 1) {
    const start = markers[i].index;
    const end = markers[i + 1] ? markers[i + 1].index : joined.length;
    const block = joined.slice(start, end);
    const pairs = [...block.matchAll(/\b(\d{1,2})\s+(\d{4})\b/g)];
    for (const pair of pairs) {
      const position = Number(pair[1]);
      if (position >= 1 && position <= 20) {
        records.push({
          date,
          lottery: "Tómbola Santiagueña",
          turn: markers[i].turn,
          position,
          number: pair[2],
          source: "Caja Social SDE"
        });
      }
    }
  }

  return records;
}

function parseOfficialText(text) {
  return parseOfficialToday(text.replace(/\n/g, " "));
}

function mergeResults(existing, incoming) {
  const byKey = new Map();
  for (const item of existing) {
    byKey.set(`${item.date}|${item.turn}|${item.position}|${item.number}`, item);
  }
  for (const item of incoming) {
    byKey.set(`${item.date}|${item.turn}|${item.position}|${item.number}`, item);
  }
  return [...byKey.values()].sort((a, b) =>
    b.date.localeCompare(a.date) ||
    a.turn.localeCompare(b.turn) ||
    a.position - b.position
  );
}

function eachDate(from, to) {
  const dates = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function importDate(date) {
  const url = `https://www.nacionalquiniela.com/quiniela-santiago-del-estero-amp.php?del-dia=${date}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 QuinielaAnalizador/1.0"
    }
  });
  if (!response.ok) throw new Error(`No se pudo leer ${date}`);
  const html = await response.text();
  return parseResults(html, date);
}

async function importOfficialToday() {
  const urls = [
    "http://www.cajasocialsde.gob.ar/php/sorteoshoy.php",
    "https://www.cajasocialsde.gob.ar/php/sorteoshoy.php",
    "https://www.cajasocialsde.gob.ar/"
  ];
  const errors = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 QuinielaAnalizador/1.0"
        }
      });
      if (!response.ok) throw new Error(`Respuesta ${response.status}`);
      const records = parseOfficialToday(await response.text());
      if (records.length) return records;
      errors.push(`${url}: no encontré números en texto`);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }
  const message = "No pude leer la página oficial desde este equipo. Si allí los resultados aparecen como imagen, pasame la imagen o pegá el texto y lo cargamos.";
  const detail = errors.join(" | ");
  throw new Error(`${message} ${detail}`);
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/results") {
    sendJson(res, 200, { results: readResults() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/results") {
    const body = JSON.parse(await readBody(req) || "{}");
    const item = {
      date: body.date,
      lottery: "Tómbola de Santiago del Estero",
      turn: body.turn,
      position: Number(body.position || 1),
      number: String(body.number || "").padStart(4, "0").slice(-4),
      source: "carga manual"
    };
    if (!item.date || !item.turn || !/^\d{4}$/.test(item.number)) {
      sendJson(res, 400, { error: "Faltan datos para guardar el resultado." });
      return;
    }
    const merged = mergeResults(readResults(), [item]);
    writeResults(merged);
    sendJson(res, 200, { saved: item, results: merged });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/import") {
    const body = JSON.parse(await readBody(req) || "{}");
    const from = body.from;
    const to = body.to || from;
    if (!from || !to) {
      sendJson(res, 400, { error: "Elegí fecha desde y hasta." });
      return;
    }

    const imported = [];
    const errors = [];
    for (const date of eachDate(from, to)) {
      try {
        imported.push(...await importDate(date));
      } catch (error) {
        errors.push({ date, message: error.message });
      }
    }

    const merged = mergeResults(readResults(), imported);
    writeResults(merged);
    sendJson(res, 200, { imported: imported.length, errors, results: merged });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/import-official") {
    const imported = await importOfficialToday();
    const merged = mergeResults(readResults(), imported);
    writeResults(merged);
    sendJson(res, 200, { imported: imported.length, results: merged });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/import-official-text") {
    const body = JSON.parse(await readBody(req) || "{}");
    const imported = parseOfficialText(body.text || "");
    if (!imported.length) {
      sendJson(res, 400, { error: "No encontré números claros en el texto pegado." });
      return;
    }
    const merged = mergeResults(readResults(), imported);
    writeResults(merged);
    sendJson(res, 200, { imported: imported.length, results: merged });
    return;
  }

  sendJson(res, 404, { error: "No encontrado" });
}

function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Prohibido");
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end("No encontrado");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`Quiniela Analizador listo en http://localhost:${PORT}`);
});

globalThis.__serverFromRequire = server;
