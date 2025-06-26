import { Link } from "react-router-dom";

const MenuCard = ({ title, subtitle, description, to }) => (
  <Link to={to} className="flex flex-col items-center p-7 rounded-2xl shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
    <div className="text-2xl font-bold text-center text-sky-600">{title}</div>
    <div className="text-xl font-medium text-gray-800 dark:text-white mt-2 text-center">{subtitle}</div>
    <div className="text-gray-600 dark:text-gray-300 text-center mt-4 max-w-xs">{description}</div>
  </Link>
);

const menuItems = [
  {
    title: "Automates",
    subtitle: "Opérations sur les automates",
    description: "Déterminisation, minimisation, canonisation et autres opérations fondamentales liées aux automates.",
    to: "/automate",
  },
  {
    title: "Clôture",
    subtitle: "Opérations de clôture",
    description: "Union, intersection, complémentation, concaténation, étoile de Kleene et autres opérations sur les langages.",
    to: "/clôture",
  },
  {
    title: "Équations",
    subtitle: "Résolution d'équations",
    description: "Méthodes algébriques de résolution de systèmes d’équations pour langages rationnels et expressions régulières.",
    to: "/équations",
  },
];

const MenuGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
    {menuItems.map((item, index) => (
      <MenuCard key={index} {...item} />
    ))}
  </div>
);

export default MenuGrid;