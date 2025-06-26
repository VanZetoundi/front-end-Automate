import { AutomateClass } from './AutomateClas';
import { infixToPostfix } from './utils';

let idCompteur = 0;
function nouvelEtat() {
    return `S${idCompteur++}`;
}


function infixVersPostfix(regex) {
    const precedence = { '*': 3, '.': 2, '|': 1 };
    const output = [];
    const stack = [];
    const addConcat = (regex) => {
        let result = '';
        for (let i = 0; i < regex.length; i++) {
            const c1 = regex[i];
            result += c1;
            if (i + 1 < regex.length) {
                const c2 = regex[i + 1];
                if (
                    (/[a-z0-9)]/.test(c1) || c1 === '*') &&
                    (/[a-z0-9(]/.test(c2))
                ) {
                    result += '.';
                }
            }
        }
        return result;
    };
    regex = addConcat(regex);

    for (let c of regex) {
        if (/[a-z0-9]/.test(c)) {
            output.push(c);
        } else if (c === '(') {
            stack.push(c);
        } else if (c === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                output.push(stack.pop());
            }
            stack.pop();
        } else {
            while (
                stack.length &&
                precedence[c] <= precedence[stack[stack.length - 1]]
            ) {
                output.push(stack.pop());
            }
            stack.push(c);
        }
    }

    while (stack.length) {
        output.push(stack.pop());
    }

    return output.join('');
}

