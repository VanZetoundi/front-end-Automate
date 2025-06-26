class AutomateClass1 {
    constructor(alphabet = []) {
        this.alphabet = new Set(alphabet);
        this.etats = new Set();
        this.etatsInitiaux = new Set();
        this.etatsFinaux = new Set();
        this.transitions = new Map();
    }

    ajouterEtat(etat) {
        this.etats.add(etat);
    }

    fixerEtatInitial(etat) {
        if (this.etats.has(etat)) {
            this.etatsInitiaux.add(etat);
        } else {
            throw new Error(`État initial non valide : ${etat}`);
        }
    }

    ajouterEtatFinal(etat) {
        if (this.etats.has(etat)) {
            this.etatsFinaux.add(etat);
        } else {
            throw new Error(`État final non valide : ${etat}`);
        }
    }

    ajouterTransition(src, symbole, destinations) {
        if (!this.etats.has(src)) {
            throw new Error(`État source non valide : ${src}`);
        }
        if (!this.alphabet.has(symbole) && symbole !== 'ε') {
            throw new Error(`Symbole non valide : ${symbole}`);
        }
        if (!Array.isArray(destinations)) {
            throw new Error(`Destinations doit être un tableau : ${destinations}`);
        }
        for (let dest of destinations) {
            if (!this.etats.has(dest) && dest !== 'puits') {
                throw new Error(`État destination non valide : ${dest}`);
            }
        }
        const cle = `${src}:${symbole}`;
        this.transitions.set(cle, destinations);
    }

    afnVersAfd() {
        const afd = new AutomateClass1([...this.alphabet].filter(s => s !== 'ε'));
        const epsilonCache = new Map();

        const epsilonFermeture = (etats) => {
            const key = [...etats].sort().join('|');
            if (epsilonCache.has(key)) return new Set(epsilonCache.get(key));

            let pile = [...etats];
            let fermeture = new Set(etats);
            while (pile.length > 0) {
                let e = pile.pop();
                let cle = `${e}:ε`;
                if (this.transitions.has(cle)) {
                    for (let succ of this.transitions.get(cle)) {
                        if (!fermeture.has(succ)) {
                            fermeture.add(succ);
                            pile.push(succ);
                        }
                    }
                }
            }
            epsilonCache.set(key, [...fermeture]);
            return fermeture;
        };

        const initialSet = epsilonFermeture(new Set(this.etatsInitiaux));
        const àTraiter = [initialSet];
        const traités = new Set();
        const mapTransitions = new Map();
        const encoder = set => [...set].sort().join('|');
        const mapping = new Map();
        let cpt = 0;

        while (àTraiter.length > 0) {
            const courant = àTraiter.shift();
            const enc = encoder(courant);
            if (traités.has(enc)) continue;
            traités.add(enc);

            if (!mapping.has(enc)) {
                mapping.set(enc, `q${cpt++}`);
            }

            for (let symb of afd.alphabet) {
                let destination = new Set();
                for (let etat of courant) {
                    const cle = `${etat}:${symb}`;
                    if (this.transitions.has(cle)) {
                        for (let succ of this.transitions.get(cle)) {
                            const ferm = epsilonFermeture(new Set([succ]));
                            for (let f of ferm) destination.add(f);
                        }
                    }
                }

                const destEnc = encoder(destination);
                if (destination.size > 0) {
                    mapTransitions.set(`${enc}:${symb}`, destEnc);
                    if (!traités.has(destEnc) && !àTraiter.some(e => encoder(e) === destEnc)) {
                        àTraiter.push(destination);
                    }
                } else {
                    mapTransitions.set(`${enc}:${symb}`, 'puits');
                }
            }
        }

        for (let etatEnc of traités) {
            const nom = mapping.get(etatEnc);
            afd.ajouterEtat(nom);
            const decompo = etatEnc.split('|');
            if (decompo.some(e => this.etatsInitiaux.has(e))) {
                afd.fixerEtatInitial(nom);
            }
            if (decompo.some(e => this.etatsFinaux.has(e))) {
                afd.ajouterEtatFinal(nom);
            }
        }

        if (mapTransitions.has('puits')) {
            afd.ajouterEtat('puits');
            for (let s of afd.alphabet) {
                afd.ajouterTransition('puits', s, ['puits']);
            }
        }

        for (let [cle, destEnc] of mapTransitions) {
            const [srcEnc, symb] = cle.split(':');
            const src = mapping.get(srcEnc);
            let dest = destEnc === 'puits' ? 'puits' : mapping.get(destEnc);
            if (!dest) {
                console.error(`Destination non définie pour ${srcEnc}:${symb} -> ${destEnc}`);
                continue;
            }
            afd.ajouterTransition(src, symb, [dest]);
        }

        return afd;
    }
}

export { AutomateClass1 };