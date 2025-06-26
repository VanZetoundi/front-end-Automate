import { AutomateClass } from "./AutomateClas";

const precedence = {
  '*': 3,
  '.': 2,
  '|': 1,
};

function isOperator(c) {
  return ['*', '.', '|'].includes(c);
}

function addExplicitConcatOperator(regex) {
  let result = '';
  const isSymbol = (c) => /^[a-zA-Z0-9]$/.test(c);
  for (let i = 0; i < regex.length; i++) {
    const c1 = regex[i];
    const c2 = regex[i + 1];
    result += c1;
    if (
      (isSymbol(c1) || c1 === '*' || c1 === ')') &&
      (isSymbol(c2) || c2 === '(')
    ) {
      result += '.';
    }
  }
  return result;
}

export function infixToPostfix(regex) {
  const output = [];
  const stack = [];
  const exp = addExplicitConcatOperator(regex);

  for (let c of exp) {
    if (/^[a-zA-Z0-9]$/.test(c)) {
      output.push(c);
    } else if (c === '(') {
      stack.push(c);
    } else if (c === ')') {
      while (stack.length > 0 && stack[stack.length - 1] !== '(') {
        output.push(stack.pop());
      }
      stack.pop(); // Remove '('
    } else if (isOperator(c)) {
      while (
        stack.length > 0 &&
        isOperator(stack[stack.length - 1]) &&
        precedence[stack[stack.length - 1]] >= precedence[c]
      ) {
        output.push(stack.pop());
      }
      stack.push(c);
    }
  }

  while (stack.length > 0) {
    output.push(stack.pop());
  }

  return output.join('');
}

export const createAutomateFromData = (data) => {
  const auto = new AutomateClass(data.alphabet);
  data.states.forEach(e => auto.ajouterEtat(e));
  data.final.forEach(f => auto.ajouterEtatFinal(f));
  auto.fixerEtatInitial(data.initial[0]);
  for (let source in data.transitions) {
    for (let sym in data.transitions[source]) {
      auto.ajouterTransition(source, sym, data.transitions[source][sym]);
    }
  }
  return auto;
};

export const formatAutomateToData = (auto, type) => {
  const transitions = {};

  for (const [key, val] of auto.transitions.entries()) {
    const [state, sym] = key.split("|");

    if (!transitions[state]) transitions[state] = {};
    transitions[state][sym] = [...val];
  }

  return {
    states: [...auto.etats],
    alphabet: [...auto.alphabet],
    transitions,
    initial: [auto.etatInitial],
    final: [...auto.etatsFinaux],
    type: type,
  };
};

export const formatAutomateToApi = (data) => {
  return {
    etats: data.states,
    alphabet: data.alphabet,
    transitions: data.transitions,
    etat_initial: data.initial[0],
    etats_finaux: data.final,
  };
};

export const formatApiToAutomate = (apiData, type = "Automate") => {
  return {
    states: apiData.etats,
    alphabet: apiData.alphabet,
    transitions: apiData.transitions,
    initial: [apiData.etat_initial],
    final: apiData.etats_finaux,
    type,
  };
};

export const formatApiToFront = (apiData, label) => ({
  id: Date.now(),
  data: {
    states: apiData.etats,
    alphabet: apiData.alphabet,
    transitions: apiData.transitions,
    initial: [apiData.etat_initial],
    final: apiData.etats_finaux,
    type: label,
  },
});

export function nettoyerExpression(expression) {
  // Supprime les ε suivis de *, soit ε*
  // Supprime les ε isolés
  // On enlève aussi les ε entre parenthèses pour le cas (ε) ou (ε)*
  return expression
    .replace(/\(ε\)\*/g, '')   // enlève (ε)*
    .replace(/\(ε\)/g, '')     // enlève (ε)
    .replace(/ε\*/g, '')       // enlève ε*
    .replace(/ε/g, '');        // enlève ε simple
}

export function simplifierRegex(expr) {
  return expr
    .replace(/\(\+/g, '(')       // enleve les + en début de parenthese
    .replace(/\+\)/g, ')')       // enleve + en fin de parenthese
    .replace(/\(\*/g, '(')       // idem pour *
    .replace(/\*\)/g, ')')
    .replace(/\(\)+/g, '')       // enleve les parenthèses vides
    .replace(/\+\+/g, '+')       // fusionne doubles +
    .replace(/\*\*/g, '*')       // fusionne doubles *
    .replace(/\(\)/g, '')        // parenthèses vides isolées
    .replace(/\(\+?\)/g, '')     // parenthèses contenant juste +
    .replace(/\(([^()]+)\)/g, '$1') // enlève parenthèses inutiles autour de symboles simples
    .replace(/\s+/g, '');        // supprime espaces
}