import { useState } from "react";
import Navbar from "../components/Navbar";
import RegularExpression from "../components/RegularExpression";
import EntryAutomate from "../components/EntryAutomate";
import AutomateCard from "../components/AutomateCard";

function Automate() {
  const [automates, setAutomates] = useState([]);

  const handleGenerateAutomate = (newAutomate) => {
    setAutomates((prev) => [...prev, newAutomate]);
  };

  const handleRemoveAutomate = (id) => {
    setAutomates((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div>
      <Navbar />
      <h1 className="scale-75 text-[50px] md:text-[100px] my-9 leading-none text-gray-950 font-light tracking-tight text-balance text-center">
        Opérations sur les automates
      </h1>
      <h2 className="text-[20px] md:text-[50px] my-5 leading-none text-sky-900 font-medium tracking-tight text-balance text-center">
        Veuillez choisir la méthode de votre choix pour entrer votre automate.
      </h2>

      <div className="scale-75 flex flex-col justify-center items-center md:flex-row md:items-start gap-4 justify-center max-w-5xl mx-auto">
        <div>
          <RegularExpression onGenerateAutomate={handleGenerateAutomate} />
        </div>
        <div>
          <EntryAutomate onGenerateAutomate={handleGenerateAutomate} />
        </div>
      </div>

      <div className="mt-0 space-y-6 px-4 md:px-12 scale-75">

        {automates.map((automate) => (
          <AutomateCard
            key={automate.id}
            id={automate.id}
            data={automate.data}
            onRemove={handleRemoveAutomate}
            onGenerateAutomate={handleGenerateAutomate}
          />
        ))}
      </div>
    </div>
  );
}

export default Automate;
