Bible Available API — résumé d’utilisation
Base URL
https://bible-available-api.onrender.com
Documentation Swagger
https://bible-available-api.onrender.com/docs
Rôle de l’API

Cette API permet de consommer une Bible française basée sur Louis Segond 1910 (LSG1910).

Elle permet notamment de :

récupérer les traductions disponibles

lister les livres

lire un chapitre

récupérer un verset à partir d’une référence

rechercher un mot ou une expression

récupérer un passage complet à partir d’une syntaxe de plan de lecture

Endpoints disponibles
1) Vérifier les traductions
Endpoint
GET /v1/translations
Rôle

Retourne les traductions disponibles dans l’API.

Exemple
GET https://bible-available-api.onrender.com/v1/translations
Usage

À utiliser pour connaître les codes de traduction supportés.
Actuellement, la principale traduction disponible est :

LSG1910
2) Lister les livres de la Bible
Endpoint
GET /v1/bible/books
Query params

translation : optionnel

Exemple
GET https://bible-available-api.onrender.com/v1/bible/books?translation=LSG1910
Rôle

Retourne la liste des livres bibliques avec leurs informations principales.

Usage

Utile pour :

construire un sélecteur de livres

afficher le canon complet

naviguer vers un chapitre

3) Lire un chapitre complet
Endpoint
GET /v1/bible/books/:bookSlug/chapters/:chapter
Exemple
GET https://bible-available-api.onrender.com/v1/bible/books/genese/chapters/1
GET https://bible-available-api.onrender.com/v1/bible/books/job/chapters/10
Rôle

Retourne tous les versets d’un chapitre donné.

Usage

Utile pour :

affichage de lecture chapitre par chapitre

lecture du jour

lecture continue

4) Récupérer une référence biblique
Endpoint
GET /v1/bible/ref?ref=...
Exemples
GET https://bible-available-api.onrender.com/v1/bible/ref?ref=Jn%203:16
GET https://bible-available-api.onrender.com/v1/bible/ref?ref=Jean%203:16
GET https://bible-available-api.onrender.com/v1/bible/ref?ref=genese%201:1
Rôle

Retourne un verset précis à partir d’une référence biblique.

Formats supportés

Jn 3:16

Jean 3:16

Jn.3.16

genese 1:1

Usage

Utile pour :

recherche directe par référence

partage de verset

affichage rapide d’un verset unique

5) Rechercher dans le texte biblique
Endpoint
GET /v1/bible/search?q=...
Query params

q : obligatoire

page : optionnel

limit : optionnel

Exemple
GET https://bible-available-api.onrender.com/v1/bible/search?q=amour
GET https://bible-available-api.onrender.com/v1/bible/search?q=grace&page=1&limit=20
Rôle

Effectue une recherche textuelle insensible à la casse dans les versets.

Usage

Utile pour :

retrouver un passage par mot-clé

recherche utilisateur libre

exploration thématique simple

6) Récupérer un passage complet
Endpoint
GET /v1/bible/passage?ref=...
Exemples
GET https://bible-available-api.onrender.com/v1/bible/passage?ref=Job10-11
GET https://bible-available-api.onrender.com/v1/bible/passage?ref=Luc19:29-40
GET https://bible-available-api.onrender.com/v1/bible/passage?ref=Job10-11,Luc19:29-40
Rôle

Retourne un passage structuré à partir d’une référence de plan de lecture.

Formats supportés

chapitre simple : Genese 1

plage de chapitres : Job10-11

plage de versets : Luc19:29-40

segments multiples : Job10-11,Luc19:29-40

Usage

Très utile pour :

plans de lecture

challenge biblique

passages du jour

lecture composée de plusieurs blocs

Codes d’erreur

L’API peut retourner :

400 : format de requête invalide

404 : ressource non trouvée

500 : erreur serveur

Conseils d’intégration
Pour lire un verset précis

Utiliser :

GET /v1/bible/ref?ref=Jn%203:16
Pour lire un chapitre complet

Utiliser :

GET /v1/bible/books/job/chapters/10
Pour un plan de lecture

Utiliser :

GET /v1/bible/passage?ref=Job10-11,Luc19:29-40
Pour une recherche libre

Utiliser :

GET /v1/bible/search?q=esperance
Recommandation simple

Pour un autre projet, la logique idéale est :

si l’utilisateur entre une référence → utiliser /v1/bible/ref

si l’utilisateur entre un plan de lecture / passage → utiliser /v1/bible/passage

si l’utilisateur cherche par mot → utiliser /v1/bible/search

si l’utilisateur navigue par livre/chapitre → utiliser /v1/bible/books/.../chapters/...