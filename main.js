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

    // 1. Charger les chaînes depuis le fichier JSON avec sécurité visuelle
    fetch("chaines.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fichier chaines.json introuvable (Erreur HTTP ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            toutesLesChaines = data; // Sauvegarde des données complètes
            filtrerEtAfficherChaines(); // Premier affichage des chaînes
        })
        .catch(error => {
            console.error("Erreur lors du chargement du JSON:", error);
            // Si ça plante, on affiche l'erreur directement sur l'interface au lieu de laisser un écran noir
            gridContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff0000; font-weight: bold;">
                    <p>⚠️ Code A-Z TV : Impossible de charger le catalogue des chaînes.</p>
                    <span style="color: #888; font-size: 0.9rem; font-weight: normal; display: block; margin-top: 10px;">
                        Détail technique : ${error.message}
                    </span>
                </div>
            `;
        });

    // 2. Écouter les changements sur les filtres
    if (filterLangue) filterLangue.addEventListener("change", filtrerEtAfficherChaines);
    if (filterCategorie) filterCategorie.addEventListener("change", filtrerEtAfficherChaines);

    // 3. Fonction maîtresse de filtrage combiné
    function filtrerEtAfficherChaines() {
        const langueSelectionnee = filterLangue ? filterLangue.value : "all";
        const categorieSelectionnee = filterCategorie ? filterCategorie.value : "all";

        const chainesFiltrees = toutesLesChaines.filter(chaine => {
            const matchLangue = (langueSelectionnee === "all" || chaine.langue === langueSelectionnee);
            const matchCategorie = (categorieSelectionnee === "all" || chaine.categorie === categorieSelectionnee);
            return matchLangue && matchCategorie;
        });

        genererCartes(chainesFiltrees);
    }

    // 4. Générer dynamiquement les cartes HTML
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
            img.src = chaine.logo || "";
            img.alt = `Logo ${chaine.nom}`;
            
            // Sécurité anti-clignotement si le logo distant est mort
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

    // 5. Fonction pour ouvrir la modale et lancer le flux via le Proxy Vercel
    function ouvrirModale(chaine) {
        if (!modal || !modalTitle || !videoPlayer) return;

        modalTitle.textContent = chaine.nom;
        modal.style.display = "flex";

        // Utilisation automatique du proxy pour briser les blocages CORS et HTTP en ligne
        const urlProxy = `/api/proxy?url=${encodeURIComponent(chaine.url)}`;

        if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = urlProxy;
        } 
        else if (Hls.isSupported()) {
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(urlProxy);
            hls.attachMedia(videoPlayer);
        } else {
            alert("Votre navigateur ne supporte pas ce flux.");
        }
    }

    // 6. Fermer la modale et couper proprement le flux vidéo
    function fermerModale() {
        if (!modal || !videoPlayer) return;

        modal.style.display = "none";
        videoPlayer.pause();
        videoPlayer.src = "";
        if (hls) {
            hls.destroy();
            hls = null;
        }
    }

    if (closeBtn) closeBtn.addEventListener("click", fermerModale);
    window.addEventListener("click", (e) => {
        if (e.target === modal) fermerModale();
    });
});