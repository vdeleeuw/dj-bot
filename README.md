# DJ Bot

## Auteurs

| [<img alt="vdeleeuw" src="https://avatars0.githubusercontent.com/u/17699276" width="140">](https://github.com/vdeleeuw) |
| --- |
| [@vdeleeuw](https://github.com/vdeleeuw) |

## Description

Ce bot à pour objectif de jouer de la musique depuis YouTube.  
On récupère les liens chansons/playlists Spotify et on les cherche sur YouTube derrière.

## Installation

Rien de plus simple, il suffit d'avoir node & npm d'installé sur votre ordinateur.  
Je vous conseille également Visual Studio Code et avec une extension ESLint + Prettier.  
Tout d'abord pour récupérer les dépendances : `npm install`  
Puis pour compiler le TS et lancer le bot : `npm run dev`

## Déploiement

Mettre son token discord et sa configurationd d'api spotify dans le config.json.  
Utiliser [pm2](https://medium.com/@aunnnn/automate-digitalocean-deployment-for-node-js-with-git-and-pm2-67a3cfa7a02b) pour le run !

## A propos

Projet réalisé par [vdeleeuw](https://github.com/vdeleeuw).  
Projet parti d'une base d'[evobot](https://github.com/eritislami/evobot/blob/master/README.md) épurée.

