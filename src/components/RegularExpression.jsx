import { useState } from "react";
import { glushkovAutomaton, thompsonFromRegex2, glushkovAutomaton2 } from "../services/fonctions";
import { formatAutomateToData } from "../services/utils";

function RegularExpression({ onGenerateAutomate }) {
  const [expression, setExpression] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = (method) => {
    if (!expression) {
      setError("Veuillez entrer une expression régulière.");
      return;
    }
    setError("");

    if (method === "Thompson") {
              
      const thompson = thompsonFromRegex2(expression);
      console.log(thompson)
      console.log(formatAutomateToData(thompson))
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(thompson, "Expression → Automate de Thompson"),
      });
      
    } 
    else {
      const glushkov = glushkovAutomaton2(expression);
      onGenerateAutomate({
        id: Date.now(),
        data: formatAutomateToData(glushkov, "Expression → Automate de Glushkov"),
    });
  }

  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-[100%] mx-auto flex-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Expression Régulière
      </h2>
      <input
        type="text"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        placeholder="Ex: (a|b)*ab"
      />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex flex-col space-y-4 space-x-">
        <button
          onClick={() => handleGenerate("Thompson")}
          className="bg-sky-900 text-white px-4 py-2 rounded hover:bg-sky-500"
        >
          Thompson
        </button>
        <button
          onClick={() => handleGenerate("Glushkov")}
          className="bg-dark-800 text-white px-4 py-2 rounded hover:bg-dark-600"
        >
          Glushkov
        </button>
      </div>
    </div>
  );
}

export default RegularExpression;