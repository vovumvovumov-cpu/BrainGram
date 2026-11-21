# BrainGram Android — upstream and integration plan

BrainGram's native Android client is being prepared as a separate application. The existing React/Vite web client remains unchanged.

## Upstream source

- Project: https://github.com/TelegramMessenger/Telegram-Android
- Official source repository: https://github.com/TelegramMessenger/Telegram-Android
- License declared by upstream: GNU GPL version 2 or later (GPL-2.0-or-later).
- Upstream build guide: https://github.com/TelegramMessenger/Telegram-Android#compilation-guide

This file records the upstream dependency; it does not copy or modify Telegram source files.

## Important architecture boundary

The Telegram Android application is a client for Telegram's MTProto services. BrainGram uses its own Supabase-backed accounts, profiles and direct-message schema. Rebranding the Telegram APK alone would still connect to Telegram's services; it would NOT make a BrainGram client.

The native port therefore has two distinct workstreams:

1. Preserve and adapt the upstream Android UI, navigation and reusable presentation code while keeping all upstream copyright and license notices.
2. Replace Telegram-specific authentication, networking, storage and messaging integrations with BrainGram services. This is a substantial integration task and must be implemented and security-reviewed before the app can be called a working BrainGram messenger.

Do not add Telegram API credentials, Firebase secrets, signing keys, Supabase service-role keys, or other secrets to source control.

## Upstream build environment

The upstream README currently specifies:

- Android Studio 2025.1.4
- Android SDK 36
- Android NDK 27.2.12479018

Use the exact versions documented by the upstream revision being built. Open the cloned project in Android Studio as instructed upstream.

## Obtain the upstream source locally

From a terminal:

```bash
git clone --recursive --shallow-submodules https://github.com/TelegramMessenger/Telegram-Android.git BrainGram-Android-Upstream
cd BrainGram-Android-Upstream
```

If submodules were not initialized:

```bash
git submodule update --init --recursive --depth=1
```

Do not copy upstream source into the BrainGram web app's `src/` directory. Keep the native Android project separate.

## BrainGram identity and distribution checklist

Before creating a distributable APK:

- Set a distinct application ID (for example, `app.braingram.android`) consistently in Gradle and Android source/configuration.
- Use BrainGram's own name, icon and visual assets. Do not use Telegram's name or standard paper-plane logo in a way that implies official affiliation.
- Replace upstream demo/release signing material and placeholder service configuration with BrainGram-owned configuration.
- Decide and implement the BrainGram backend adapter; Telegram's MTProto client is not a Supabase client.
- Retain upstream copyright notices and GPL license text. Publish the complete corresponding source of the distributed modified GPL-covered client and provide the required license notices/source offer.
- Build and test a debug APK first. A release APK requires a BrainGram-owned signing key kept outside Git.

## Current status

This is an integration plan only. No Android APK has been built, no Telegram source has yet been imported into this repository, and no Supabase-to-native adapter has been implemented.
