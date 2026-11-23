# Publishing 11+ Explorer on Google Play and the App Store

Everything needed is in this repository. The app id (bundle id) is **`io.github.mukeshkbj.elevenplus`**.

> **First:** GitHub Actions must be working on the account. At the moment the account is locked because of a billing issue (GitHub → Settings → Billing), so no workflow can run until that is fixed.

## Checklist

### Google Play
1. **Make an upload key** (once, on the Mac). Keep the file and passwords somewhere safe. If you lose them you cannot update the app.
   ```
   keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   base64 -i upload.jks | pbcopy        # copies the key file, ready to paste as a secret
   ```
2. **Add repository secrets** (GitHub → the repo → Settings → Secrets and variables → Actions → New repository secret):
   - `ANDROID_KEYSTORE_BASE64`: the copied text from step 1
   - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`: the passwords you chose
   - `ANDROID_KEY_ALIAS`: `upload`
3. **Create the app** in the Play Console (All apps → Create app). Name: *11+ Explorer*, free, app.
4. **Build:** Actions → *Android release (Google Play)* → Run workflow. Download `app-release.aab` from the run's Artifacts.
5. **First upload by hand:** Play Console → Testing → Internal testing → Create release → upload the `.aab`. Google requires the very first upload to be manual. Turn on *Play App Signing* when asked.
6. **Optional, for automatic uploads afterwards:** create a Google Cloud service account with access to the app (Play Console → Users and permissions), download its JSON key and save it as the secret `PLAY_SERVICE_ACCOUNT_JSON`. Each workflow run then uploads a draft to Internal testing.
7. Fill in the store listing, content rating, target audience and data safety forms. Suggested answers are below.

### App Store
1. **Register the bundle id:** developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → + → App IDs → `io.github.mukeshkbj.elevenplus`.
2. **Create the app** in App Store Connect → Apps → + → New App (iOS, name *11+ Explorer*, the bundle id above, SKU `elevenplus`).
3. **Create an API key:** App Store Connect → Users and Access → Integrations → App Store Connect API → generate a key with the **Admin** role (needed so the build can create its own signing certificate). Download the `.p8` file (you can only download it once).
4. **Add repository secrets:**
   - `APPLE_TEAM_ID`: developer.apple.com → Membership details
   - `ASC_KEY_ID` and `ASC_ISSUER_ID`: shown on the API keys page
   - `ASC_KEY_P8_BASE64`: run `base64 -i AuthKey_XXXX.p8 | pbcopy` and paste
5. **Build and upload:** Actions → *iOS release (App Store)* → Run workflow. After about 15 to 30 minutes the build appears in App Store Connect → TestFlight.
6. Test it on your iPhone with TestFlight, then add screenshots, fill in the listing and privacy answers, and submit for review.

To release a new version later: change `"version"` in `package.json` (for example to `1.0.1`), push, then push a tag: `git tag v1.0.1 && git push --tags`. Both workflows run on the tag.

## Store listing text

**Name (30):** 11+ Explorer

**Subtitle / short description (Apple 30, Google 80):**
- Apple: *Practice for the 11+ exam*
- Google: *Free 11+ practice: lessons, tests and mock exams for Maths, English and Reasoning.*

**Keywords (Apple, 100):** `11 plus,eleven plus,kent test,gl assessment,verbal reasoning,non verbal,maths,english,mock exam`

**Description:**

> 11+ Explorer helps children aged 9 to 11 prepare for the 11+ exam, with short lessons, friendly practice and real exam-style tests. It is built around the Kent Test (GL Assessment style) and covers all four subjects: Maths, English, Verbal Reasoning and Non-Verbal Reasoning.
>
> LEARN
> • 59 topics, each with a short lesson, a step-by-step method, common traps and a "Try one together" question
> • Practice with hints and full worked explanations for every answer
> • Questions get harder as your child improves, with a Challenge mode for the toughest ones
> • Endless fresh questions, including picture puzzles for non-verbal reasoning
>
> TEST
> • 10-minute tests and full mock exams laid out like the real exam, freshly made every time
> • Flag questions, check blanks before finishing, and keep an eye on the pace
> • "Fix my mistakes" brings back every wrong answer with a similar question
>
> STAY MOTIVATED
> • Ollie the owl, stars, streaks, ranks, medals, badges and printable certificates
>
> FOR PARENTS
> • PIN-protected parent view: practice time, readiness for each subject, topics that need attention
> • Separate profiles for brothers and sisters on one device
> • Optional: AI-made questions with your own API key, and sync between devices with your own Firebase project
>
> No adverts. No tracking. No sign-up. Progress stays on your device.
>
> 11+ Explorer is an independent practice app. It is not connected to GL Assessment, CEM, ISEB or any council or school.

**Category:** Education. **Price:** Free. **Privacy policy URL:** `https://mukeshkbj.github.io/11-plus-explorer/privacy.html`

**Screenshots needed:** iPhone 6.9" (1320 × 2868) and 6.5" (1284 × 2778) portrait; iPad 13" if iPad is supported; Google Play phone screenshots (at least 2, 16:9 or 9:16) plus a 1024 × 500 feature graphic.

## Suggested answers for the privacy and audience forms

Please read these yourself before submitting. They describe how the app works, but you are the one declaring them to Google and Apple.

**Age rating / content rating:** no violence, no user-generated content shared with others, no ads, no purchases → **4+ (Apple)**, **PEGI 3 / Everyone (Google)**.

**Apple Kids Category:** recommended **not** to choose the Kids Category. Its rules forbid sending information to third parties, and the optional AI and sync features do send data (only when a parent turns them on). List the app under *Education* with a 4+ rating instead. Everything a child can reach is already behind the parent PIN where it matters (AI settings, sync settings, links to GitHub).

**Google Play target audience:** the app is aimed at children 9 to 12, so the **Families policy** applies. The app has no ads and no analytics. In the declaration, mention that the AI and sync features are optional, off by default and set up by a parent behind a PIN.

**Data safety (Google) / App Privacy (Apple):**
- By default: **no data collected**. Everything is stored on the device.
- If you want to be fully cautious about the optional features, declare:
  - *App activity / Other user content* (practice progress): optional, sent only to the parent's own Firebase project when sync is turned on, encrypted in transit, deletable.
  - *Name* (child's first name): the same optional sync, linked to the parent's sign-in.
  - Not used for tracking, advertising or analytics. Not sold.
- AI requests contain the subject, topic and level only, with no personal data. They are sent with the parent's own key to the AI company the parent chooses.
