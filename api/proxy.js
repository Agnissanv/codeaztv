// api/proxy.js

export default async function handler(req, res) {
    // 1. Récupérer l'URL de la chaîne passée en paramètre
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Le paramètre URL est manquant." });
    }

    try {
        // 2. Configurer les entêtes CORS pour autoriser ton site Code A-Z à lire la réponse
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Gérer la requête de pré-vérification (Preflight) des navigateurs
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // 3. Faire la requête vers le flux IPTV d'origine (comme le ferait VLC)
        const targetUrl = decodeURIComponent(url);
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send("Impossible de récupérer le flux vidéo.");
        }

        // 4. Transmettre le bon type de contenu (ex: application/vnd.apple.mpegurl)
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // 5. Renvoyer les données binaires du flux au format Buffer
        const data = await response.arrayBuffer();
        return res.send(Buffer.from(data));

    } catch (error) {
        console.error("Erreur Proxy:", error);
        return res.status(500).json({ error: "Erreur interne du proxy Serverless." });
    }
}