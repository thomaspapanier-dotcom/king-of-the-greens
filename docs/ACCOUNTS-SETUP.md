# Turning on accounts

The app side is built: sign-in, unique gamertags and profile photos. It needs a Supabase project, which is free.

## 1. Create the project (about 5 minutes)

1. Go to supabase.com and sign up.
2. Create a **New project**. Name it `KOG` and pick the region closest to you. Keep the database password to yourself.
3. Open **SQL Editor → New query**. Paste in `supabase/setup.sql` and press **Run**. Then do the same with `supabase/accounts.sql`.
4. Open **Project Settings → API**. Copy the **Project URL** and the **publishable** (anon) key and send them to Claude, who puts them in `js/config.js`. Both are designed to be public. Never share the **secret** or **service_role** key.

## 2. Turn on sign-in methods

In **Authentication → Providers**:

- **Email:** on by default, and the quickest way to test. The free built-in email service sends only a few emails per hour.
- **Google:** free. In Google Cloud Console, create an OAuth client (type "Web"), set its redirect URL to the one Supabase shows on the Google provider page, then paste the client ID and secret into Supabase.
- **Phone:** needs a text-message service such as Twilio, which charges a few cents per text plus a monthly number. Paste its keys into Supabase's Phone provider.
- **Apple:** needs the Apple Developer Program ($99/yr), the same account the App Store version needs.

In **Authentication → URL Configuration**, add the app's address to **Redirect URLs**: `http://localhost:5173` for testing on this computer, plus the website address once KOG is hosted.

## 3. Host the app

The claude.ai preview link can't reach outside servers, so accounts only work from KOG's own website. The plan is GitHub Pages, which is free.
