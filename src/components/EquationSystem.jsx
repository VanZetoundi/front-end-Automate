import React, { useState } from "react";

const EquationSystem = () => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [matrix, setMatrix] = useState(
    Array(3)
      .fill(0)
      .map(() => Array(4).fill(""))
  );

  const handleChange = (i, j, value) => {
    const newMatrix = [...matrix];
    newMatrix[i][j] = value;
    setMatrix(newMatrix);
  };

  const addRow = () => {
    setMatrix([...matrix, Array(cols + 1).fill("")]);
    setRows(rows + 1);
  };

  const removeRow = () => {
    if (rows > 1) {
      setMatrix(matrix.slice(0, -1));
      setRows(rows - 1);
    }
  };

  const addCol = () => {
    const newMatrix = matrix.map(row => [...row.slice(0, -1), "", row[row.length - 1]]);
    newMatrix.forEach(row => row.splice(cols, 0, "")); // Ajouter une colonne avant le "="
    setMatrix(newMatrix);
    setCols(cols + 1);
  };

  const removeCol = () => {
    if (cols > 1) {
      const newMatrix = matrix.map(row => {
        const newRow = [...row];
        newRow.splice(cols - 1, 1); // Enlever une variable avant le "="
        return newRow;
      });
      setMatrix(newMatrix);
      setCols(cols - 1);
    }
  };

  return (
    <div className="p-4">
      <div className="inline-block border rounded p-2 bg-white shadow">
        <div className="space-y-2">
          {matrix.map((row, i) => (
            <div key={i} className="flex items-center space-x-2">
              {row.map((val, j) => (
                <div key={j} className="flex items-center">
                  <input
                    type="text"
                    className="w-12 border p-1 text-center"
                    value={val}
                    onChange={(e) => handleChange(i, j, e.target.value)}
                  />
                  {j < row.length - 2 && <span className="mx-1">x<sub>{j + 1}</sub> +</span>}
                  {j === row.length - 2 && <span className="mx-1">x<sub>{j + 1}</sub> =</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={addRow} className="bg-blue-500 text-white px-2 py-1 rounded">+ Ligne</button>
          <button onClick={removeRow} className="bg-red-500 text-white px-2 py-1 rounded">- Ligne</button>
          <button onClick={addCol} className="bg-blue-500 text-white px-2 py-1 rounded">+ Colonne</button>
          <button onClick={removeCol} className="bg-red-500 text-white px-2 py-1 rounded">- Colonne</button>
        </div>
      </div>
    </div>
  );
};

export default EquationSystem;
