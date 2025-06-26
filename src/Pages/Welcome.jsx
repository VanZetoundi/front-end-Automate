import { Link } from "react-router-dom";

function Welcome() {
  return (
    <div className="relative flex flex-col justify-center min-h-screen bg-gray-100 px-8 py-12 overflow-hidden">
      
      {/* Background Animated Bubbles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full animate-bubble-slow opacity-20">
          <div className="w-96 h-96 bg-sky-300 rounded-full blur-3xl absolute top-10 left-10"></div>
          <div className="w-72 h-72 bg-indigo-300 rounded-full blur-3xl absolute bottom-20 right-20"></div>
          <div className="w-80 h-80 bg-purple-300 rounded-full blur-3xl absolute top-1/2 left-1/3"></div>
        </div>
      </div>

      {/* Foreground Content */}
      <div className="w-full">
        <h1 className="text-[70px] md:text-[120px] sm:text-[100px] leading-none text-gray-950 font-light tracking-tight text-balance">
          Design, test, and simulate automata –
        </h1>
        <h1 className="text-[30px] md:text-[70px] leading-none text-sky-800 font-bold tracking-tight text-balance">
          All in one interactive workspace.
        </h1>

        <h3 className="text-[15px] md:text-2xl text-gray-700 font-medium mt-6">
          Une plateforme intuitive pour apprendre et manipuler les automates finis, pas à pas.
        </h3>

        <Link
          to="/Home"
          className="mt-4 sm:mt-8 inline-block bg-black text-white px-2 py-2 md:px-6 md:py-3 rounded-full text-[15px] md:text-lg font-semibold shadow hover:bg-gray-800 transition duration-200"
        >
          Commencer
        </Link>
      </div>
    </div>
  );
}

export default Welcome;
