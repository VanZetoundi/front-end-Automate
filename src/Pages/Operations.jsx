import Navbar from "../components/Navbar";
import AutomateCard from "../components/AutomateCard";
import React, { useState } from 'react';
import { glushkovAutomaton2, intersectionAutomates, unionAutomates, concatAutomates, complementAutomate } from "../services/fonctions";
import { createAutomateFromData, formatAutomateToData } from "../services/utils";
import { AutomateClass } from "../services/AutomateClas";

const ClotureOperations = () => {
  const [regex1, setRegex1] = useState('');
  const [regex2, setRegex2] = useState('');
  const [operation, setOperation] = useState('union');
  const [automates, setAutomates] = useState([]);
  const [error, setError] = useState('');

  const onGenerateAutomate = (newAutomate) => {
    setAutomates((prev) => [...prev, newAutomate]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regex1 || (!regex2 && !['etoile', 'complement'].includes(operation))) {
      setError('Veuillez entrer les expressions régulières nécessaires.');
      return;
    }

    try {
      const auto1 = glushkovAutomaton2(regex1);

      if (!auto1) {
        setError("Erreur : L'expression régulière 1 est invalide.");
        return;
      }

      const auto2 = regex2 && !['etoile', 'complement'].includes(operation)
        ? glushkovAutomaton2(regex2)
        : null;

      if (!auto2 && !['etoile', 'complement'].includes(operation)) {
        setError("Erreur : L'expression régulière 2 est invalide.");
        return;
      }

      let result;

      switch (operation) {
        case 'union':
          result = unionAutomates(auto1, auto2);
          console.log(result)
          onGenerateAutomate({
            id: Date.now(),
            data: formatAutomateToData(result, "Intersection"),
          });
          break;

        case 'intersection':
          result = intersectionAutomates(auto1, auto2);
          console.log(result)
          onGenerateAutomate({
            id: Date.now(),
            data: formatAutomateToData(result, "Intersection"),
          });
          break;

        case 'concatenation':
          result = concatAutomates(auto1, auto2);
          console.log(result)
          onGenerateAutomate({
            id: Date.now(),
            data: formatAutomateToData(result, "Intersection"),
          });
          break;

        case 'etoile':
          const afe = auto1.etoile();
          onGenerateAutomate({
            id: Date.now(),
            data: formatAutomateToData(afe, "etoile"),
          });
          break;

        case 'complement':
          console.log("Début")
          const afc = complementAutomate(auto1);
          console.log(afc)
          onGenerateAutomate({
            id: Date.now(),
            data: formatAutomateToData(afc, "Complément Expr 1"),
          });
          break;

        default:
          throw new Error('Opération inconnue.');
      }

    } catch (err) {
      setError(`Erreur : ${err.message}`);
    }
  };

  const handleRemoveAutomate = (id) => {
    setAutomates((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <Navbar />
      <h1 className="text-[50px] md:text-[90px] max-w-4xl mx-auto scale-75 my-9 leading-none text-gray-950 font-light tracking-tight text-center">
        Applications des opérations de clôture
      </h1>
      <h2 className="text-[20px] md:text-[50px] my-5 text-sky-900 font-medium text-center max-w-4xl mx-auto scale-75">
        Entrez deux expressions régulières
      </h2>

      <div className="max-w-5xl mx-auto scale-75 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Expression régulière 1
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Ex. a+b"
                value={regex1}
                onChange={(e) => setRegex1(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">
                Expression régulière 2
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Ex. ab*"
                value={regex2}
                onChange={(e) => setRegex2(e.target.value)}
                disabled={['etoile', 'complement'].includes(operation)}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Opération
            </label>
            <select
              className="w-full border p-2 rounded"
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
            >
              <option value="union">Union</option>
              <option value="concatenation">Concaténation</option>
              <option value="intersection">Intersection</option>
              <option value="etoile">Étoile (sur Expr1)</option>
              <option value="complement">Complément (sur Expr1)</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Résoudre
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      <div className="mt-8 space-y-6 px-4 md:px-12">
        {automates.map((automate) => (
          <AutomateCard
            key={automate.id}
            id={automate.id}
            data={automate.data}
            onRemove={handleRemoveAutomate}
          />
        ))}
      </div>
    </div>
  );
};

export default ClotureOperations;
