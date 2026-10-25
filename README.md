# Galerie photo de mariage

Galerie Next.js pour permettre aux invités de consulter et d'envoyer des photos. Les images sont stockées sur Cloudinary dans le dossier `wedding-photos`.

## Configuration

Définir les variables d'environnement côté serveur, dans `.env.local` en développement ou dans les paramètres de l'hébergeur en production. Cloudinary accepte l'un des deux formats suivants :

```env
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

ou :

```env
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

Définir également les mots de passe de la galerie et de l'administration :

```env
GALLERY_PASSWORD=<mot_de_passe_invites>
ADMIN_PASSWORD=<mot_de_passe_admin>
```

Ne pas préfixer ces variables avec `NEXT_PUBLIC_` : les clés Cloudinary doivent rester côté serveur. Si une clé a été partagée ou publiée, la révoquer dans Cloudinary et mettre à jour la configuration de l'hébergeur.

## Lancer l'application

```bash
npm install
npm run dev
```

`npm run build` vérifie la compilation de production et `npm run lint` lance ESLint.

## API

- `POST /api/upload` envoie une image vers Cloudinary, avec une limite de 50 Mo.
- `GET /api/photos` liste les images de la galerie et fournit leurs URL de consultation.
- `POST /api/manage-photos` permet à l'administrateur de modifier les catégories ou de supprimer plusieurs images.
- `POST /api/delete` supprime une image depuis la galerie.