export function glushkovAutomaton(regex) {
  if (!regex) return null;

  // Étape 0 : insérer les concaténations implicites (ex: ab -> a.b)
  function insertConcatenationOperators(input) {
    const result = [];
    const isSymbol = c => /[a-zA-Z0-9)]/.test(c);
    const isNextStart = c => /[a-zA-Z0-9(]/.test(c);
    for (let i = 0; i < input.length; i++) {
      result.push(input[i]);
      if (i < input.length - 1 && isSymbol(input[i]) && isNextStart(input[i + 1])) {
        result.push('.'); // insère concat explicite
      }
    }
    return result.join('');
  }

  // Étape 1 : Parser l'expression régulière en arbre syntaxique
  function parseRegex(regex) {
    const tokens = insertConcatenationOperators(regex).split('');
    let pos = 0;

    function getPrecedence(op) {
      if (op === '*') return 3;
      if (op === '.') return 2;
      if (op === '+') return 1;
      return 0;
    }

    function parseExpression(precedence = 0) {
      let left = parsePrimary();
      while (pos < tokens.length) {
        const op = tokens[pos];
        const opPrec = getPrecedence(op);
        if (opPrec < precedence) break;
        pos++;
        if (op === '*') {
          left = { type: 'star', child: left };
        } else {
          const right = parseExpression(opPrec + 1);
          left = { type: op === '+' ? 'union' : 'concat', left, right };
        }
      }
      return left;
    }

    function parsePrimary() {
      if (pos >= tokens.length) throw new Error('Expression incomplète');
      const token = tokens[pos++];
      if (token === '(') {
        const expr = parseExpression();
        if (tokens[pos++] !== ')') throw new Error('Parenthèse fermante manquante');
        return expr;
      }
      if (/[a-zA-Z0-9]/.test(token)) {
        return { type: 'symbol', value: token };
      }
      throw new Error(`Token invalide : ${token}`);
    }

    const ast = parseExpression();
    if (pos < tokens.length) throw new Error('Expression mal formée');
    return ast;
  }

  // Étape 2 : Calcul des ensembles Prem, Dern, Suiv, etc.
  function computeGlushkovSets(node, posCounter = { value: 0 }) {
    if (node.type === 'symbol') {
      const pos = ++posCounter.value;
      const name = `q${pos}`;
      return {
        prem: new Set([name]),
        dern: new Set([name]),
        suiv: [],
        fact: new Set([node.value]),
        positions: { [name]: node.value },
        nullable: false,
      };
    }

    if (node.type === 'union') {
      const l = computeGlushkovSets(node.left, posCounter);
      const r = computeGlushkovSets(node.right, posCounter);
      return {
        prem: new Set([...l.prem, ...r.prem]),
        dern: new Set([...l.dern, ...r.dern]),
        suiv: [...l.suiv, ...r.suiv],
        fact: new Set([...l.fact, ...r.fact]),
        positions: { ...l.positions, ...r.positions },
        nullable: l.nullable || r.nullable,
      };
    }

    if (node.type === 'concat') {
      const l = computeGlushkovSets(node.left, posCounter);
      const r = computeGlushkovSets(node.right, posCounter);
      const suiv = [...l.suiv, ...r.suiv];
      for (const a of l.dern) {
        for (const b of r.prem) {
          suiv.push([a, b, r.positions[b]]);
        }
      }
      return {
        prem: l.nullable ? new Set([...l.prem, ...r.prem]) : l.prem,
        dern: r.nullable ? new Set([...l.dern, ...r.dern]) : r.dern,
        suiv,
        fact: new Set([...l.fact, ...r.fact]),
        positions: { ...l.positions, ...r.positions },
        nullable: l.nullable && r.nullable,
      };
    }

    if (node.type === 'star') {
      const c = computeGlushkovSets(node.child, posCounter);
      const suiv = [...c.suiv];
      for (const a of c.dern) {
        for (const b of c.prem) {
          suiv.push([a, b, c.positions[b]]);
        }
      }
      return {
        prem: c.prem,
        dern: c.dern,
        suiv,
        fact: c.fact,
        positions: c.positions,
        nullable: true,
      };
    }

    throw new Error('Type de nœud inconnu');
  }

  // Étape 3 : Construction finale de l'automate
  try {
    const tree = parseRegex(regex);
    const { prem, dern, suiv, positions, nullable } = computeGlushkovSets(tree);

    const states = new Set(['q0', ...Object.keys(positions)]);
    const transitions = [];
    const finalStates = new Set();

    // Transitions depuis q0
    for (const p of prem) {
      transitions.push({ from: 'q0', to: p, symbol: positions[p] });
    }

    // Transitions de Suiv
    for (const [from, to, symbol] of suiv) {
      transitions.push({ from, to, symbol });
    }

    // États finaux = Dern(e)
    for (const d of dern) {
      finalStates.add(d);
    }
    if (nullable) {
      finalStates.add('q0');
    }

    return {
      states: Array.from(states),
      alphabet: Array.from(new Set(Object.values(positions))),
      transitions,
      initialState: 'q0',
      finalStates: Array.from(finalStates),
    };
  } catch (err) {
    console.error('Erreur dans glushkovAutomaton :', err.message);
    return null;
  }
}

