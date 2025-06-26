// src/services/api.js

const BASE_URL = "http://localhost:8000/api";

export async function convertAFNtoAFD(automate) {
  return apiPost("convert", automate);
}

export async function minimizeAFD(automate) {
  return apiPost("minimize", automate);
}

export async function solveEquations(equations) {
  return apiPost("solve", { equations });
}

export async function automateToRegex(automate) {
  return apiPost("expr", automate);
}

export async function getAccessibleStates(automate) {
  return apiPost("accessibles", automate);
}

export async function getCoaccessibleStates(automate) {
  return apiPost("coaccessibles", automate);
}

export async function getUsefulStates(automate) {
  return apiPost("utiles", automate);
}

export async function pruneAutomaton(automate) {
  return apiPost("emonder", automate);
}

export async function visualizeAutomaton(automate, format = "png") {
  const url = `${BASE_URL}/visualize/?format=${format}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(automate),
  });
  if (!response.ok) {
    throw new Error("Erreur API Visualize: " + (await response.text()));
  }
  return response.blob();
}

export async function unionAutomata(auto1, auto2) {
  return apiPost("union", { automate1: auto1, automate2: auto2 });
}

export async function intersectionAutomata(auto1, auto2) {
  return apiPost("intersection", { automate1: auto1, automate2: auto2 });
}

export async function complementAutomaton(automate) {
  return apiPost("complement", automate);
}

export async function concatenationAutomata(auto1, auto2) {
  return apiPost("concatenation", { automate1: auto1, automate2: auto2 });
}

export async function etoileAutomaton(automate) {
  return apiPost("etoile", automate);
}

export async function thompsonConstruction(expression) {
  const payload = { expression }; // ✅ Pas de JSON.stringify sur `expression`
  const response = await fetch(`${BASE_URL}/thompson/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Erreur API (thompson) : ${message}`);
  }

  return response.json();
}

export async function glushkovConstruction(expression) {
  const payload = { expression };
  const response = await fetch(`${BASE_URL}/glushkov/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Erreur API (glushkov) : ${message}`);
  }

  return response.json();
}

export async function afdToAFN(automate) {
  return apiPost("afd-to-afn", { automate });
}

export async function afdToEpsilonAFN(automate) {
  return apiPost("afd-to-epsilon-afn", { automate });
}

export async function afnToEpsilonAFN(automate) {
  return apiPost("afn-to-epsilon-afn", { automate });
}

export async function canonisation(automate) {
  return apiPost("canonisation", { automate });
}

// Helper
async function apiPost(endpoint, payload) {
  const response = await fetch(`${BASE_URL}/${endpoint}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Erreur API (${endpoint}) : ${message}`);
  }

  return response.json();
}
