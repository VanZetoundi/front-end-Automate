import { useState } from "react";
import AutomateGraph from "./AutomateGraph";
import { AutomateClass } from "../services/AutomateClas";

import {
  simplifierRegex,
  nettoyerExpression,
  formatAutomateToData,
  createAutomateFromData
}
from "../services/utils"

function AutomateCard({ id, data, onRemove, onGenerateAutomate }) {

  const [operations, setOperations] = useState({
    accessible: false,
    coAccessible: false,
    useless: false,
    AFToRegex : false,
    afnToAfd: false,
    afdToAfdc: false,
    minimize: false,
    epsilonFermeture: false,
    epsilonAfnToAfd: false,
    afdToAfn: false,
    thompson: false,
  });

  const [regexExpression, setRegexExpression] = useState(null);

  const handleOperation = (op, param = null) => {
    console.log('Données d\'entrée :', data);
    const auto = createAutomateFromData(data);
    const newData = { ...data };
    let updatedOperations = { ...operations, [op]: !operations[op] };

    if (op === "accessible") {
      data.accessibleStates = [...auto.etatsAccessibles()];
    } else if (op === "coAccessible") {
      data.coAccessibleStates = [...auto.etatsCoAccessibles()];
    } else if (op === "useless") {
      data.etatsUtiles = [...auto.etatsUtiles()];
    } else if (op === "epsilonFermeture") {
      if (!param) return; // Nécessite un état comme paramètre
      data.AllepsilonFermeture = auto.epsilonFermetureTousLesEtats();
    } else if (op === "AFToRegex") {
      data.regex = auto.toRegex();
      console.log(data.regex)
    }
    else if (op === "afnToAfd") {
      if (auto.estDeterministe()) {
        alert("Cet automate est déjà déterministe !");
        return;
      }
      const afd = auto.afnVersAfd();
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(afd, "AFN → AFD (local)"),
      });
    }
    else if (op === "afdToAfdc") {
      if (auto.estComplet()) {
        alert("Cet automate est déjà complet !");
        return;
      }
      const afdc = auto.afdVersAfdc();
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(afdc, "AFN → AFDC"),
      });
    } 
    else if (op === "minimize") {
      if (!auto.estDeterministe()) {
        alert("Cet automate n'est pas déterministe !");
        return;
      }
      if (auto.estMinimal()) {
        alert("Cet automate est déjà minimal !");
        return;
      }
      const afm = auto.afnVersAfdMinimal();
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(afm, "AFD → AFDM"),
      });
    } else if (op === "emoder") {
        
        const afe = auto.emonder();
        onGenerateAutomate({
          id: Date.now(),
          data: formatAutomateToData(afe, "AFD → AFDE"),
        });
    } else if (op === "afdToEpsilonAFN") {
        if (!auto.estDeterministe()) {
          alert("Cet automate n'est pas déterministe");
          return;
        }
        const eafn = auto.afdToEpsilonAfn();
        onGenerateAutomate({
          id: Date.now(),
          data: formatAutomateToData(eafn, "AFD → e-AFN"),
        });
    }else if (op === "epsilonAfnToAfn") {
        if (!auto.estepsilonAFN()) {
          alert("Cet automate n'est pas un epsilon AFN");
          return;
        }
        const eafna = auto.epsilonAfnToAfn();
        onGenerateAutomate({
          id: Date.now(),
          data: formatAutomateToData(eafna, "e-AFN → AFN"),
        });
    }
    else if (op === "afnToEpsilonAFN") {
        if (auto.estepsilonAFN()) {
          alert("Cet automate est déjà un epsilon AFN");
          return;
        }
        const eafn = auto.afnToEpsilonAfn();
        onGenerateAutomate({
          id: Date.now(),
          data: formatAutomateToData(eafn, "AFN → e-AFN"),
        });
    }
    else if (op === "afdToAFN") {
      if (!auto.estDeterministe()) {
          alert("Cet automate n'est pas déterministe");
          return;
      }
      const afn = auto.afdToAfn();
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(afn, "AFD → AFN"),
      });
    }else if (op === "canonisation") {
      const afca = auto.afdVersAfdCanonique();
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(afca, "AFD → AFCanonique"),
      });
    }

    setOperations(updatedOperations);
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-lg relative mb-6 md:max-w-5xl md:mx-auto">
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        X
      </button>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Automate #{id} ({data.type || "Manuel"})
      </h2>

      <div className="w-full flex flex-col md:flex-row gap-6 items-start">
        {/* Colonne gauche : le graphe */}
        <div className="w-2/3 border p-4 rounded shadow bg-white">
        <div className="flex flex-col">
          <AutomateGraph data={data} />
          <div>
            {operations.accessible && (
              <p><strong>États accessibles :</strong> {data.accessibleStates?.join(", ") || "Aucun"}</p>
            )}
            {operations.coAccessible && (
              <p><strong>États co-accessibles :</strong> {data.coAccessibleStates?.join(", ") || "Aucun"}</p>
            )}
            {operations.useless && (
              <p><strong>États utiles :</strong> {data.etatsUtiles?.join(", ") || "Aucun"}</p>
            )}
            {operations.AFToRegex && (
              <p><strong>Expression régulière :</strong> {data.regex ? simplifierRegex(nettoyerExpression(data.regex)) : "Aucun"}</p>
            )}
            {operations.epsilonFermeture && (
              <div>
                <p className="font-bold">ε-fermetures :</p>
                <ul className="list-disc list-inside">
                  {Object.entries(data.AllepsilonFermeture || {}).map(([etat, fermeture]) => (
                    <li key={etat}>
                      ε({etat}) = {fermeture.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {regexExpression && (
              <p><strong>Expression régulière :</strong> {regexExpression.replace(/ε/g, "") || "Aucune"}</p>
            )}
          </div>
        </div>
        </div>

        {/* Colonne droite : les infos + boutons */}
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="border p-4 rounded shadow bg-white">
            <p><strong>États :</strong> {data.states.join(", ")}</p>
            <p><strong>Alphabet :</strong> {data.alphabet?.join(", ") || "N/A"}</p>
            <p><strong>Initiaux :</strong> {data.initial?.join(", ") || "N/A"}</p>
            <p><strong>Finaux :</strong> {data.final?.join(", ") || "N/A"}</p>
            <p><strong>Transitions :</strong> {JSON.stringify(data.transitions)}</p>

          </div>

          {/* Boutons d'opérations */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { op: "accessible", label: "États Accessibles", color: "sky" },
              { op: "coAccessible", label: "États Co-Accessibles", color: "dark" },
              { op: "useless", label: "États Utiles", color: "dark" },
              { op: "epsilonFermeture", label: "ε-Fermeture", color: "dark", arg: data.states[0] },
              { op: "AFToRegex", label: "AF → Regex", color: "gray" },
              { op: "afnToAfd", label: "Déterminiser", color: "dark" },
              { op: "afdToAfdc", label: "Compléter", color: "indigo" },
              { op: "minimize", label: "Minimiser", color: "dark" },
              { op: "emoder", label: "Emonder", color: "pink" },
              { op: "afdToEpsilonAFN", label: "AFD → ε-AFN", color: "dark" },
              { op: "afdToAFN", label: "AFD → AFN", color: "gray" },
              { op: "epsilonAfnToAfn", label: "ε-AFN → AFN", color: "dark" },
              { op: "afnToEpsilonAFN", label: "AFN → ε-AFN", color: "dark" },
              { op: "canonisation", label: "Canoniser", color: "sky" },
            ].map(({ op, label, color, arg }) => (
              <button
                key={op}
                onClick={() => handleOperation(op, arg)}
                className={`bg-${color}-500 text-white px-3 py-1 rounded hover:bg-${color}-600 text-sm`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default AutomateCard;