export function thompsonFromRegex2(regex) {
  const regexPostfix = infixVersPostfix(regex);
  return construireDepuisPostfix(regexPostfix);

  function construireDepuisPostfix(postfix) {
    const pile = [];
    for (let c of postfix) {
      if (c === '*') {
        const a = pile.pop();
        pile.push(etoile(a));
      } else if (c === '.') {
        const b = pile.pop();
        const a = pile.pop();
        pile.push(concat(a, b));
      } else if (c === '+') {
        const b = pile.pop();
        const a = pile.pop();
        pile.push(union(a, b));
      } else {
        pile.push(symbole(c));
      }
    }
    return pile.pop();
  }

  function symbole(symb) {
    const aut = new AutomateClass([symb]);
    const e1 = nouvelEtat();
    const e2 = nouvelEtat();
    aut.ajouterEtat(e1);
    aut.ajouterEtat(e2);
    aut.fixerEtatInitial(e1);
    aut.ajouterEtatFinal(e2);
    aut.ajouterTransition(e1, symb, e2);
    return aut;
  }

  function union(a1, a2) {
    const aut = new AutomateClass([...a1.alphabet, ...a2.alphabet]);
    const eInit = nouvelEtat();
    const eFinal = nouvelEtat();
    copier(a1, aut);
    copier(a2, aut);
    aut.ajouterEtat(eInit);
    aut.ajouterEtat(eFinal);
    aut.ajouterTransition(eInit, 'ε', a1.etatInitial);
    aut.ajouterTransition(eInit, 'ε', a2.etatInitial);
    for (const f of a1.etatsFinaux) aut.ajouterTransition(f, 'ε', eFinal);
    for (const f of a2.etatsFinaux) aut.ajouterTransition(f, 'ε', eFinal);
    aut.fixerEtatInitial(eInit);
    aut.ajouterEtatFinal(eFinal);
    return aut;
  }

  function concat(a1, a2) {
    const aut = new AutomateClass([...a1.alphabet, ...a2.alphabet]);
    copier(a1, aut);
    copier(a2, aut);
    for (const f of a1.etatsFinaux) aut.ajouterTransition(f, 'ε', a2.etatInitial);
    aut.fixerEtatInitial(a1.etatInitial);
    for (const f of a2.etatsFinaux) aut.ajouterEtatFinal(f);
    return aut;
  }

  function etoile(a) {
    const aut = new AutomateClass([...a.alphabet]);
    const eInit = nouvelEtat();
    const eFinal = nouvelEtat();
    copier(a, aut);
    aut.ajouterEtat(eInit);
    aut.ajouterEtat(eFinal);
    aut.ajouterTransition(eInit, 'ε', a.etatInitial);
    aut.ajouterTransition(eInit, 'ε', eFinal);
    for (const f of a.etatsFinaux) {
      aut.ajouterTransition(f, 'ε', a.etatInitial);
      aut.ajouterTransition(f, 'ε', eFinal);
    }
    aut.fixerEtatInitial(eInit);
    aut.ajouterEtatFinal(eFinal);
    return aut;
  }

  function copier(source, cible) {
    for (const e of source.etats) cible.ajouterEtat(e);
    for (const f of source.etatsFinaux) cible.ajouterEtatFinal(f);
    cible.fixerEtatInitial(source.etatInitial);
    for (const [cle, destinations] of source.transitions) {
      const [etat, symbole] = cle.split('|');
      for (const dest of destinations) {
        cible.ajouterTransition(etat, symbole, dest);
      }
    }
  }
}

