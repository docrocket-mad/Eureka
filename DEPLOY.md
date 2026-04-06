# Eureka! Chemistry — App Store Deployment Guide

## Prerequisites

### Android (Google Play Store)
- Google Play Developer account ($25 one-time fee) — https://play.google.com/console/signup
- Java JDK 21+ (already installed)
- Android SDK (already installed)
- A keystore for signing the release build (created below)

### iOS (Apple App Store)
- Apple Developer account ($99/year) — https://developer.apple.com/programs/enroll/
- A Mac with Xcode 15+ installed
- An Apple ID with two-factor authentication enabled

---

## Part 1: Android — Google Play Store

### Step 1: Create a Google Play Developer Account
1. Go to https://play.google.com/console/signup
2. Sign in with your Google account
3. Pay the $25 registration fee
4. Complete the developer profile (name, address, etc.)
5. Verify your identity (may take 1-2 days)

### Step 2: Generate a Signing Key
Run this once. Keep the keystore file safe — you need it for every future update.

```bash
cd c:/Projects/Eureka/android
keytool -genkey -v -keystore eureka-release.keystore -alias eureka -keyalg RSA -keysize 2048 -validity 10000
```

It will ask for:
- Keystore password (pick something strong, write it down)
- Your name, org, city, state, country
- Key password (can be same as keystore password)

**IMPORTANT: Never lose this keystore file or password. Without it you cannot update your app.**

### Step 3: Build the Release Bundle
```bash
cd c:/Projects/Eureka

# Sync web assets
npm run build:android

# Build release AAB (Android App Bundle)
cd android
./gradlew bundleRelease
```

The AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

If it's unsigned, sign it:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore eureka-release.keystore app/build/outputs/bundle/release/app-release.aab eureka
```

### Step 4: Create the Play Store Listing
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name**: Eureka! Chemistry
   - **Default language**: English
   - **App or game**: Game
   - **Free or paid**: Free
4. Complete the content rating questionnaire:
   - Category: **Education**
   - Target age: **All ages**
   - No violence, no ads, no data collection
5. Upload assets:
   - **App icon**: 512x512 — use `icons/icon-512x512.png`
   - **Feature graphic**: 1024x500 — you'll need to create this (screenshot of gameplay with logo)
   - **Screenshots**: At least 2 phone screenshots (take from browser dev tools at 1080x1920)
   - **Short description**: "Discover elements, combine molecules, and learn chemistry through play!"
   - **Full description**: See below

### Step 5: Upload and Publish
1. In Play Console, go to Production > Create new release
2. Upload the `.aab` file
3. Add release notes: "Initial release — discover 100+ elements, molecules, and compounds!"
4. Submit for review (usually 1-3 days for first app)

### Suggested Full Description
```
Eureka! Chemistry is a hands-on science discovery game where you combine elements to create molecules, compounds, and chemical reactions.

Start with hydrogen, oxygen, carbon, and nitrogen — then unlock 80+ elements across the periodic table by discovering new combinations. Every discovery teaches real chemistry through fun facts written by scientists.

Features:
- Drag-and-drop element combining on a virtual lab bench
- 100+ discoverable molecules and compounds
- Real chemistry facts for every discovery
- Danger Zone: learn about hazardous chemicals safely
- Dr. Rocket assistant with daily hints
- Background music and sound effects
- Save and sync your progress
- Works offline

Built for curious minds of all ages. No ads. No in-app purchases. Just science.
```

---

## Part 2: iOS — Apple App Store

### Step 1: Create an Apple Developer Account
1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID (create one if needed)
3. Pay the $99/year membership fee
4. Complete enrollment (may take up to 48 hours for verification)

### Step 2: Set Up on a Mac
You need a Mac for this part. Clone the repo and install dependencies:

```bash
git clone https://github.com/docrocket-mad/Eureka.git
cd Eureka
npm install
npm run build:ios
npx cap open ios
```

This opens the project in Xcode.

### Step 3: Configure Signing in Xcode
1. In Xcode, select the **App** target in the sidebar
2. Go to the **Signing & Capabilities** tab
3. Check "Automatically manage signing"
4. Select your Apple Developer team from the dropdown
5. Xcode will create provisioning profiles automatically

### Step 4: Build and Archive
1. In Xcode, set the target device to "Any iOS Device (arm64)"
2. Go to **Product > Archive**
3. Wait for the build to complete
4. In the Organizer window, click **Distribute App**
5. Choose **App Store Connect** > **Upload**
6. Follow the prompts to upload

### Step 5: Create the App Store Listing
1. Go to https://appstoreconnect.apple.com
2. Click My Apps > "+" > New App
3. Fill in:
   - **Platform**: iOS
   - **Name**: Eureka! Chemistry
   - **Primary language**: English
   - **Bundle ID**: com.artificerstudios.eureka
   - **SKU**: eureka-chemistry-2026
   - **Category**: Education > Games
   - **Content rating**: 4+ (no objectionable content)
4. Upload assets:
   - **App icon**: Automatically pulled from the build
   - **Screenshots**: Required for 6.7" (iPhone 15 Pro Max) and 6.5" (iPhone 11 Pro Max)
     - Take screenshots from Xcode Simulator at these sizes
   - **Description**: Same as Google Play (see above)
   - **Keywords**: chemistry, science, elements, periodic table, education, molecules, compounds
   - **Support URL**: https://github.com/docrocket-mad/Eureka/issues
5. Fill in the App Review Information:
   - Notes: "Educational chemistry game for all ages. Tap elements to place them on the lab bench, drag to combine. No account required."

### Step 6: Submit for Review
1. Select the uploaded build
2. Submit for review
3. Apple review typically takes 1-2 days
4. You may get asked questions — respond promptly

---

## Updating the App (Both Platforms)

When you make changes to the web code:

```bash
# Android
npm run build:android
cd android && ./gradlew bundleRelease
# Upload new AAB to Play Console

# iOS (on Mac)
npm run build:ios
npx cap open ios
# Archive and upload from Xcode
```

Bump the version in `package.json` and `capacitor.config.json` before each update.
For Android, also update `versionCode` and `versionName` in `android/app/build.gradle`.
For iOS, update the version in Xcode under the App target > General tab.

---

## Files You Must Never Lose

| File | Why |
|------|-----|
| `android/eureka-release.keystore` | Signs Android app — lose it and you can't update |
| Apple Developer credentials | Signs iOS app |
| `capacitor.config.json` | App identity config |

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer | $25 | One-time |
| Apple Developer Program | $99 | Per year |
| **Total to launch both** | **$124** | |
