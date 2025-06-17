import EquationSystem from "../components/EquationSystem"

function Home() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-blue-600">Bonjour 👋</h1>
      <p className="mt-4 text-gray-700">Bienvenue dans l’app d’automates</p>
      <EquationSystem />
    </div>
  )
}

export default Home