export function glushkovAutomaton2(regex) {
  if (!regex) return null;

  function insertConcatenationOperators(input) {
    const result = [];
    const isSymbol = c => /[a-zA-Z0-9)]/.test(c);
    const isNextStart = c => /[a-zA-Z0-9(]/.test(c);
    for (let i = 0; i < input.length; i++) {
      result.push(input[i]);
      if (i < input.length - 1 && isSymbol(input[i]) && isNextStart(input[i + 1])) {
        result.push('.');
      }
    }
    return result.join('');
  }

  function parseRegex(regex) {
    const tokens = insertConcatenationOperators(regex).split('');
    let pos = 0;

    function getPrecedence(op) {
      if (op === '*') return 3;
      if (op === '.') return 2;
      if (op === '+') return 1;
      return 0;
    }

    function parseExpression(precedence = 0) {
      let left = parsePrimary();
      while (pos < tokens.length) {
        const op = tokens[pos];
        const opPrec = getPrecedence(op);
        if (opPrec < precedence || op === ')') break;
        pos++;
        if (op === '*') {
          left = { type: 'star', child: left };
        } else {
          const right = parseExpression(opPrec + 1);
          left = { type: op === '+' ? 'union' : 'concat', left, right };
        }
      }
      return left;
    }

    function parsePrimary() {
      if (pos >= tokens.length) throw new Error('Expression incomplète');
      const token = tokens[pos];
      if (token === '(') {
        pos++;
        const expr = parseExpression();
        if (pos >= tokens.length || tokens[pos] !== ')') {
          throw new Error('Parenthèse fermante manquante');
        }
        pos++;
        return expr;
      }
      if (/[a-zA-Z0-9]/.test(token)) {
        pos++;
        return { type: 'symbol', value: token };
      }
      throw new Error(`Token invalide : ${token} à la position ${pos}`);
    }

    const ast = parseExpression();
    if (pos < tokens.length) throw new Error(`Expression mal formée : reste "${tokens.slice(pos).join('')}"`);
    return ast;
  }

  function computeGlushkovSets(node, posCounter = { value: 0 }) {
    if (node.type === 'symbol') {
      const pos = ++posCounter.value;
      const name = `S${pos}`;
      return {
        prem: new Set([name]),
        dern: new Set([name]),
        suiv: [],
        fact: new Set([node.value]),
        positions: { [name]: node.value },
        nullable: false,
      };
    }

    if (node.type === 'union') {
      const l = computeGlushkovSets(node.left, posCounter);
      const r = computeGlushkovSets(node.right, posCounter);
      return {
        prem: new Set([...l.prem, ...r.prem]),
        dern: new Set([...l.dern, ...r.dern]),
        suiv: [...l.suiv, ...r.suiv],
        fact: new Set([...l.fact, ...r.fact]),
        positions: { ...l.positions, ...r.positions },
        nullable: l.nullable || r.nullable,
      };
    }

    if (node.type === 'concat') {
      const l = computeGlushkovSets(node.left, posCounter);
      const r = computeGlushkovSets(node.right, posCounter);
      const suiv = [...l.suiv, ...r.suiv];
      for (const a of l.dern) {
        for (const b of r.prem) {
          suiv.push([a, b, r.positions[b]]);
        }
      }
      return {
        prem: l.nullable ? new Set([...l.prem, ...r.prem]) : l.prem,
        dern: r.nullable ? new Set([...l.dern, ...r.dern]) : r.dern,
        suiv,
        fact: new Set([...l.fact, ...r.fact]),
        positions: { ...l.positions, ...r.positions },
        nullable: l.nullable && r.nullable,
      };
    }

    if (node.type === 'star') {
      const c = computeGlushkovSets(node.child, posCounter);
      const suiv = [...c.suiv];
      for (const a of c.dern) {
        for (const b of c.prem) {
          suiv.push([a, b, c.positions[b]]);
        }
      }
      return {
        prem: c.prem,
        dern: c.dern,
        suiv,
        fact: c.fact,
        positions: c.positions,
        nullable: true,
      };
    }

    throw new Error('Type de nœud inconnu');
  }

  try {
    const tree = parseRegex(regex);
    const { prem, dern, suiv, positions, nullable } = computeGlushkovSets(tree);
    const alphabet = new Set(Object.values(positions));
    const automate = new AutomateClass(alphabet);

    // États = S0 + toutes les positions
    automate.ajouterEtat('S0');
    automate.fixerEtatInitial('S0');

    for (const state of Object.keys(positions)) {
      automate.ajouterEtat(state);
    }

    // Transitions depuis S0 vers les positions initiales
    for (const p of prem) {
      automate.ajouterTransition('S0', positions[p], p);
    }

    // Transitions internes (suiv)
    for (const [from, to, symbol] of suiv) {
      automate.ajouterTransition(from, symbol, to);
    }

    // États finaux
    for (const f of dern) {
      automate.ajouterEtatFinal(f);
    }

    if (nullable) {
      automate.ajouterEtatFinal('S0');
    }

    return automate;
  } catch (err) {
    console.error('Erreur dans glushkovAutomaton :', err.message);
    return null;
  }
}



