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
    return resultat; // ✅ un objet JS simple : {1: ["1", "2"], 2: ["2"]}
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

    // Détermine si l'automate est déterministe
    estDeterministe() {
        for (const [key, value] of this.transitions) {
            const [etat, symbole] = key.split('|');

            // Cas 1 : symbole epsilon interdit
            if (symbole === 'ε') {
                return false;
            }

            // Cas 2 : plusieurs états cibles pour une même paire (état, symbole)
            if (value.size > 1) {
                return false;
            }
        }

        return true;
    }

    // Transforme un AFN en AFD
    afnVersAfd() {
        const afd = new AutomateClass([...this.alphabet]); 
        const mapEtats = new Map(); // Map: { 'A,B' => q0, ... }
        let compteur = 0;
        // Fonction pour nommer les ensembles d'états : q0, q1, ...
        const creerNomEtat = (ensemble) => {
            const trié = [...ensemble].sort().join(',');
            if (!mapEtats.has(trié)) {
                const nom = `q${compteur++}`;
                mapEtats.set(trié, nom);
            }
            return mapEtats.get(trié);
        };

        const initialSet = new Set([this.etatInitial]); // Pas de ε-fermeture ici
        const pile = [initialSet];
        const dejaVus = new Set();

        while (pile.length > 0) {
            const courant = pile.pop();
            const nomCourant = creerNomEtat(courant);
            afd.ajouterEtat(nomCourant);

            // Définir état initial si pas encore fait
            if (afd.etatInitial === null) {
                afd.fixerEtatInitial(nomCourant);
            }

            // Si au moins un des états de l’ensemble est final → l’état AFD l’est aussi
            for (const e of courant) {
                if (this.etatsFinaux.has(e)) {
                    afd.ajouterEtatFinal(nomCourant);
                    break;
                }
            }

            if (dejaVus.has(nomCourant)) continue;
            dejaVus.add(nomCourant);

            for (const symbole of this.alphabet) {
                let cible = new Set();

                for (const e of courant) {
                    const suivants = this.obtenirEtatsSuivants(e, symbole);
                    suivants.forEach(s => cible.add(s));
                }

                if (cible.size > 0) {
                    const nomCible = creerNomEtat(cible);
                    afd.ajouterEtat(nomCible);
                    afd.ajouterTransition(nomCourant, symbole, nomCible);
                    pile.push(cible);
                }
            }
        }
        return afd;
    }

    // --- MINIMISATION (SIMPLIFIÉE) ---
    estMinimal() {
        if (!this.estDeterministe()) return false;

        const minimal = this.afnVersAfdMinimal();

        // Vérifie le nombre d'états
        if (this.etats.size !== minimal.etats.size) return false;

        // Vérifie les états finaux
        if (this.etatsFinaux.size !== minimal.etatsFinaux.size) return false;

        // Vérifie que les transitions sont identiques
        for (const [cle, val] of this.transitions.entries()) {
            const valMin = minimal.transitions.get(cle);
            if (!valMin || valMin.size !== val.size || [...val].some(x => !valMin.has(x))) {
            return false;
            }
        }

        return true;
    }

    afnVersAfdMinimal() {
        const afd = this.afnVersAfd();

        let partition = [
            new Set([...afd.etatsFinaux]),
            new Set([...afd.etats].filter(e => !afd.etatsFinaux.has(e)))
        ].filter(s => s.size > 0);

        let aRefiner = [...partition];

        const getBloc = (etat, part) => part.find(bloc => bloc.has(etat));

        while (aRefiner.length > 0) {
            const bloc = aRefiner.pop();

            for (const symbole of afd.alphabet) {
            const predecesseurs = new Set();

            for (const etat of afd.etats) {
                const suivants = afd.obtenirEtatsSuivants(etat, symbole);
                for (const s of suivants) {
                if (bloc.has(s)) {
                    predecesseurs.add(etat);
                    break;
                }
                }
            }

            const nouvellesPartitions = [];

            for (const P of partition) {
                const inter = new Set([...P].filter(x => predecesseurs.has(x)));
                const diff = new Set([...P].filter(x => !predecesseurs.has(x)));

                if (inter.size > 0 && diff.size > 0) {
                nouvellesPartitions.push(inter, diff);
                partition = partition.filter(x => x !== P);
                if (aRefiner.includes(P)) {
                    aRefiner = aRefiner.filter(x => x !== P).concat([inter, diff]);
                } else {
                    aRefiner.push(inter.size <= diff.size ? inter : diff);
                }
                } else {
                nouvellesPartitions.push(P);
                }
            }

            partition = nouvellesPartitions;
            }
        }

        // Construction de l’automate minimal
        const afdMinimal = new AutomateClass([...afd.alphabet]);
        const mapBlocVersEtat = new Map();
        let compteur = 0;

        const creerNomBloc = (bloc) => {
            const nom = [...bloc].sort().join(",");
            if (!mapBlocVersEtat.has(nom)) {
            mapBlocVersEtat.set(nom, `q${compteur++}`);
            }
            return mapBlocVersEtat.get(nom);
        };

        // États
        for (const bloc of partition) {
            const nom = creerNomBloc(bloc);
            afdMinimal.ajouterEtat(nom);
        }

        // État initial
        for (const bloc of partition) {
            if (bloc.has(afd.etatInitial)) {
            afdMinimal.fixerEtatInitial(creerNomBloc(bloc));
            break;
            }
        }

        // États finaux
        for (const bloc of partition) {
            if ([...bloc].some(e => afd.etatsFinaux.has(e))) {
            afdMinimal.ajouterEtatFinal(creerNomBloc(bloc));
            }
        }

        // Transitions
        for (const bloc of partition) {
            const source = creerNomBloc(bloc);
            const representant = [...bloc][0];

            for (const sym of afd.alphabet) {
            const cible = [...afd.obtenirEtatsSuivants(representant, sym)][0];
            if (cible) {
                const blocCible = getBloc(cible, partition);
                const cibleNom = creerNomBloc(blocCible);
                afdMinimal.ajouterTransition(source, sym, cibleNom);
            }
            }
        }

        return afdMinimal;
    }

    // Vérifie si l’automate est complet
    estComplet() {
        // Pour chaque étaton vérifie
        for (const etat of this.etats) {
            // Si pour chaque symbole de l'alphabet (sans epsilon)
            for (const symbole of this.alphabet) {
                const cle = `${etat}|${symbole}`;
                // Si la transition n'existe pas ou mène vers un ensemble vide alors incomplet
                if (!this.transitions.has(cle) || this.transitions.get(cle).size === 0) {
                    return false;
                }
            }
        }
        return true; // Alors toutes les transitions existent et ne sont pas vides
    }

    // Vérifie si l’automate est complet
    estComplet() {
        // Pour chaque état on vérifie
        for (const etat of this.etats) {
            // Si pour chaque symbole de l'alphabet (sans epsilon)
            for (const symbole of this.alphabet) {
                const cle = `${etat}|${symbole}`;
                // Si la transition n'existe pas ou mène vers un ensemble vide alors incomplet
                if (!this.transitions.has(cle) || this.transitions.get(cle).size === 0) {
                    return false;
                }
            }
        }
        return true; // Alors toutes les transitions existent et ne sont pas vides
    }

    // Transforme un AFD en un AFD complet
    afdVersAfdc() {
        let afd = this;
    
        // Si ce n'est pas un AFD, le rendre déterministe
        if (!this.estDeterministe()) {
            afd = this.afnVersAfd();
        }

        const afdComplet = new AutomateClass([...afd.alphabet]);

        // Copier les états et transitions existants
        for (const e of afd.etats) afdComplet.ajouterEtat(e);
        for (const f of afd.etatsFinaux) afdComplet.ajouterEtatFinal(f);
        afdComplet.fixerEtatInitial(afd.etatInitial);

        for (const [key, valeurSet] of afd.transitions) {
            const [e, sym] = key.split('|');
            afdComplet.ajouterTransition(e, sym, Array.from(valeurSet));
        }

        const puit = "Puit";
        let puitAjoute = false;

        for (const etat of afdComplet.etats) {
            for (const symbole of afdComplet.alphabet) {
                const cle = `${etat}|${symbole}`;
                if (!afdComplet.transitions.has(cle)) {
                    // Ajouter une transition vers l'état puits
                    if (!puitAjoute) {
                        afdComplet.ajouterEtat(puit);
                        puitAjoute = true;
                    }
                    afdComplet.ajouterTransition(etat, symbole, puit);
                }
            }
        }

        // Compléter les transitions du puits
        if (puitAjoute) {
            for (const symbole of afdComplet.alphabet) {
                afdComplet.ajouterTransition(puit, symbole, puit);
            }
        }

        return afdComplet;
    }

    // Transforme un AFD en un AFD complet
    afdVersAfdc() {
        let afd = this;
    
        // Si ce n'est pas un AFD, le rendre déterministe
        if (!this.estDeterministe()) {
            afd = this.afnVersAfd();
        }

        const afdComplet = new AutomateClass([...afd.alphabet]);

        // Copier les états et transitions existants
        for (const e of afd.etats) afdComplet.ajouterEtat(e);
        for (const f of afd.etatsFinaux) afdComplet.ajouterEtatFinal(f);
        afdComplet.fixerEtatInitial(afd.etatInitial);

        for (const [key, valeurSet] of afd.transitions) {
            const [e, sym] = key.split('|');
            afdComplet.ajouterTransition(e, sym, Array.from(valeurSet));
        }

        const puit = "Puit";
        let puitAjoute = false;

        for (const etat of afdComplet.etats) {
            for (const symbole of afdComplet.alphabet) {
                const cle = `${etat}|${symbole}`;
                if (!afdComplet.transitions.has(cle)) {
                    // Ajouter une transition vers l'état puits
                    if (!puitAjoute) {
                        afdComplet.ajouterEtat(puit);
                        puitAjoute = true;
                    }
                    afdComplet.ajouterTransition(etat, symbole, puit);
                }
            }
        }

        // Compléter les transitions du puits
        if (puitAjoute) {
            for (const symbole of afdComplet.alphabet) {
                afdComplet.ajouterTransition(puit, symbole, puit);
            }
        }

        return afdComplet;
    }

    emonder() {
        // Étape 1 : calcul des états utiles
        const utiles = this.etatsUtiles(); // intersection des accessibles et co-accessibles

        // Étape 2 : création d’un nouvel automate émondé
        const automateEmonde = new AutomateClass([...this.alphabet]);

        // Ajout des états utiles
        utiles.forEach(etat => automateEmonde.ajouterEtat(etat));

        // Ajout des transitions valides uniquement entre états utiles
        for (const [cle, val] of this.transitions.entries()) {
            const [source, symbole] = cle.split('|');
            if (utiles.has(source)) {
            const ciblesUtiles = [...val].filter(cible => utiles.has(cible));
            if (ciblesUtiles.length > 0) {
                automateEmonde.ajouterTransition(source, symbole, ciblesUtiles);
            }
            }
        }

        // Fixer l’état initial s’il est utile
        if (utiles.has(this.etatInitial)) {
            automateEmonde.fixerEtatInitial(this.etatInitial);
        }

        // Ajouter les états finaux utiles
        this.etatsFinaux.forEach(f => {
            if (utiles.has(f)) {
            automateEmonde.ajouterEtatFinal(f);
            }
        });

        return automateEmonde;
    }

    afdToEpsilonAfn() {
        const epsAFN = new AutomateClass([...this.alphabet]);

        // Copier les états existants
        this.etats.forEach(e => epsAFN.ajouterEtat(e));

        // Fixer l’état initial sur le NOUVEL automate
        epsAFN.fixerEtatInitial(this.etatInitial);

        // Copier les états finaux
        this.etatsFinaux.forEach(f => epsAFN.ajouterEtatFinal(f));

        // Ajouter transitions avec un état intermédiaire via ε
        let counter = 0;
        for (const [cle, cibleSet] of this.transitions.entries()) {
            const [source, symbole] = cle.split('|');
            for (const cible of cibleSet) {
                const inter = `q_inter_${counter++}`;
                epsAFN.ajouterEtat(inter);
                epsAFN.ajouterTransition(source, 'ε', inter);
                epsAFN.ajouterTransition(inter, symbole, cible);
            }
        }

        return epsAFN;
    }


    epsilonAfnToAfn() {
        const afn = new AutomateClass([...this.alphabet]);
        
        // Étape 1 : états
        this.etats.forEach(e => afn.ajouterEtat(e));

        // Étape 2 : ε-fermeture de l’état initial
        const fermetureInit = this.epsilonFermeture([this.etatInitial]);
        const newInit = [...fermetureInit];
        afn.fixerEtatInitial(newInit[0]);

        // Si un des états initiaux étendus est final, alors l'état initial est final aussi
        if (newInit.some(e => this.etatsFinaux.has(e))) {
            afn.ajouterEtatFinal(newInit[0]);
        }

        // Étape 3 : transitions sans ε
        for (const etat of this.etats) {
            const fermeture = this.epsilonFermeture([etat]);

            for (const f of fermeture) {
                for (const symbole of this.alphabet) {
                    const suivants = this.obtenirEtatsSuivants(f, symbole);
                    for (const s of suivants) {
                        const fermetureCible = this.epsilonFermeture([s]);
                        for (const sc of fermetureCible) {
                            afn.ajouterTransition(etat, symbole, sc);
                        }
                    }
                }
            }

            // Si ε-fermeture contient un état final, l’état devient final
            if ([...fermeture].some(e => this.etatsFinaux.has(e))) {
                afn.ajouterEtatFinal(etat);
            }
        }

        return afn;
    }

    afnToEpsilonAfn() {
        const epsAFN = new AutomateClass([...this.alphabet]);

        // Copier les états
        this.etats.forEach(e => epsAFN.ajouterEtat(e));

        // Fixer l’état initial
        epsAFN.fixerEtatInitial(this.etatInitial);

        // Copier les états finaux
        this.etatsFinaux.forEach(f => epsAFN.ajouterEtatFinal(f));

        // Ajouter transitions avec ε intermédiaire
        let counter = 0;
        for (const [cle, cibleSet] of this.transitions.entries()) {
            const [source, symbole] = cle.split('|');
            for (const cible of cibleSet) {
                const inter = `q_eps_${counter++}`;
                epsAFN.ajouterEtat(inter);
                epsAFN.ajouterTransition(source, 'ε', inter);
                epsAFN.ajouterTransition(inter, symbole, cible);
            }
        }

        return epsAFN;
    }

    afdToAfn() {
        const afn = new AutomateClass([...this.alphabet]);

        // Copier les états
        this.etats.forEach(e => afn.ajouterEtat(e));

        // Fixer l’état initial
        afn.fixerEtatInitial(this.etatInitial);

        // Copier les états finaux
        this.etatsFinaux.forEach(f => afn.ajouterEtatFinal(f));

        // Copier les transitions telles quelles (permettant plusieurs cibles)
        for (const [cle, cibleSet] of this.transitions.entries()) {
            const [source, symbole] = cle.split('|');
            cibleSet.forEach(cible => {
                afn.ajouterTransition(source, symbole, cible);
            });
        }

        return afn;
    }

    estCanonique() {
        // 1. Un seul état initial
        if (!this.etatInitial) return false;

        // 2. Un seul état final
        if (this.etatsFinaux.size !== 1) return false;

        const final = [...this.etatsFinaux][0];
        const initial = this.etatInitial;

        // 3. Tous les chemins doivent aller de l'état initial vers l'état final sans cycle

        // Utilise un DFS pour vérifier les chemins de i à f
        const visited = new Set();
        const stack = [[initial, [initial]]]; // (état courant, chemin)

        while (stack.length > 0) {
            const [etat, chemin] = stack.pop();

            // Détection de cycle
            const setChemin = new Set(chemin);
            if (setChemin.size !== chemin.length) return false;

            if (etat === final) continue;

            for (const symbole of [...this.alphabet, 'ε']) {
            const cibles = this.obtenirEtatsSuivants(etat, symbole);
            for (const cible of cibles) {
                if (!visited.has(`${etat}|${symbole}|${cible}`)) {
                visited.add(`${etat}|${symbole}|${cible}`);
                stack.push([cible, [...chemin, cible]]);
                }
            }
            }
        }

        return true;
    }


    // Convertit un AFD en AFD canonique
    afdVersAfdCanonique() {
        // Étape 1 : Rendre l'automate déterministe si nécessaire
        let afd = this;
        if (!this.estDeterministe()) {
            afd = this.afnVersAfd();
        }

        // Étape 2 : Rendre l'automate complet
        const afdComplet = afd.afdVersAfdc();
        console.log(afdComplet)

        // Étape 3 : Émonder l'automate complet
        const afdEmonde = afdComplet.emonder();

        // Étape 4 : Minimiser pour obtenir l'AFD canonique
        const afdCanonique = afdEmonde.afnVersAfdMinimal();

        return afdCanonique;
    }

  etoile() {
    const newInitialState = 'q_start';

    // Copier les états et ajouter le nouvel état initial
    const newEtats = new Set(this.etats);
    newEtats.add(newInitialState);

    // Copier les transitions
    const newTransitions = new Map(this.transitions);

    // Ajouter transition ε du nouvel état initial vers l'ancien état initial
    const keyInit = `${newInitialState}|ε`;
    newTransitions.set(keyInit, new Set([this.etatInitial]));

    // Ajouter ε-transitions de chaque état final vers l’état initial
    for (const state of this.etatsFinaux) {
        const key = `${state}|ε`;
        if (!newTransitions.has(key)) {
        newTransitions.set(key, new Set());
        }
        newTransitions.get(key).add(this.etatInitial);
    }

    // Nouveaux états finaux = anciens + nouvel état initial
    const newEtatsFinaux = new Set(this.etatsFinaux);
    newEtatsFinaux.add(newInitialState);

    return new AutomateClass(Array.from(this.alphabet))
        ._withEtats(newEtats)
        ._withEtatInitial(newInitialState)
        ._withEtatsFinaux(newEtatsFinaux)
        ._withTransitions(newTransitions);
    }

    // Helpers pour setter (que tu peux ajouter dans ta classe)
    _withEtats(etats) {
    this.etats = etats;
    return this;
    }

    _withEtatInitial(etatInitial) {
    this.etatInitial = etatInitial;
    this.etats.add(etatInitial);
    return this;
    }

    _withEtatsFinaux(etatsFinaux) {
    this.etatsFinaux = etatsFinaux;
    etatsFinaux.forEach(e => this.etats.add(e));
    return this;
    }

    _withTransitions(transitions) {
    this.transitions = transitions;
    return this;
    }

    complementaire() {
        // Étape 1 : Vérifier si l'automate est déterministe
        let auto = this;
        console.log(auto)
        if (!auto.estDeterministe()) {
            console.log("Non deterministe")
            auto = auto.afnVersAfd(); // Convertir en AFD
            console.log("Transformée")
        }

        // Étape 2 : Rendre l'automate complet
        if (!auto.estComplet()) {
            auto = auto.afdVersAfdc(); // Compléter l'automate (ajout de l'état puits)
        }

        // Étape 3 : Inverser les états finaux
        const nouveauxEtatsFinaux = new Set(
            [...auto.etats].filter(state => !auto.etatsFinaux.has(state))
        );
        console.log(auto)
        // Retourner un nouvel automate complémentaire
        return new AutomateClass(
            auto.alphabet,
            auto.etats,
            auto.etatInitial,
            nouveauxEtatsFinaux,
            auto.transitions
        );
    }

    toRegex() {
        // Étape 1 : on indexe les états dans un tableau pour manipulation
        const etats = Array.from(this.etats);

        // Étape 2 : construire une matrice R[i][j] d'expressions régulières
        // R[i][j] = expression des transitions directes de etats[i] à etats[j]
        const n = etats.length;
        const R = Array.from({ length: n }, () => Array(n).fill(null));

        // Initialiser R avec les transitions simples
        for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const from = etats[i];
            const to = etats[j];
            let exprs = [];

            // Chercher toutes les transitions from -> to (via tous les symboles)
            for (const symbole of this.alphabet) {
            const cibles = this.obtenirEtatsSuivants(from, symbole);
            if (cibles.has(to)) {
                exprs.push(symbole);
            }
            }

            // Ajouter transitions epsilon (si existantes)
            const epsilonCibles = this.obtenirEtatsSuivants(from, 'ε');
            if (epsilonCibles.has(to)) {
            exprs.push('ε');
            }

            if (exprs.length === 0) {
            R[i][j] = null; // pas de transition directe
            } else if (exprs.length === 1) {
            R[i][j] = exprs[0];
            } else {
            R[i][j] = `(${exprs.join('+')})`; // union de symboles
            }
        }
        }

        // Étape 3 : on ajoute ε sur la diagonale (auto-transitions)
        for (let i = 0; i < n; i++) {
        if (R[i][i] === null) {
            R[i][i] = 'ε';
        } else {
            R[i][i] = `(${R[i][i]}+ε)`;
        }
        }

        // Étape 4 : appliquer l'élimination d'états
        // On élimine les états un à un, sauf l'état initial et les états finaux

        const idxInitial = etats.indexOf(this.etatInitial);
        const idxFinaux = Array.from(this.etatsFinaux).map(f => etats.indexOf(f));

        // Pour simplifier, on crée un état final unique "F" si plusieurs états finaux
        // avec transitions ε depuis les finaux vers F
        // Et un état initial unique "I" avec ε vers l'état initial actuel
        // Puis on réduit l'automate à I et F

        // Créons une nouvelle matrice agrandie avec I et F

        const newN = n + 2; // + I et F
        const I = n; // indice nouvel état initial
        const F = n + 1; // indice nouvel état final

        const R2 = Array.from({ length: newN }, () => Array(newN).fill(null));

        // Copier R dans R2
        for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            R2[i][j] = R[i][j];
        }
        }

        // Initialisation : I -> étatInitial par ε
        R2[I][idxInitial] = 'ε';
        // Pas de transition vers I
        for (let i = 0; i < newN; i++) R2[i][I] = null;

        // Transitions des états finaux vers F par ε
        for (const idxF of idxFinaux) {
        R2[idxF][F] = 'ε';
        }
        // Pas de transition sortante de F
        for (let j = 0; j < newN; j++) R2[F][j] = null;

        // ε sur la diagonale de I et F
        R2[I][I] = 'ε';
        R2[F][F] = 'ε';

        // Étape 5 : éliminer les états un par un sauf I et F
        // États à éliminer : 0..n-1 (les originaux)
        for (let k = 0; k < n; k++) {
        // R2[i][j] = R2[i][j] + R2[i][k] (R2[k][k])^* R2[k][j]
        for (let i = 0; i < newN; i++) {
            if (i === k) continue;
            for (let j = 0; j < newN; j++) {
            if (j === k) continue;

            const r1 = R2[i][j];
            const r2 = R2[i][k];
            const r3 = R2[k][k];
            const r4 = R2[k][j];

            if (r2 && r4) {
                const part = `${r2}${r3 ? `(${r3})*` : ''}${r4}`;
                if (r1) {
                R2[i][j] = `(${r1}+${part})`;
                } else {
                R2[i][j] = part;
                }
            }
            }
        }
        // Après mise à jour, on enlève la ligne et colonne k
        for (let i = 0; i < newN; i++) R2[i][k] = null;
        for (let j = 0; j < newN; j++) R2[k][j] = null;
        R2[k][k] = null;
        }

        // Résultat : expression régulière de I vers F
        return R2[I][F] || null;
  }

  estepsilonAFN() {
    // Parcourir toutes les clés de transitions
    for (const cle of this.transitions.keys()) {
      // cle est de la forme "etat|symbole"
      const symbole = cle.split('|')[1];
      if (symbole === 'ε') {
        return true; // au moins une transition epsilon trouvée
      }
    }
    return false; // aucune transition epsilon trouvée
  }

}

export { AutomateClass }