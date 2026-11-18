/**
 * Acuerdo de Nivel de Servicio (SLA), versión 1.0: traducción al francés (vale la versión en español).
 */
export const TEXTO = `# Accord de niveau de service
## ATENDEL

**Dernière mise à jour : 17 novembre 2026**

*Service Level Agreement (SLA)*

**Version :** 1.0

### 1. Objet

Le présent Accord de niveau de service (ci-après, le « SLA ») établit les conditions générales dans lesquelles Atendel fournit, maintient et assure le support de sa plateforme d'assistance aux entreprises.

Ce document décrit les critères de disponibilité, de maintenance, de traitement des incidents, de communication des interruptions et les responsabilités liées à la continuité du service.

Sa finalité est d'établir des attentes claires et transparentes pour les utilisateurs, sans créer d'engagements de disponibilité ou de délais de réponse qui n'auraient pas été expressément définis et assumés par Atendel.

### 2. Champ d'application

Le présent SLA s'applique aux services d'Atendel disponibles par :

- Le site web et le panneau de contrôle.
- Le système d'authentification.
- Les fonctions d'intelligence artificielle.
- La gestion des informations de l'entreprise.
- Les automatisations activées.
- Les connexions avec des applications externes.
- Les fonctions de notification.
- Les autres fonctionnalités qu'Atendel intègre à la plateforme.

Les conditions spécifiques peuvent varier selon le forfait souscrit, les fonctionnalités activées et les accords particuliers conclus avec certains clients.

### 3. Définitions

**Disponibilité :** capacité d'accéder à une fonction d'Atendel et de l'utiliser conformément à ses caractéristiques essentielles.

**Incident :** événement technique ou opérationnel qui affecte, limite ou empêche le fonctionnement normal d'une fonction.

**Maintenance programmée :** intervention technique planifiée au préalable pour mettre à jour, corriger, optimiser ou protéger la plateforme.

**Maintenance d'urgence :** intervention nécessaire pour corriger une défaillance critique, traiter un risque de sécurité ou éviter des dommages plus importants.

**Fournisseur externe :** tiers dont l'infrastructure ou le service est nécessaire au fonctionnement d'une partie d'Atendel.

**Délai de première réponse :** période comprise entre la réception d'un signalement valable et la première communication du support à ce sujet. Il n'équivaut pas nécessairement au délai de résolution.

**Rétablissement :** récupération de la fonctionnalité affectée, même si la cause première est encore à l'étude.

### 4. Principes de fourniture du service

Atendel veillera à exploiter sa plateforme selon des critères de continuité, de sécurité, de maintenance et d'amélioration progressive.

À cette fin, il pourra réaliser des activités telles que :

- La supervision technique des services.
- La correction d'erreurs.
- La mise à jour de composants.
- La maintenance de l'infrastructure.
- La gestion des incidents.
- La revue des intégrations.
- L'application de mesures de sécurité.
- L'optimisation des processus internes.

Atendel déploiera des efforts raisonnables pour réduire les interruptions et rétablir les fonctions affectées en cas de défaillance.

### 5. Disponibilité

Atendel n'établit actuellement aucun pourcentage contractuel garanti de disponibilité.

La plateforme peut connaître des interruptions, une dégradation des performances ou une indisponibilité temporaire dues à des causes internes ou externes.

Ces causes comprennent notamment :

1. Les défaillances d'infrastructure.
2. Les erreurs logicielles.
3. Les mises à jour et la maintenance.
4. Les problèmes de connectivité.
5. Les interruptions de fournisseurs.
6. Les restrictions des applications connectées.
7. Les incidents de sécurité.
8. Les événements de force majeure.
9. Les changements techniques ou réglementaires.
10. D'autres circonstances échappant au contrôle raisonnable d'Atendel.

L'absence de pourcentage garanti ne supprime pas les obligations légales ou contractuelles qui incombent à Atendel.

**5.1. Mesure de la disponibilité**

Si Atendel met en place un engagement formel de disponibilité, il devra établir au préalable :

- La période de mesure.
- Les fonctions incluses.
- La méthode de calcul.
- Les sources de surveillance.
- Les exclusions justifiées.
- La procédure de vérification des interruptions.
- Les conséquences du manquement.

Tant que ces critères n'auront pas été publiés, tout indicateur interne aura un caractère opérationnel et ne constituera pas une garantie contractuelle.

### 6. Maintenance

Atendel peut effectuer une maintenance préventive, corrective, évolutive et de sécurité.

**6.1. Maintenance programmée**

Lorsque cela est possible, Atendel communiquera à l'avance les interventions susceptibles d'affecter de manière significative l'accès ou le fonctionnement du service.

La communication pourra comprendre :

- La date prévue.
- L'horaire estimé.
- Les fonctions affectées.
- La durée approximative.
- Des recommandations pour les utilisateurs.

**6.2. Maintenance d'urgence**

Atendel pourra effectuer des interventions immédiates sans préavis lorsqu'elles sont nécessaires pour :

- Protéger des informations.
- Corriger des vulnérabilités.
- Éviter des dommages à la plateforme.
- Rétablir des fonctions critiques.
- Répondre à des incidents de sécurité.
- Traiter des défaillances graves d'infrastructure.

Dans ces cas, Atendel veillera à informer les utilisateurs dès que cela sera raisonnablement possible.

### 7. Classification des incidents

Atendel peut classer les signalements selon leur impact et leur étendue.

**7.1. Priorité critique**

Incidents entraînant une interruption générale ou un risque significatif pour la sécurité, l'intégrité ou la confidentialité des informations.

Exemples :

- Indisponibilité générale de la plateforme.
- Incident de sécurité à large impact.
- Perte d'accès à des fonctions essentielles pour une partie substantielle des utilisateurs.

**7.2. Priorité élevée**

Incidents empêchant l'utilisation d'une fonction essentielle pour un groupe d'utilisateurs ou affectant de manière significative l'activité d'une entreprise.

Exemples :

- Défaillance générale d'une intégration essentielle.
- Impossibilité persistante d'accéder à une fonction principale.
- Erreur empêchant l'exécution d'une automatisation critique.

**7.3. Priorité moyenne**

Incidents affectant une fonction précise, mais permettant de continuer à utiliser d'autres parties de la plateforme.

Exemples :

- Défaillances intermittentes d'une intégration.
- Erreurs dans une fonction secondaire.
- Problèmes d'affichage gênant partiellement l'utilisation.

**7.4. Priorité faible**

Questions, erreurs mineures ou demandes n'empêchant pas l'utilisation principale du service.

Exemples :

- Questions sur la configuration.
- Demandes d'orientation.
- Erreurs visuelles mineures.
- Suggestions d'amélioration.

La classification définitive sera déterminée par Atendel en fonction des informations disponibles.

### 8. Canaux de support

Les utilisateurs peuvent contacter Atendel par :

**E-mail :** infoatendel@gmail.com

**Panneau de contrôle :** canal de support, lorsqu'il est activé.

**Autres canaux :** ceux qu'Atendel publie officiellement.

L'utilisateur doit utiliser les canaux indiqués et fournir des informations suffisantes pour identifier le problème.

Il ne doit pas envoyer de mots de passe, de codes d'authentification, d'identifiants complets ni d'informations sensibles inutiles.

### 9. Délais de réponse et de résolution

Atendel n'établit actuellement aucun délai contractuel garanti de première réponse ou de résolution.

Lorsqu'Atendel publiera des délais de réponse, ceux-ci devront distinguer entre :

- L'accusé de réception.
- La première réponse.
- Le diagnostic initial.
- Le rétablissement temporaire.
- La solution définitive.

Une estimation de résolution ne constitue pas une garantie lorsque l'incident dépend de tiers ou de circonstances qu'Atendel ne contrôle pas.

### 10. Procédure de traitement

Une fois un signalement reçu, Atendel pourra suivre les étapes suivantes :

**Étape 1. Réception :** enregistrement de la demande et des informations fournies.

**Étape 2. Classification :** évaluation préliminaire de l'impact et attribution d'une priorité.

**Étape 3. Diagnostic :** identification de la fonction affectée, de l'étendue et des causes possibles.

**Étape 4. Confinement :** application de mesures temporaires pour limiter l'impact, le cas échéant.

**Étape 5. Correction :** mise en œuvre d'une solution ou d'une alternative raisonnable.

**Étape 6. Vérification :** contrôle que la fonction affectée a été rétablie.

**Étape 7. Clôture :** communication du résultat et clôture du signalement, sans préjudice de révisions ultérieures.

### 11. Responsabilités de l'utilisateur

L'utilisateur doit :

- Maintenir à jour ses coordonnées.
- Protéger ses identifiants et ses méthodes d'authentification.
- Utiliser des navigateurs et des appareils compatibles.
- Maintenir actives les autorisations nécessaires à ses applications connectées.
- Signaler les défaillances en temps utile.
- Fournir des données suffisantes pour enquêter sur les problèmes.
- Ne pas modifier les mécanismes techniques de sécurité ni interférer avec eux.
- Conserver ses propres sauvegardes des informations qu'il juge essentielles à son activité.

L'utilisateur reconnaît qu'Atendel ne remplace ni ses propres procédures de continuité d'activité ni ses obligations de sauvegarde.

### 12. Dépendance à l'égard de fournisseurs externes

Certaines fonctions dépendent de services externes, notamment des fournisseurs d'hébergement, de bases de données, d'authentification, d'intelligence artificielle, de messagerie et de notifications.

Une interruption de ces services peut affecter des fonctions d'Atendel même si la plateforme principale reste opérationnelle.

Atendel veillera à :

- Identifier le fournisseur concerné.
- Évaluer l'impact.
- Communiquer les interruptions importantes lorsque cela est possible.
- Appliquer des alternatives techniques raisonnables.
- Rétablir l'intégration lorsque le fournisseur le permet.

Atendel ne contrôle pas les délais de rétablissement des fournisseurs indépendants.

### 13. Limites du SLA

Le présent SLA ne garantit pas que :

- La plateforme soit disponible à tout moment.
- Tous les incidents puissent être résolus immédiatement.
- Les applications externes maintiennent leurs services sans interruption.
- Les résultats de l'intelligence artificielle soient toujours corrects.
- Les intégrations restent disponibles si un fournisseur modifie ses conditions.
- Tous les appareils, navigateurs ou réseaux soient compatibles.

Les limitations du présent document n'ont pas pour objet d'exclure des responsabilités qui ne peuvent légalement être limitées.

### 14. Crédits et compensations

Actuellement, Atendel n'établit ni crédits de service automatiques ni compensations fondées sur des pourcentages de disponibilité.

Si des forfaits pour entreprises assortis d'engagements spécifiques sont proposés, ceux-ci devront être établis dans une annexe contractuelle ou dans les conditions particulières du forfait.

Tout mécanisme de compensation devra indiquer clairement sa portée, ses conditions et sa procédure de demande, sans porter atteinte aux droits légaux de l'utilisateur.

### 15. Modifications du service

Atendel peut modifier ses fonctions, son infrastructure, ses fournisseurs et ses procédures de support pour des motifs techniques, opérationnels, commerciaux, de sécurité ou légaux.

Lorsqu'un changement affecte de manière significative le service souscrit, Atendel pourra le communiquer par le panneau ou par e-mail conformément aux Conditions générales.

### 16. Durée et contact

Le présent SLA reste en vigueur tant qu'il est publié et qu'il n'est pas remplacé par une version ultérieure.

Pour toute question ou tout signalement :

**E-mail :** infoatendel@gmail.com

**Adresse :** Monterrey, Nuevo León, México

**Responsable désigné :** Santiago Kuri Martinez

**Domaine officiel :** good-kebab.vercel.app
`;