export function unionAutomates(a1, a2) {
  const auto = new AutomateClass([...a1.alphabet, ...a2.alphabet]);
  const prefix1 = "A1_";
  const prefix2 = "A2_";

  const eInit = "q_union_init";
  auto.ajouterEtat(eInit);
  auto.fixerEtatInitial(eInit);

  const mapState = (prefix, etat) => `${prefix}${etat}`;

  // Copier les états et transitions
  for (const etat of a1.etats) auto.ajouterEtat(mapState(prefix1, etat));
  for (const etat of a2.etats) auto.ajouterEtat(mapState(prefix2, etat));

  for (const [cle, cibleSet] of a1.transitions) {
    const [src, symb] = cle.split("|");
    for (const cible of cibleSet)
      auto.ajouterTransition(mapState(prefix1, src), symb, mapState(prefix1, cible));
  }

  for (const [cle, cibleSet] of a2.transitions) {
    const [src, symb] = cle.split("|");
    for (const cible of cibleSet)
      auto.ajouterTransition(mapState(prefix2, src), symb, mapState(prefix2, cible));
  }

  // Transitions ε vers les deux initiales
  auto.ajouterTransition(eInit, "ε", mapState(prefix1, a1.etatInitial));
  auto.ajouterTransition(eInit, "ε", mapState(prefix2, a2.etatInitial));

  // Ajouter les états finaux
  for (const f of a1.etatsFinaux) auto.ajouterEtatFinal(mapState(prefix1, f));
  for (const f of a2.etatsFinaux) auto.ajouterEtatFinal(mapState(prefix2, f));

  return auto;
}

export function concatAutomates(a1, a2) {
  const auto = new AutomateClass([...a1.alphabet, ...a2.alphabet]);
  const prefix1 = "A1_";
  const prefix2 = "A2_";

  const mapState = (prefix, etat) => `${prefix}${etat}`;

  // Copier les états
  for (const e of a1.etats) auto.ajouterEtat(mapState(prefix1, e));
  for (const e of a2.etats) auto.ajouterEtat(mapState(prefix2, e));

  // Copier les transitions
  for (const [cle, val] of a1.transitions) {
    const [src, symb] = cle.split("|");
    for (const dst of val)
      auto.ajouterTransition(mapState(prefix1, src), symb, mapState(prefix1, dst));
  }

  for (const [cle, val] of a2.transitions) {
    const [src, symb] = cle.split("|");
    for (const dst of val)
      auto.ajouterTransition(mapState(prefix2, src), symb, mapState(prefix2, dst));
  }

  // Transition des états finaux de A1 vers l’état initial de A2
  for (const f of a1.etatsFinaux)
    auto.ajouterTransition(mapState(prefix1, f), "ε", mapState(prefix2, a2.etatInitial));

  // Initial et finaux
  auto.fixerEtatInitial(mapState(prefix1, a1.etatInitial));
  for (const f of a2.etatsFinaux) auto.ajouterEtatFinal(mapState(prefix2, f));

  return auto;
}

function getAlphabet(automate) {
  const alphabet = new Set();
  for (const transitions of Object.values(automate.transitions || {})) {
    for (const symbole of Object.keys(transitions)) {
      alphabet.add(symbole);
    }
  }
  return [...alphabet];
}



