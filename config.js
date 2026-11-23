// 11+ Explorer — sign-in settings for this website.
//
// Leave `firebase` as null and the app works with no sign-in: progress stays on each device.
// Paste your Firebase web config here and everyone who opens the site sees a sign-in page first,
// with the providers listed below. Signing in also keeps progress the same on every device.
// The web config is not a secret: Firebase security rules protect the data (see docs/LOGIN.md).
window.ELEVENPLUS_AUTH = {
  firebase: null,
  // firebase: { apiKey: "...", authDomain: "your-project.firebaseapp.com", projectId: "your-project", appId: "..." },

  // Buttons on the sign-in page, in order. Each one must also be turned on in
  // Firebase → Authentication → Sign-in method. Remove any you have not set up.
  providers: ['google', 'facebook', 'microsoft', 'apple', 'github', 'email'],

  // true = a "Use without an account" link is shown, so the app still works without signing in.
  allowGuest: true
};
