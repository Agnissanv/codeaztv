document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById("grid-chaines");
    const modal = document.getElementById("video-modal");
    const modalTitle = document.getElementById("modal-title");
    const videoPlayer = document.getElementById("video-player");
    const closeBtn = document.querySelector(".close-btn");
    
    let hls = null;

    // 1. Charger les chaînes depuis le fichier JSON
    fetch("chaines.json")
        .then(response => response.json())
        .then(data => {
            genererCartes(data);
        })
        .catch(error => console.error("Erreur lors du chargement du JSON:", error));

    // 2. Générer dynamiquement les cartes HTML
    function genererCartes(chaines) {
        gridContainer.innerHTML = ""; // On nettoie la grille
        
        chaines.forEach(chaine => {
            // Création de l'élément carte
            const card = document.createElement("div");
            card.classList.add("card");
            
            // Création propre de la balise image
            const img = document.createElement("img");
            img.src = chaine.logo;
            img.alt = `Logo ${chaine.nom}`;
            
            // GESTION DU CRASH : Si le logo de la chaîne ne charge pas
            img.addEventListener("error", () => {
                // On injecte directement le SVG de secours en texte (plus de conflit de guillemets)
                img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff0000'><path d='M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12z'/></svg>";
            }, { once: true }); // "{ once: true }" garantit que l'événement ne s'exécute QU'UNE SEULE FOIS (fin de la boucle infinie)

            // Création du titre
            const h3 = document.createElement("h3");
            h3.textContent = chaine.nom;
            
            // On assemble les éléments dans la carte
            card.appendChild(img);
            card.appendChild(h3);
            
            // Événement au clic sur la carte pour la modale
            card.addEventListener("click", () => {
                ouvrirModale(chaine);
            });
            
            // On ajoute la carte dans la grille principale
            gridContainer.appendChild(card);
        });
    }

    // 3. Fonction pour ouvrir la modale et lancer le flux IPTV via le Proxy Serverless
    function ouvrirModale(chaine) {
        modalTitle.textContent = chaine.nom;
        modal.style.display = "flex";

        // Construction de l'URL du proxy (Fonctionne en local et sur Vercel automatiquement)
        const urlProxy = `/api/proxy?url=${encodeURIComponent(chaine.url)}`;

        if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Pour Safari ou mobiles
            videoPlayer.src = urlProxy;
        } 
        else if (Hls.isSupported()) {
            // Pour Chrome, Firefox, Edge
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(urlProxy); // On charge le flux à travers le proxy
            hls.attachMedia(videoPlayer);
        } else {
            alert("Votre navigateur ne supporte pas ce flux.");
        }
    }

    // 4. Fermer la modale et couper la vidéo
    function fermerModale() {
        modal.style.display = "none";
        videoPlayer.pause();
        videoPlayer.src = "";
        if (hls) {
            hls.destroy();
            hls = null;
        }
    }

    closeBtn.addEventListener("click", fermerModale);
    
    // Fermer si on clique en dehors du cadre de la modale
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            fermerModale();
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById("grid-chaines");
    const modal = document.getElementById("video-modal");
    const modalTitle = document.getElementById("modal-title");
    const videoPlayer = document.getElementById("video-player");
    const closeBtn = document.querySelector(".close-btn");
    
    // Éléments des filtres
    const filterLangue = document.getElementById("filter-langue");
    const filterCategorie = document.getElementById("filter-categorie");
    
    let toutesLesChaines = []; // Stockage global des chaînes chargées
    let hls = null;

    // 1. Charger les chaînes depuis le fichier JSON
    fetch("chaines.json")
        .then(response => response.json())
        .then(data => {
            toutesLesChaines = data; // Sauvegarde des données complètes
            filtrerEtAfficherChaines(); // Premier affichage (toutes les chaînes)
        })
        .catch(error => console.error("Erreur lors du chargement du JSON:", error));

    // 2. Écouter les changements sur les filtres
    filterLangue.addEventListener("change", filtrerEtAfficherChaines);
    filterCategorie.addEventListener("change", filtrerEtAfficherChaines);

    // 3. Fonction maîtresse de filtrage combiné
    function filtrerEtAfficherChaines() {
        const langueSelectionnee = filterLangue.value;
        const categorieSelectionnee = filterCategorie.value;

        // On filtre le tableau selon les deux critères en même temps
        const chainesFiltrees = toutesLesChaines.filter(chaine => {
            // Match langue : si "all", c'est vrai, sinon on vérifie la correspondance exacte
            const matchLangue = (langueSelectionnee === "all" || chaine.langue === langueSelectionnee);
            // Match catégorie : si "all", c'est vrai, sinon on vérifie la correspondance exacte
            const matchCategorie = (categorieSelectionnee === "all" || chaine.categorie === categorieSelectionnee);
            
            return matchLangue && matchCategorie; // La chaîne doit valider les DEUX critères
        });

        // On envoie le résultat filtré à la fonction d'affichage
        genererCartes(chainesFiltrees);
    }

    // 4. Générer dynamiquement les cartes HTML sécurisées
    function genererCartes(chaines) {
        gridContainer.innerHTML = ""; // On nettoie la grille à chaque filtrage
        
        if (chaines.length === 0) {
            gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #555; padding: 40px;">Aucune chaîne ne correspond à ces critères.</p>`;
            return;
        }

        chaines.forEach(chaine => {
            const card = document.createElement("div");
            card.classList.add("card");
            
            const img = document.createElement("img");
            img.src = chaine.logo;
            img.alt = `Logo ${chaine.nom}`;
            
            // Sécurité anti-clignotement en cas de lien brisé
            img.addEventListener("error", () => {
                img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff0000'><path d='M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 14H3V8h18v12z'/></svg>";
            }, { once: true });

            const h3 = document.createElement("h3");
            h3.textContent = chaine.nom;
            
            card.appendChild(img);
            card.appendChild(h3);
            
            card.addEventListener("click", () => {
                ouvrirModale(chaine);
            });
            
            gridContainer.appendChild(card);
        });
    }

    // 5. Fonction pour ouvrir la modale et lancer le flux IPTV
    function ouvrirModale(chaine) {
        modalTitle.textContent = chaine.nom;
        modal.style.display = "flex";

        if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = chaine.url;
        } 
        else if (Hls.isSupported()) {
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(chaine.url);
            hls.attachMedia(videoPlayer);
        } else {
            alert("Votre navigateur ne supporte pas ce flux.");
        }
    }

    // 6. Fermer la modale
    function fermerModale() {
        modal.style.display = "none";
        videoPlayer.pause();
        videoPlayer.src = "";
        if (hls) {
            hls.destroy();
            hls = null;
        }
    }

    closeBtn.addEventListener("click", fermerModale);
    window.addEventListener("click", (e) => {
        if (e.target === modal) fermerModale();
    });
});







// https://github.com/iptv-org/iptv