export function intersectionAutomates(a1, a2) {
  // Journaliser les automates pour débogage
  console.log("Automate 1:", JSON.stringify({
    alphabet: [...a1.alphabet],
    etats: [...a1.etats],
    etatInitial: a1.etatInitial,
    etatsFinaux: [...a1.etatsFinaux],
    transitions: [...a1.transitions.entries()].map(([key, targets]) => [key, [...targets]])
  }, null, 2));
  console.log("Automate 2:", JSON.stringify({
    alphabet: [...a2.alphabet],
    etats: [...a2.etats],
    etatInitial: a2.etatInitial,
    etatsFinaux: [...a2.etatsFinaux],
    transitions: [...a2.transitions.entries()].map(([key, targets]) => [key, [...targets]])
  }, null, 2));

  // Vérifier que les automates ne sont pas null
  if (!a1 || !a2) {
    console.error("Erreur : Un des automates est null");
    return null;
  }

  // Vérifier que transitions est une Map ou un objet
  if (!(a1.transitions instanceof Map) || !(a2.transitions instanceof Map)) {
    console.error("Erreur : Les transitions ne sont pas au format Map");
    return null;
  }

  // Calculer l'alphabet commun
  const alphabet = new Set([...a1.alphabet].filter(x => a2.alphabet.has(x)));
  if (alphabet.size === 0) {
    console.error("Erreur : Les alphabets des automates n'ont pas d'intersection");
    return null;
  }

  // Créer l'automate d'intersection
  const auto = new AutomateClass(alphabet);
  const stateMap = new Map(); // Mappe les paires (q1, q2) à un nom d'état unique

  // Générer les états du produit cartésien
  let stateCounter = 0;
  for (const q1 of a1.etats) {
    for (const q2 of a2.etats) {
      const stateName = `S${stateCounter++}`;
      stateMap.set(`${q1},${q2}`, stateName);
      auto.ajouterEtat(stateName);
    }
  }

  // Définir l'état initial
  const initialState = stateMap.get(`${a1.etatInitial},${a2.etatInitial}`);
  if (!initialState) {
    console.error("Erreur : Impossible de définir l'état initial");
    return null;
  }
  auto.fixerEtatInitial(initialState);

  // Ajouter les transitions
  for (const q1 of a1.etats) {
    for (const q2 of a2.etats) {
      const fromState = stateMap.get(`${q1},${q2}`);
      for (const symbol of alphabet) {
        const key1 = `${q1}|${symbol}`;
        const key2 = `${q2}|${symbol}`;
        const nextStates1 = a1.transitions.get(key1) || new Set();
        const nextStates2 = a2.transitions.get(key2) || new Set();
        for (const q1Next of nextStates1) {
          for (const q2Next of nextStates2) {
            const toState = stateMap.get(`${q1Next},${q2Next}`);
            if (toState) {
              auto.ajouterTransition(fromState, symbol, toState);
            }
          }
        }
      }
    }
  }

  // Définir les états finaux
  for (const q1 of a1.etatsFinaux) {
    for (const q2 of a2.etatsFinaux) {
      const finalState = stateMap.get(`${q1},${q2}`);
      if (finalState) {
        auto.ajouterEtatFinal(finalState);
      }
    }
  }

  // Supprimer les états inaccessibles
  function reachableStates(initial) {
    const reachable = new Set([initial]);
    let queue = [initial];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const symbol of auto.alphabet) {
        const key = `${current}|${symbol}`;
        const targets = auto.transitions.get(key) || new Set();
        for (const target of targets) {
          if (!reachable.has(target)) {
            reachable.add(target);
            queue.push(target);
          }
        }
      }
    }
    return reachable;
  }

  const reachable = reachableStates(initialState);
  auto.etats = new Set([...auto.etats].filter(s => reachable.has(s)));
  auto.etatsFinaux = new Set([...auto.etatsFinaux].filter(s => reachable.has(s)));
  auto.transitions = new Map([...auto.transitions].filter(([key]) => {
    const [from] = key.split("|");
    return reachable.has(from);
  }));

  // Journaliser l'automate résultant
  console.log("Automate d'intersection:", JSON.stringify({
    alphabet: [...auto.alphabet],
    etats: [...auto.etats],
    etatInitial: auto.etatInitial,
    etatsFinaux: [...auto.etatsFinaux],
    transitions: [...auto.transitions.entries()].map(([key, targets]) => [key, [...targets]])
  }, null, 2));

  return auto;
}


