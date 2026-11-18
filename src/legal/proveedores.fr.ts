/**
 * Lista de Proveedores y Subencargados, versión 1.0: traducción al francés (vale la versión en español).
 */
export const TEXTO = `# Liste des fournisseurs et sous-traitants
## ATENDEL

**Dernière mise à jour : 17 novembre 2026**

**Version :** 1.0

### 1. Objet

Le présent document identifie les fournisseurs technologiques et les services externes pouvant intervenir dans l'exploitation d'Atendel, ainsi que les fonctions générales qu'ils remplissent et les catégories d'informations qu'ils pourraient traiter.

Sa finalité est d'assurer la transparence envers les utilisateurs et de faciliter la compréhension des opérations de traitement de données pouvant être réalisées pour fournir les services d'Atendel.

Le présent document complète l'Avis de confidentialité intégral, l'Accord de traitement des données personnelles et les Conditions générales.

### 2. Champ d'application

La liste comprend les fournisseurs pouvant intervenir dans :

- L'hébergement et la distribution de la plateforme.
- Les bases de données et le stockage.
- L'authentification et l'administration des comptes.
- Le traitement par intelligence artificielle.
- La connexion avec des applications externes.
- La messagerie et les communications.
- Les notifications.
- La sécurité et le fonctionnement technique.

La participation de chaque fournisseur dépendra des fonctions activées, de la configuration de l'utilisateur et de l'architecture technique en vigueur.

L'inclusion d'un fournisseur dans cette liste ne signifie pas nécessairement que toutes les données d'Atendel sont transmises à ce fournisseur.

### 3. Fournisseurs identifiés

**3.1. Supabase**

**Catégorie :** Infrastructure, base de données, stockage et authentification.

**Fonction au sein d'Atendel :**

Supabase fournit les services d'infrastructure nécessaires pour stocker les informations, administrer les enregistrements, gérer les fichiers et faciliter les processus d'authentification, y compris l'envoi des codes d'accès par e-mail.

**Catégories d'informations pouvant être traitées :**

- Données de compte.
- Informations de l'entreprise.
- Préférences et configurations.
- Conversations avec Atendel.
- Documents et fichiers.
- Journaux techniques et de sécurité.
- Informations nécessaires au maintien des fonctions de la plateforme.

**Lieu du traitement :** États-Unis (région de l'Est, Virginie), conformément au projet souscrit par Atendel.

**Conditions applicables :** Contrat, documentation de sécurité et politiques du fournisseur.

**3.2. Vercel**

**Catégorie :** Hébergement et distribution d'applications.

**Fonction au sein d'Atendel :**

Vercel fournit l'infrastructure permettant de publier, distribuer et délivrer le site web et le panneau de contrôle d'Atendel, et d'exécuter son serveur.

**Catégories d'informations pouvant être traitées :**

- Requêtes techniques.
- Données de connexion.
- Journaux de fonctionnement.
- Informations nécessaires pour délivrer les pages et les ressources de la plateforme.

**Lieu du traitement :** États-Unis (région de Washington, D.C.) pour le serveur d'Atendel, avec un réseau mondial de distribution pour délivrer les pages.

**Conditions applicables :** Contrat et politiques du fournisseur.

**3.3. Anthropic**

**Catégorie :** Intelligence artificielle.

**Fonction au sein d'Atendel :**

Anthropic fournit les modèles d'intelligence artificielle utilisés pour interpréter les instructions, traiter les informations et générer les résultats demandés par les utilisateurs, y compris les modes « Rápido » (« Rapide ») et « Avanzado » (« Avancé ») que l'utilisateur peut choisir dans le chat.

**Catégories d'informations pouvant être traitées :**

- Instructions de l'utilisateur.
- Messages et contenu autorisé.
- Informations professionnelles nécessaires à une tâche.
- Extraits de documents ou de fichiers envoyés au modèle.
- Contexte nécessaire pour générer des réponses ou exécuter des processus.

**Lieu du traitement :** États-Unis, selon la documentation du fournisseur ; Atendel confirmera la région applicable au service souscrit.

**Conditions applicables :** Accords commerciaux, conditions de traitement des données et documentation du fournisseur.

Atendel devra vérifier les conditions spécifiques de conservation, d'utilisation des données, d'entraînement des modèles et de contrôles de sécurité applicables au service souscrit. Une description commerciale générale ne sera pas considérée comme suffisante pour affirmer que certaines informations ne sont jamais conservées ou jamais utilisées pour l'entraînement.

**3.4. Meta / WhatsApp**

**Catégorie :** Messagerie et communication.

**Fonction au sein d'Atendel :**

Meta et les services WhatsApp interviennent dans la connexion, la réception et la transmission des messages lorsque l'utilisateur connecte le WhatsApp de son entreprise, ainsi que dans les avis qu'Atendel envoie à l'utilisateur par WhatsApp lorsqu'il les active lui-même.

**Catégories d'informations pouvant être traitées :**

- Identifiants de comptes.
- Numéros de téléphone.
- Messages.
- Métadonnées de communication.
- Informations nécessaires pour délivrer les messages et maintenir l'intégration.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions, politiques et documentation applicables de Meta et de WhatsApp.

**3.5. Google**

**Catégorie :** Authentification, services de notification et intégrations.

**Fonction au sein d'Atendel :**

Google intervient dans la connexion avec un compte Google, lorsque l'utilisateur choisit cette méthode ; dans la remise des notifications sur Chrome et Android ; et dans les intégrations Google que l'utilisateur connecte.

**Catégories d'informations pouvant être traitées :**

- Identifiants techniques.
- Données nécessaires aux notifications.
- Informations autorisées au moyen d'intégrations Google.
- Données d'authentification ou d'autorisation, le cas échéant.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions et politiques de Google et conditions des intégrations utilisées.

**3.6. Apple**

**Catégorie :** Notifications et services d'appareils.

**Fonction au sein d'Atendel :**

Apple intervient dans la remise des notifications sur Safari, iPhone et Mac lorsque l'utilisateur active les notifications sur ces appareils.

**Catégories d'informations pouvant être traitées :**

- Identifiants techniques de l'appareil.
- Jetons de notification.
- Données nécessaires pour délivrer les avis.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions et politiques d'Apple.

**3.7. Mozilla**

**Catégorie :** Services de notification du navigateur.

**Fonction au sein d'Atendel :**

Mozilla intervient dans la remise des notifications web lorsque l'utilisateur les active dans Firefox.

**Catégories d'informations pouvant être traitées :**

- Identifiants d'abonnement.
- Informations techniques du navigateur.
- Données nécessaires pour délivrer les notifications.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions et politiques de Mozilla.

**3.8. Microsoft**

**Catégorie :** Services de notification et intégrations.

**Fonction au sein d'Atendel :**

Microsoft intervient dans la remise des notifications sur Edge et Windows et dans les intégrations Microsoft que l'utilisateur connecte.

**Catégories d'informations pouvant être traitées :**

- Identifiants techniques.
- Informations nécessaires aux notifications.
- Données autorisées au moyen d'intégrations Microsoft.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions et politiques de Microsoft.

**3.9. Cloudflare**

**Catégorie :** Sécurité.

**Fonction au sein d'Atendel :**

Cloudflare Turnstile vérifie que la personne qui crée un compte ou se connecte est bien un être humain, lorsque cette protection est activée.

**Catégories d'informations pouvant être traitées :**

- Informations techniques du navigateur.
- Données nécessaires à la vérification.

**Lieu du traitement :** Selon l'infrastructure mondiale du fournisseur.

**Conditions applicables :** Conditions et politiques de Cloudflare.

### 4. Applications connectées par l'utilisateur

Atendel permet la connexion volontaire d'applications externes, notamment :

- **Google :** Gmail, Google Calendar, Tâches Google, Google Drive, Google Sheets, Contacts Google, Profil d'entreprise Google et Google Forms.
- **Microsoft :** Outlook, Calendrier Outlook, Microsoft To Do, OneDrive, Excel et Contacts Outlook.
- **Meta :** WhatsApp Business, Instagram, Messenger et Avis Facebook.
- **Messagerie et travail d'équipe :** Telegram, Slack, Zoom, Notion, Dropbox, Airtable, Trello et Todoist.
- **Clients et marketing :** HubSpot, Zoho CRM, Pipedrive, Kommo, Mailchimp et Typeform.
- **Agenda et rendez-vous :** Calendly, Acuity Scheduling, SimplyBook.me, Setmore, AgendaPro, Fresha, Booksy et Doctoralia.
- **Paiements et ventes :** Stripe, Mercado Pago, Mercado Libre, Shopify, Tiendanube, Clip, PayPal, Conekta, Openpay et Square.
- **Comptabilité et facturation :** Zoho Books, Facturama, Alegra, Holded, QuickBooks et facturation CFDI.
- D'autres applications qui seront intégrées à la plateforme.

La disponibilité de chaque application peut varier selon l'étape de développement de la plateforme et les approbations exigées par chaque fournisseur.

Ces applications peuvent traiter des informations directement selon leurs propres conditions générales.

Lorsqu'Atendel accède à des informations par une intégration, l'étendue de l'accès dépendra de :

1. L'autorisation accordée par l'utilisateur.
2. Les autorisations techniques disponibles.
3. La configuration de l'intégration.
4. Les instructions et automatisations activées.
5. Les conditions du fournisseur externe.

Les autorisations et identifiants de ces connexions sont stockés chiffrés au moyen d'AES-256-GCM.

L'utilisateur peut administrer ou révoquer les connexions depuis la section « Tu negocio → Apps conectadas » (« Votre entreprise → Applications connectées »).

La déconnexion d'une application empêchera de nouveaux accès par l'intégration, mais ne supprimera pas nécessairement les informations déjà traitées ou conservées conformément aux règles de conservation applicables.

### 5. Sous-traitants et responsabilité

Lorsqu'Atendel recourt à un fournisseur pour traiter des données personnelles pour le compte d'une entreprise, il veillera à établir des conditions contractuelles régissant :

- La finalité du traitement.
- L'étendue des services.
- La confidentialité.
- Les mesures de sécurité.
- Les restrictions d'utilisation.
- L'assistance en cas d'incident.
- La conservation et la suppression.
- La participation d'autres sous-traitants.
- Les transferts internationaux, le cas échéant.

La qualification juridique de chaque fournisseur dépendra des activités qu'il exerce effectivement. Certains pourront agir en tant que sous-traitants ou sous-traitants ultérieurs et d'autres en tant que responsables du traitement indépendants à l'égard de leurs propres services.

Atendel n'utilise ni fournisseurs de publicité, ni réseaux publicitaires, ni outils de traçage de tiers à des fins publicitaires. Les polices de caractères du site sont servies depuis le propre domaine d'Atendel.

### 6. Localisation et transferts internationaux

Certains fournisseurs peuvent stocker ou traiter des informations en dehors du Mexique.

La localisation concrète peut dépendre de la région sélectionnée, de l'architecture du service, de la configuration souscrite et des mécanismes de distribution utilisés.

Atendel devra vérifier la localisation effective et les conditions de transfert applicables avant de présenter une affirmation précise sur le pays où certaines informations sont stockées ou traitées.

Le cas échéant, les transferts seront effectués conformément à l'Avis de confidentialité et à la législation applicable.

### 7. Mises à jour de la liste

Atendel peut intégrer, remplacer ou cesser d'utiliser des fournisseurs pour des motifs techniques, opérationnels, de sécurité ou commerciaux.

La liste sera mise à jour en cas de changements importants concernant les fournisseurs qui interviennent dans le traitement des informations.

Le cas échéant, Atendel communiquera les changements par le panneau ou par e-mail.

### 8. Questions

Les utilisateurs peuvent demander des informations complémentaires sur les fournisseurs et le traitement des données par :

**E-mail :** infoatendel@gmail.com

**Adresse :** Monterrey, Nuevo León, México

**Responsable désigné :** Santiago Kuri Martinez

**Domaine officiel :** good-kebab.vercel.app
`;
