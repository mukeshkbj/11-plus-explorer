# Sign-in page (Google, Facebook, Microsoft, Apple, GitHub, email)

11+ Explorer can show a sign-in page before anything else. Once a grown-up signs in, every child's
stars, trophies and progress are saved to that account and kept the same on every device.

While `config.js` has `firebase: null`, there is no sign-in page and the app works exactly as before
(progress stays on each device).

## 1. Create the Firebase project (once, about 10 minutes)

1. Go to <https://console.firebase.google.com> → **Add project** (Google Analytics is not needed).
2. **Build → Firestore Database → Create database** (pick a location near you, production mode).
   Then open **Rules**, replace everything with the rules below, and press **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

3. **Project settings → Your apps → Web app (`</>`)**. Copy the `firebaseConfig` values into
   `config.js`:

   ```js
   firebase: { apiKey: "...", authDomain: "your-project.firebaseapp.com", projectId: "your-project", appId: "..." },
   ```

   The web config is not a secret. The rules above mean each family can read and write only its own data.

4. **Authentication → Settings → Authorised domains → Add domain**: `mukeshkbj.github.io`
   (and any custom domain you use).

## 2. Turn on each sign-in button

In **Authentication → Sign-in method → Add new provider**. Any provider you don't set up should be
removed from `providers` in `config.js`, so children never see a button that doesn't work.

| Button | What to do |
|---|---|
| **Email** | Turn on *Email/Password*. Nothing else needed. |
| **Google** | Turn on *Google*, choose a support email, save. Nothing else needed. |
| **Facebook** | Create an app at <https://developers.facebook.com> (type: *Consumer*), add *Facebook Login*. Paste its App ID and App secret into Firebase. Copy the OAuth redirect URI that Firebase shows into Facebook Login → Settings → *Valid OAuth Redirect URIs*. Switch the Facebook app to *Live*. |
| **Microsoft** | In <https://portal.azure.com> → *App registrations* → *New registration* (personal and work accounts). Add the Firebase redirect URI as a *Web* redirect. Create a client secret. Paste the Application (client) ID and secret into Firebase. |
| **Apple** | Needs your Apple Developer account: create a *Services ID* with *Sign in with Apple*, add the Firebase redirect URI and your domain, and create a key. Paste the Services ID, Team ID, Key ID and private key into Firebase. |
| **GitHub** | <https://github.com/settings/developers> → *New OAuth App*. The callback URL is the Firebase redirect URI. Paste the Client ID and secret into Firebase. |

Firebase also supports X (Twitter) and Yahoo. Add `'twitter'` or `'yahoo'` to `providers` to show those.

## 3. Options in `config.js`

- `providers`: which buttons are shown, in order.
- `allowGuest: true` shows **Use without an account** (progress stays on that device). Set it to
  `false` to require sign-in.

## Notes

- **Children:** Facebook, Google and the others require users to be 13 or over. The page tells
  children not to sign in with their own account; a parent signs in.
- **Phone apps (iOS and Android):** pop-up sign-in doesn't work inside the app, so the phone apps
  show email sign-in only. Adding Google or Apple buttons inside the app needs the
  `@capacitor-firebase/authentication` plugin and a native build.
- **Signing out** is in Settings → Account. Progress made so far stays on the device too.
- A family who used the old "paste your own Firebase config" option in the parent view still can; the
  setting in `config.js` takes priority when both are present.