export function complementAutomate(automate) {
  // Journaliser l'automate entrant
  console.log("Automate entrant:", JSON.stringify({
    alphabet: [...automate.alphabet],
    etats: [...automate.etats],
    etatInitial: automate.etatInitial,
    etatsFinaux: [...automate.etatsFinaux],
    transitions: [...automate.transitions.entries()].map(([key, targets]) => [key, [...targets]])
  }, null, 2));

  // Vérifier que l'automate n'est pas null
  if (!automate) {
    console.error("Erreur : L'automate est null");
    return null;
  }

  // Vérifier que transitions est une Map
  if (!(automate.transitions instanceof Map)) {
    console.error("Erreur : Les transitions ne sont pas au format Map");
    return null;
  }

  // Créer l'automate résultat
  const result = new AutomateClass([...automate.alphabet]);

  // Étape 1 : Déterminisation (construction des sous-ensembles)
  const stateMap = new Map(); // Mappe les sous-ensembles d'états à un nom unique
  let stateCounter = 0;
  const queue = [new Set([automate.etatInitial])]; // Commencer par l'état initial
  const processed = new Set(); // Suivre les sous-ensembles traités
  const newInitial = `S${stateCounter}`;
  stateMap.set([...queue[0]].sort().join(","), newInitial);
  result.ajouterEtat(newInitial);
  result.fixerEtatInitial(newInitial);

  while (queue.length > 0) {
    const currentSet = queue.shift();
    const currentKey = [...currentSet].sort().join(",");
    if (processed.has(currentKey)) continue;
    processed.add(currentKey);
    const currentState = stateMap.get(currentKey);

    // Pour chaque symbole de l'alphabet
    for (const symbol of automate.alphabet) {
      const nextStates = new Set();
      // Collecter les états atteignables via le symbole
      for (const state of currentSet) {
        const key = `${state}|${symbol}`;
        const targets = automate.transitions.get(key) || new Set();
        for (const target of targets) {
          nextStates.add(target);
        }
      }

      // Si des états suivants existent, créer un nouvel état
      if (nextStates.size > 0) {
        const nextKey = [...nextStates].sort().join(",");
        let nextState = stateMap.get(nextKey);
        if (!nextState) {
          nextState = `S${++stateCounter}`;
          stateMap.set(nextKey, nextState);
          result.ajouterEtat(nextState);
          queue.push(nextStates);
        }
        result.ajouterTransition(currentState, symbol, nextState);
      }
    }
  }

  // Étape 2 : Complétion (ajouter un état poubelle)
  const sinkState = "S_sink";
  result.ajouterEtat(sinkState);
  for (const state of result.etats) {
    for (const symbol of result.alphabet) {
      const key = `${state}|${symbol}`;
      if (!result.transitions.has(key)) {
        result.ajouterTransition(state, symbol, sinkState);
      }
    }
  }
  // Transitions de l'état poubelle vers lui-même
  for (const symbol of result.alphabet) {
    result.ajouterTransition(sinkState, symbol, sinkState);
  }

  // Étape 3 : Complémentation (inverser les états finaux)
  for (const state of result.etats) {
    let originalStates;
    if (state === sinkState) {
      originalStates = []; // L'état poubelle n'a pas d'états originaux
    } else {
      const stateKey = stateMap.get([...result.etats].find(key => stateMap.get(key) === state));
      originalStates = stateKey ? stateKey.split(",") : [state]; // Singleton si pas dans stateMap
    }
    const originalSet = new Set(originalStates.filter(s => automate.etats.has(s)));
    const isFinal = [...automate.etatsFinaux].some(f => originalSet.has(f));
    if (state === sinkState || !isFinal) {
      result.ajouterEtatFinal(state);
    }
  }

  // Étape 4 : Supprimer les états inaccessibles
  function reachableStates(initial) {
    const reachable = new Set([initial]);
    let queue = [initial];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const symbol of result.alphabet) {
        const key = `${current}|${symbol}`;
        const targets = result.transitions.get(key) || new Set();
        for (const target of targets) {
          if (!reachable.has(target)) {
            reachable.add(target);
            queue.push(target);
          }
        }
      }
    }
    return reachable;
  }

  const reachable = reachableStates(result.etatInitial);
  result.etats = new Set([...result.etats].filter(s => reachable.has(s)));
  result.etatsFinaux = new Set([...result.etatsFinaux].filter(s => reachable.has(s)));
  result.transitions = new Map([...result.transitions].filter(([key]) => {
    const [from] = key.split("|");
    return reachable.has(from);
  }));

  // Journaliser l'automate résultant
  console.log("Automate complémentaire:", JSON.stringify({
    alphabet: [...result.alphabet],
    etats: [...result.etats],
    etatInitial: result.etatInitial,
    etatsFinaux: [...result.etatsFinaux],
    transitions: [...result.transitions.entries()].map(([key, targets]) => [key, [...targets]])
  }, null, 2));

  return result;
}