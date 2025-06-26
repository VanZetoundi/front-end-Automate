Voici les **trois fonctions** en JavaScript (ES6), prenant **deux automates** de type `AutomateClass` en paramètre, et retournant respectivement :

1. L’**automate union**
2. L’**automate intersection**
3. L’**automate concaténé**

Elles supposent que tu utilises une classe `AutomateClass` définie comme :

```js
class AutomateClass {
  constructor(alphabet = []) {
    this.etats = new Set();
    this.alphabet = new Set(alphabet);
    this.transitions = new Map(); // clé = "état|symbole", valeur = Set(états)
    this.etatInitial = null;
    this.etatsFinaux = new Set();
  }

  ajouterEtat(etat) { this.etats.add(etat); }
  fixerEtatInitial(etat) { this.etatInitial = etat; }
  ajouterEtatFinal(etat) { this.etatsFinaux.add(etat); }
  ajouterTransition(from, symbol, to) {
    const cle = `${from}|${symbol}`;
    if (!this.transitions.has(cle)) this.transitions.set(cle, new Set());
    this.transitions.get(cle).add(to);
  }

  obtenirEtatsSuivants(etat, symbole) {
    return this.transitions.get(`${etat}|${symbole}`) || new Set();
  }
}
```

---

### ✅ 1. **Automate d’Union**

```js
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
```

---

### ✅ 2. **Automate d’Intersection**

```js
export function intersectionAutomates(a1, a2) {
  const alphabet = [...a1.alphabet].filter(x => a2.alphabet.has(x));
  const auto = new AutomateClass(alphabet);
  const visited = new Set();
  const queue = [];

  const nomEtat = (e1, e2) => `${e1}|${e2}`;
  const eInit = nomEtat(a1.etatInitial, a2.etatInitial);
  auto.ajouterEtat(eInit);
  auto.fixerEtatInitial(eInit);
  queue.push([a1.etatInitial, a2.etatInitial]);

  if (a1.etatsFinaux.has(a1.etatInitial) && a2.etatsFinaux.has(a2.etatInitial))
    auto.ajouterEtatFinal(eInit);

  while (queue.length > 0) {
    const [e1, e2] = queue.pop();
    const nom = nomEtat(e1, e2);
    if (visited.has(nom)) continue;
    visited.add(nom);

    for (const symbol of alphabet) {
      const succ1 = a1.obtenirEtatsSuivants(e1, symbol);
      const succ2 = a2.obtenirEtatsSuivants(e2, symbol);
      for (const s1 of succ1) {
        for (const s2 of succ2) {
          const newEtat = nomEtat(s1, s2);
          auto.ajouterEtat(newEtat);
          auto.ajouterTransition(nom, symbol, newEtat);
          if (
            a1.etatsFinaux.has(s1) &&
            a2.etatsFinaux.has(s2)
          )
            auto.ajouterEtatFinal(newEtat);
          queue.push([s1, s2]);
        }
      }
    }
  }

  return auto;
}
```

---

### ✅ 3. **Automate de Concaténation**

```js
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
```

---

Souhaites-tu aussi que je t’écrive :

* Les versions **visuellement traçables** dans React + Cytoscape ?
* Une **fonction d'affichage textuel** pour le console.log/debugging ?
* Ou des **tests avec des expressions régulières** pour générer les automates ?
