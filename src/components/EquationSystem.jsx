import React, { useState } from 'react';

const EquationSystem = () => {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState(null);

  const parseEquations = (input) => {
    const lines = input.trim().split('\n').map(line => line.trim()).filter(Boolean);
    const equations = [];
    const vars = new Set();
    const epsilonVars = new Set(); // Track variables with ε in their equation
    const validVarRegex = /^x\d+$/;
    const validSymbolRegex = /^[a-zA-Zε$|^*()+]*$/;

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes('=')) {
        return { error: `Erreur : L'équation à la ligne ${i + 1} ne contient pas de signe '='.` };
      }

      const [left, right] = lines[i].split('=').map(s => s.trim());
      if (!validVarRegex.test(left)) {
        return { error: `Erreur : Variable invalide (${left}) à la ligne ${i + 1}. Utilisez x1, x2, etc.` };
      }

      vars.add(left);
      const terms = right === 'ε' ? ['ε'] : right.split('+').map(term => term.trim()).filter(Boolean);

      if (terms.includes('ε')) {
        epsilonVars.add(left); // Mark this variable as having ε in its equation
      }

      const parsedTerms = terms.map(term => {
        const match = term.match(/^([a-zA-Zε*()|]+)?(x\d+)?$/);
        if (!match) {
          return { error: `Erreur : Terme invalide (${term}) à la ligne ${i + 1}.` };
        }

        let [, coefPart, varNamePart] = match;
        let coef = coefPart || '';
        let varName = varNamePart || '';

        if (term.match(/^x\d+$/) && !coef) {
          coef = '';
        } else if (term === 'ε') {
          coef = 'ε';
          varName = '';
        } else if (!varName && coef) {
          varName = '';
        }

        if (coef && !validSymbolRegex.test(coef)) {
          return { error: `Erreur : Coefficient invalide (${coef}) à la ligne ${i + 1}.` };
        }

        return { coef, varName };
      });

      for (const term of parsedTerms) {
        if (term.error) return term;
      }

      equations.push({ left, terms: parsedTerms });
    }

    return { equations, vars: Array.from(vars).sort(), epsilonVars };
  };

  const needsParentheses = (expr) => {
    return expr.includes('+') || expr.includes('|') || (expr.includes('*') && expr.length > 1);
  };

  const simplify = (expr, preserveEpsilon = false) => {
    if (!expr) return 'ε';
    let simplified = expr;
    let prev;
    do {
      prev = simplified;
      simplified = simplified
        .replace(/\bε\*/g, 'ε') // ε* → ε
        .replace(/\+{2,}/g, '+') // Multiple + → single +
        .replace(/\+\)/g, ')') // Remove + before )
        .replace(/\(\+/g, '(') // Remove + after (
        .replace(/^\+|\+$/g, '') // Remove + at start/end
        .replace(/\(\)/g, 'ε') // () → ε
        .replace(/\s+/g, '') // Remove spaces
        .replace(/εε/g, 'ε') // εε → ε
        .replace(/(\(|\)|^)([a-zA-Zε*]+)(\)|\(|$)/g, (match, p1, p2, p3) => {
          if (p1 === '(' && p3 === ')') return p2;
          return match;
        })
        .replace(/\(([a-zA-Zε*]+)\)\*/g, '$1*') // (a)* → a*
        .replace(/\(([^()]+)\)\+/g, '$1+') // (a+b)+ → a+b
        .replace(/\(ε\)/g, 'ε') // (ε) → ε
        .replace(/([a-zA-Z])\*([a-zA-Z])/g, '$1*$2') // Ensure * is clear
        .trim();
      if (!preserveEpsilon) {
        simplified = simplified.replace(/\+?ε(\+)?/g, (match, p1) => p1 ? '+' : ''); // Remove ε in sums unless preserveEpsilon
      }
    } while (simplified !== prev);
    return simplified || 'ε';
  };

  const simplifyConcat = (a, b, preserveEpsilon = false) => {
    if (a === 'ε') return b;
    if (b === 'ε') return a;
    if (!a) return b;
    if (!b) return a;
    if (!a && !b) return 'ε';
    const formattedA = needsParentheses(a) && a !== 'ε' ? `(${a})` : a;
    const formattedB = needsParentheses(b) && b !== 'ε' ? `(${b})` : b;
    return simplify(`${formattedA}${formattedB}`, preserveEpsilon);
  };

  const parseTermes = (expression) => {
    const terms = expression.split('+').map(t => t.trim()).filter(Boolean);
    if (terms.length === 0) return [{ coef: 'ε', varName: '' }];

    return terms.map(term => {
      const varMatch = term.match(/(x\d+)$/);
      if (varMatch) {
        const varName = varMatch[1];
        const coef = simplify(term.substring(0, term.length - varName.length));
        return { coef: coef || '', varName };
      } else {
        return { coef: simplify(term), varName: '' };
      }
    });
  };

  const termesToStr = (termes, preserveEpsilon = false) => {
    if (termes.length === 0) return 'ε';
    const validTerms = preserveEpsilon
      ? termes
      : termes.filter(t => t.coef !== 'ε' || t.varName || termes.length === 1);
    if (validTerms.length === 0) return 'ε';
    return validTerms.map(t => {
      if (t.coef === 'ε' && !t.varName) return 'ε';
      return `${t.coef}${t.varName}`;
    }).filter(Boolean).join(' + ');
  };

  const extraireRecursion = (xi, termes) => {
    const A_parts = [];
    const B_terms = [];
    for (const term of termes) {
      if (term.varName === xi) {
        A_parts.push(term.coef || 'ε');
      } else {
        B_terms.push(term);
      }
    }

    let A_combined = null;
    if (A_parts.length > 0) {
      A_combined = A_parts.length > 1 ? simplify(`(${A_parts.join(' + ')})`) : simplify(A_parts[0]);
      if (A_combined === 'ε') A_combined = null;
    }

    return [A_combined, B_terms];
  };

  const remplacer = (currentTerms, varToReplace, replacementTerms, preserveEpsilon = false) => {
    let changed = false;
    const nouveaux = [];

    for (const currentTerm of currentTerms) {
      if (currentTerm.varName === varToReplace) {
        changed = true;
        const prefixe = currentTerm.coef || '';
        for (const replacementTerm of replacementTerms) {
          const newCoef = simplifyConcat(prefixe, replacementTerm.coef || replacementTerm.varName || 'ε', preserveEpsilon);
          nouveaux.push({ coef: simplify(newCoef, preserveEpsilon), varName: replacementTerm.varName });
        }
      } else {
        nouveaux.push(currentTerm);
      }
    }
    return changed ? parseTermes(simplify(termesToStr(nouveaux, preserveEpsilon), preserveEpsilon)) : null;
  };

  const resolveRegexSystem = (equations, vars, epsilonVars) => {
    const systeme = new Map();

    // Initialiser le système
    for (const eq of equations) {
      systeme.set(eq.left, parseTermes(termesToStr(eq.terms, true)));
    }

    let changed = true;
    const maxIterations = 100;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      for (const xi of vars) {
        let termes = systeme.get(xi);
        const [A, B_terms] = extraireRecursion(xi, termes);
        if (A) {
          const B_str = termesToStr(B_terms, epsilonVars.has(xi));
          const resolvante = simplify(
            A === 'ε' ? B_str || 'ε' : `${needsParentheses(A) ? `(${A})` : A}*${needsParentheses(B_str) ? `(${B_str})` : B_str || 'ε'}`,
            epsilonVars.has(xi)
          );
          const newTerms = parseTermes(resolvante);
          if (termesToStr(newTerms, epsilonVars.has(xi)) !== termesToStr(termes, epsilonVars.has(xi))) {
            systeme.set(xi, newTerms);
            changed = true;
          }
        }

        for (const xj of vars) {
          if (xj === xi) continue;
          const termsOfXj = systeme.get(xj);
          const replaced = remplacer(termsOfXj, xi, systeme.get(xi), epsilonVars.has(xj));
          if (replaced) {
            systeme.set(xj, replaced);
            changed = true;
          }
        }

        for (const xj of vars) {
          const terms = systeme.get(xj);
          const simplified = parseTermes(simplify(termesToStr(terms, epsilonVars.has(xj)), epsilonVars.has(xj)));
          systeme.set(xj, simplified);
        }
      }
    }

    const resultats = {};
    for (const variable of vars) {
      const expr = termesToStr(systeme.get(variable), epsilonVars.has(variable));
      // If the variable had ε in its original equation, append + ε to the solution
      resultats[variable] = epsilonVars.has(variable) ? simplify(`${expr}+ε`, true) : simplify(expr);
    }
    return vars.map(v => `${v} = ${resultats[v] || 'ε'}`);
  };

  const handleSolve = () => {
    const parsed = parseEquations(inputText);
    if (parsed.error) {
      setResult({ error: parsed.error });
      return;
    }

    const { equations, vars, epsilonVars } = parsed;
    try {
      const solution = resolveRegexSystem(equations, vars, epsilonVars);
      setResult({
        equations: equations.map(eq => `${eq.left} = ${termesToStr(eq.terms, true)}`),
        solution
      });
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  return (
    <div className="p-6 flex flex-col items-start w-[1000px]">
      <div className="inline-block border rounded p-4 bg-white shadow relative w-full">
        <h3 className="font-semibold text-lg mb-2">Entrez le système d'équations :</h3>
        <textarea
          className="w-full h-40 border p-2 resize-y"
          placeholder="Exemple :\nx1 = ax2 + ε\nx2 = bx1 + a"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          onClick={handleSolve}
          className="bg-gray-900 text-white px-3 py-1 mt-2 rounded w-full"
        >
          Résoudre
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 border rounded shadow max-w-xl w-full">
          {result.error ? (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-red-600">Erreur :</h3>
              <p className="text-sm text-gray-800">{result.error}</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg mb-2">Système saisi :</h3>
              <pre className="text-sm text-gray-800 mb-4">
                {result.equations.join('\n')}
              </pre>
              <h3 className="font-semibold text-lg mb-2">Solution :</h3>
              <pre className="text-sm text-gray-800">
                {result.solution.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquationSystem;