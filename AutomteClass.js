class AutomateClass {
    constructor(alphabet = null) {
        this.etats = new Set();
        this.alphabet = new Set(alphabet || []);
        this.transitions = new Map(); // (état, symbole) → Set(états cibles)
        this.etatInitial = null;
        this.etatsFinaux = new Set();
    }

    // --- GESTION DES ÉTATS ---
    ajouterEtat(etat) {
        this.etats.add(etat);
    }

    supprimerEtat(etat) {
        this.etats.delete(etat);
        const newTransitions = new Map();
        for (const [key, value] of this.transitions) {
            const [e, s] = key.split('|');
            if (e !== etat && !value.has(etat)) {
                newTransitions.set(`${e}|${s}`, value);
            }
        }
        this.transitions = newTransitions;
        this.etatsFinaux.delete(etat);
        if (this.etatInitial === etat) {
            this.etatInitial = null;
        }
    }

    fixerEtatInitial(etat) {
        if (!this.etats.has(etat)) {
            throw new Error("L'état initial doit appartenir à l'automate.");
        }
        this.etatInitial = etat;
    }

    ajouterEtatFinal(etat) {
        if (!this.etats.has(etat)) {
            throw new Error("L'état doit être dans l'ensemble des états.");
        }
        this.etatsFinaux.add(etat);
    }

    supprimerEtatFinal(etat) {
        this.etatsFinaux.delete(etat);
    }

    // --- GESTION DES TRANSITIONS ---
   ajouterTransition(etatSource, symbole, etatsCibles) {
        symbole = symbole.trim();
        // 🛠️ Force etatsCibles à être un tableau
        const cibles = Array.isArray(etatsCibles) ? etatsCibles : [etatsCibles];

        if (symbole !== 'ε' && !this.alphabet.has(symbole)) {
            throw new Error( {symbole} + "Symbole non reconnu.");
        }

        if (!this.etats.has(etatSource) || !cibles.every(e => this.etats.has(e))) {
            throw new Error("États non valides.");
        }

        const cle = `${etatSource}|${symbole}`;
        if (!this.transitions.has(cle)) {
            this.transitions.set(cle, new Set());
        }

        cibles.forEach(e => this.transitions.get(cle).add(e));
    }

    supprimerTransition(etatSource, symbole) {
        this.transitions.delete(`${etatSource}|${symbole}`);
    }

    obtenirEtatsSuivants(etat, symbole) {
        return this.transitions.get(`${etat}|${symbole}`) || new Set();
    }

    // --- AFFICHAGE ---
    afficher() {
        console.log("États :", [...this.etats]);
        console.log("Alphabet :", [...this.alphabet]);
        console.log("Transitions :");
        for (const [key, value] of this.transitions) {
            const [e, s] = key.split('|');
            console.log(`  ${e} --${s}--> ${[...value]}`);
        }
        console.log("État initial :", this.etatInitial);
        console.log("États finaux :", [...this.etatsFinaux]);
    }
    
    epsilonFermeture(etats) {
        let pile = [...etats];
        let fermeture = new Set(etats);

        while (pile.length > 0) {
            let etat = pile.pop();
            let cle = `${etat}|ε`;
            if (this.transitions.has(cle)) {
            for (let succ of this.transitions.get(cle)) {
                if (!fermeture.has(succ)) {
                fermeture.add(succ);
                pile.push(succ);
                }
            }
            }
        }

        return fermeture;
        }

    epsilonFermetureTousLesEtats() {
        const resultat = {};
        for (const etat of this.etats) {
            resultat[etat] = Array.from(this.epsilonFermeture([etat]));
        }
        return resultat;
    }

    // --- ÉTATS ACCESSIBLES ---
    etatsAccessibles() {
        if (!this.etatInitial || !this.etats.has(this.etatInitial)) {
            console.warn("État initial non défini ou invalide.");
            return new Set();
        }

        const accessibles = new Set([this.etatInitial]);
        console.log(accessibles)
        const pile = [this.etatInitial];

        while (pile.length > 0) {
            const e = pile.pop();
            for (const symbole of [...this.alphabet, 'ε']) {
                const cibles = this.obtenirEtatsSuivants(e, symbole) || new Set();
                for (const c of cibles) {
                    if (!accessibles.has(c)) {
                        accessibles.add(c);
                        pile.push(c);
                    }
                }
            }
        }

        console.log(accessibles)
        return accessibles;
    }

    // --- ÉTATS CO-ACCESSIBLES ---
    etatsCoAccessibles() {
        const coAccessibles = new Set(this.etatsFinaux);
        const pile = [...this.etatsFinaux];
        const transitionsInverses = new Map();

        for (const [key, value] of this.transitions) {
            const [e, s] = key.split('|');
            for (const cible of value) {
                const cle = `${cible}|${s}`;
                if (!transitionsInverses.has(cle)) {
                    transitionsInverses.set(cle, new Set());
                }
                transitionsInverses.get(cle).add(e);
            }
        }

        while (pile.length > 0) {
            const e = pile.pop();
            for (const symbole of [...this.alphabet, 'ε']) {
                const origines = transitionsInverses.get(`${e}|${symbole}`) || new Set();
                for (const o of origines) {
                    if (!coAccessibles.has(o)) {
                        coAccessibles.add(o);
                        pile.push(o);
                    }
                }
            }
        }

        return coAccessibles;
    }

    // --- ÉTATS UTILES ---
    etatsUtiles() {
        const accessibles = this.etatsAccessibles();
        const coAccessibles = this.etatsCoAccessibles();
        return new Set([...accessibles].filter(e => coAccessibles.has(e)));
    }

     // --- SCHEMAS À REMPLIR PAR LES AUTRES MEMBRES DU GROUPE ---

    // Détermine si l'automate est déterministe
    estDeterministe() {
        // TODO: Retourne true si chaque couple (état, symbole) mène à au plus un état
        pass;
    }

    // Transforme un AFN en AFD
    afnVersAfd() {
        // TODO: Applique l’algorithme de déterminisation par sous-ensembles
        pass;
    }

    // Vérifie si l’automate est complet
    estComplet() {
        // TODO: Vérifie que pour chaque état et chaque symbole de l’alphabet, il existe une transition
        pass;
    }

    // Transforme un AFD en un AFD complet
    afdVersAfdc() {
        // TODO: Crée des états puits s'il y'en a des etats qui n'ont pas des transitions sur des lettres de l'alphabet
        pass;
    }

    // Transforme un AFN en AFN émondé (supprime états inutiles)
    afnVersAfnEmonde() {
        // TODO: Conserve seulement les états accessibles et coaccessibles
        pass;
    }

    // Vérifie si l’automate est un epsilon-AFN
    estEpsilonAfn() {
        // TODO: Vérifie s’il existe des transitions ε
        pass;
    }

    // Transforme un AFN en epsilon-AFN
    afnVersEpsilonAfn() {
        // TODO: Ajoute des ε-transitions sans modifier le langage reconnu
        pass;
    }

    // Transforme un epsilon-AFN en AFN
    epsilonAfnVersAfn() {
        // TODO: Supprime les ε-transitions via fermeture epsilon
        pass;
    }

    // Transforme un AFD en epsilon-AFN
    afdVersEpsilonAfn() {
        // TODO: Convertit l’automate déterministe en version utilisant ε-transitions (si utile)
        pass;
    }

    // Vérifie si un AFD est minimal
    estMinimal() {
        // TODO: Compare l’automate à sa version minimisée
        pass;
    }

    // Transforme un AFD en AFD minimal
    afdVersAfdMinimal() {
        // TODO: Utilise les partitions de Myhill-Nerode
        pass;
    }

    // Transforme un AFD en AFD canonique
    afdVersAfdCanonique() {
        // TODO: Numérote les états à partir de l’état initial selon l’ordre d’exploration
        pass;
    }
}

export { AutomateClass }