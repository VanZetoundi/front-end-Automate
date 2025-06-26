import Navbar from "../components/Navbar"
import MenuGrid from "../components/MenuGrid"

function Home() {
  return (
    <div>
      <Navbar />
      <div className="bg-gray-100 max-w-5xl mx-auto">
        <h1 className="text-[40px] md:text-[100px] my-9 leading-none text-gray-950 font-light tracking-tight text-balance text-center">
            Bienvenue sur AutomataSimul
        </h1>
        <h1 className="text-[20px] md:text-[60px] my-5 leading-none text-sky-900 font-medium tracking-tight text-balance text-center">
            Quelles opérations voulez-vous éffectuez ?
        </h1>

        <div className="display-flex">
          <MenuGrid />
        </div>
      </div>
    </div>
  )
}

export default Home