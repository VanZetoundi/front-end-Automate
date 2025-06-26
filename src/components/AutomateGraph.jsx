import CytoscapeComponent from "react-cytoscapejs";
import { useEffect, useState } from "react";

function AutomateGraph({ data }) {
  const [height, setHeight] = useState("400px");

  // Réagir à la taille de l'écran
  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth <= 768;
      setHeight(isMobile ? "200px" : "400px");
    };

    updateSize(); // initial
    window.addEventListener("resize", updateSize); // maj dynamique

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const elements = [];

  // Noeuds
  data.states.forEach((state) => {
    let classes = "";
    if (data.final.includes(state)) classes += " final";
    if (data.initial.includes(state)) classes += " initial";

    elements.push({
      data: { id: state, label: state },
      classes: classes.trim(),
    });
  });

  // Arêtes (transitions)
  for (const [from, transitions] of Object.entries(data.transitions)) {
    for (const [symbol, to] of Object.entries(transitions)) {
      const targets = Array.isArray(to) ? to : [to];
      targets.forEach((target) => {
        if (target) {
          elements.push({
            data: { source: from, target: target, label: symbol },
          });
        }
      });
    }
  }

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: "100%", height }}
      layout={{ name: "circle" }}
      stylesheet={[
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "background-color": "#4f46e5",
            "font-size": "10px",
            "width": "30px",
            "height": "30px",
            color: "#fff",
            "text-outline-color": "#4f46e5",
            "text-outline-width": 2,
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "font-size": "8px",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "line-color": "#999",
            "target-arrow-color": "#999",
          },
        },
        {
          selector: ".initial",
          style: {
            "background-color": "#000",
          },
        },
        {
          selector: ".final",
          style: {
            "background-color": "#10b981",
          },
        },
      ]}
    />
  );
}

export default AutomateGraph;
