import Navbar from "../components/Navbar";
import EquationSystem from "../components/EquationSystem";

function EquationsSolver(){
    return (
        <div>
            <Navbar />
            <h1 className="text-[40px] md:text-[50px] my-9 leading-none text-gray-950 font-light tracking-tight text-balance text-center mx-auto">
                Résolutions de systèmes d'équations langagiers
            </h1>
            <h1 className="text-[20px] md:text-[50px] my-5 leading-none text-sky-900 font-medium tracking-tight text-balance text-center">
                Veuillez entrer votre système ci-dessous :
            </h1>
            <div className="flex justify-center items-center bg-gray-100 w-full">
                <EquationSystem />
            </div>

        </div>
    )
}

export default EquationsSolver;