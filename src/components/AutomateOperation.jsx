import { useState } from "react";
import EntryAutomate from "./EntryAutomate";

import {
  unionAutomata,
  intersectionAutomata,
  complementAutomaton,
  concatenationAutomata,
  etoileAutomaton,
} from "../services/api";

function AutomateOperationsPage({ onGenerateAutomate }) {
  const [automate1, setAutomate1] = useState(null);
  const [automate2, setAutomate2] = useState(null);
  const [error, setError] = useState("");

  const handleOperation = async (operation) => {
    if (!automate1 || (!automate2 && !["complement", "etoile"].includes(operation))) {
        setError("Veuillez entrer les deux automates.");
        return;
    }

    setError("");

    try {
        const auto1 = formatAutomateToApi(automate1.data);
        const auto2 = automate2 ? formatAutomateToApi(automate2.data) : null;
        console.log(auto1)

        let result;

        switch (operation) {
        case "union":
            result = await unionAutomata(auto1, auto2);
            break;
        case "intersection":
            result = await intersectionAutomata(auto1, auto2);
            break;
        case "concatenation":
            result = await concatenationAutomata(auto1, auto2);
            break;
        case "complement":
            result = await complementAutomaton(auto1);
            break;
        case "etoile":
            result = await etoileAutomaton(auto1);
            break;
        default:
            throw new Error("Opération inconnue.");
        }

        const formatted = formatApiToAutomate(result, `Résultat: ${operation}`);
        console.log(formatted)
        onGenerateAutomate(formatted);
    } catch (err) {
        setError(`Erreur: ${err.message}`);
    }
    };

  return (
    <div className="p-6">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex flex-col md:flex-row gap-6">
        <EntryAutomate onGenerateAutomate={setAutomate1} />
        <EntryAutomate onGenerateAutomate={setAutomate2} />
      </div>

      <div className="flex flex-wrap gap-5 mt-6 w-[100%]">
        <button
          onClick={() => handleOperation("union")}
          className="bg-sky-900 text-white px-4 py-2 rounded hover:bg-sky-600"
        >
          Union
        </button>
        <button
          onClick={() => handleOperation("intersection")}
          className="bg-dark-800 text-white px-4 py-2 rounded hover:bg-dark-600"
        >
          Intersection
        </button>
        <button
          onClick={() => handleOperation("concatenation")}
          className="bg-sky-700 text-white px-4 py-2 rounded hover:bg-sky-900"
        >
          Concaténation
        </button>
        <button
          onClick={() => handleOperation("complement")}
          className="bg-dark-700 text-white px-4 py-2 rounded hover:bg-dark-900"
        >
          Complément (Automate 1)
        </button>
        <button
          onClick={() => handleOperation("etoile")}
          className="bg-dark-800 text-white px-4 py-2 rounded hover:bg-dark-600"
        >
          Étoile (Automate 1)
        </button>
      </div>
    </div>
  );
}

export default AutomateOperationsPage;
