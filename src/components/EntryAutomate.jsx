import { useState } from "react";

function EntryAutomate({ onGenerateAutomate }) {
  
  const [alphabet, setAlphabet] = useState("");
  const [states, setStates] = useState("");
  const [initialStates, setInitialStates] = useState("");
  const [finalStates, setFinalStates] = useState("");
  const [transitions, setTransitions] = useState({});

  const handleSubmit = () => {
    const statesList = states.split(",").map((s) => s.trim()).filter(Boolean);
    const alphabetList = alphabet.split(",").map((s) => s.trim()).filter(Boolean);
    const newAutomate = {
      id: Date.now(),
      data: {
        states: statesList,
        alphabet: alphabetList,
        initial: initialStates.split(",").map((s) => s.trim()).filter(Boolean),
        final: finalStates.split(",").map((s) => s.trim()).filter(Boolean),
        transitions,
      },
      
    };
    console.log(newAutomate)
    onGenerateAutomate(newAutomate);
  };

  const addTransition = (fromState, symbol, toStatesString) => {
    const toStates = toStatesString.split(",").map((s) => s.trim()).filter(Boolean);
    setTransitions((prev) => ({
      ...prev,
      [fromState]: {
        ...prev[fromState],
        [symbol]: toStates,
      },
    }));
  };

  const alphabetArray = ["ε", ...alphabet.split(",").map((s) => s.trim()).filter(Boolean)];
  const statesArray = states.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Entrée Manuelle d'Automate
      </h2>
      <div className="space-y-4">
        <input
          type="text"
          value={alphabet}
          onChange={(e) => setAlphabet(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Alphabet (ex: a,b)"
        />
        <input
          type="text"
          value={states}
          onChange={(e) => setStates(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="États (ex: q0,q1,q2)"
        />
        <input
          type="text"
          value={initialStates}
          onChange={(e) => setInitialStates(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="États initiaux (ex: q0)"
        />
        <input
          type="text"
          value={finalStates}
          onChange={(e) => setFinalStates(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="États finaux (ex: q2)"
          onBlur={handleSubmit}
        />

        <div>
          <h3 className="text-lg font-medium mb-2">Table de transitions</h3>
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-400">
              <thead>
                <tr>
                  <th className="border p-2">États</th>
                  {alphabetArray.map((sym) => (
                    <th key={sym} className="border p-2">{sym}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statesArray.map((state) => (
                  <tr key={state}>
                    <td className="border p-2 font-medium">{state}</td>
                    {alphabetArray.map((symbol) => (
                      <td key={`${state}-${symbol}`} className="border p-1">
                        <input
                          type="text"
                          placeholder="q1,q2"
                          className="w-full p-1 border rounded"
                          onChange={(e) => addTransition(state, symbol, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-dark-900 text-white px-4 py-2 rounded hover:bg-sky-900"
        >
          Afficher Automate
        </button>
      </div>
    </div>
  );
}

export default EntryAutomate;
