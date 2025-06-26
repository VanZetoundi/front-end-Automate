// Fonctions hors classe (à implémenter séparément)
// Expression régulière → automate de Thompson

function thompsonFromRegex(regex) {
    // TODO: Retourne un automate avec transitions ε correspondant à l’expression régulière
    pass;
}

// Expression régulière → automate de Glushkov
function glushkovFromRegex(regex) {
    // TODO: Retourne un automate sans ε-transitions correspondant à l’expression régulière
    pass;
}

// Résolution d’un système d’équations langagières (SEL)
function resoudreSEL(systemeEquations) {
    // TODO: Résout le système pour en déduire les expressions régulières de chaque variable
    pass;
}

// Union de deux automates
function union(automate1, automate2) {
    // TODO: Retourne un automate reconnaissant l’union des deux langages
    pass;
}

// Concaténation
function concatenation(automate1, automate2) {
    // TODO: Retourne un automate reconnaissant la concaténation des deux langages
    pass;
}

// Étoile (Kleene)
function etoile(automate) {
    // TODO: Retourne un automate reconnaissant le langage étoile de l’entrée
    pass;
}

// Complémentaire
function complementaire(automate) {
    // TODO: Inverse les états finaux sur un AFD complet
    pass;
}

// Intersection
function intersection(automate1, automate2) {
    // TODO: Produit cartésien des deux automates pour reconnaître leur intersection
    pass;
}