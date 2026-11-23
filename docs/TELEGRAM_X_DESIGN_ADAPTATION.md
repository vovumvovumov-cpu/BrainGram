# Telegram X interface adaptation for BrainGram

## Scope

Use Telegram X as a visual and interaction reference for the BrainGram web client. Do not copy Telegram branding, logos, name, or imply that BrainGram is an official Telegram client.

## Important architecture boundary

The upstream Telegram X project is a native Android application built around TDLib and is licensed under GPL-3.0. BrainGram is currently a React + Vite web application backed by Supabase. Telegram X's Android screens cannot be dropped into the existing browser app as reusable React components.

For the current web product, recreate the relevant Telegram X interaction patterns in BrainGram's existing React UI rather than replacing the web app with the native Telegram X project.

## Preserve existing BrainGram functionality

- Keep Supabase email authentication and user profiles.
- Keep username discovery and direct-message conversations.
- Keep existing Supabase Realtime subscriptions and message history.
- Keep the current deployment/build workflow.
- Do not replace BrainGram's backend with Telegram's MTProto/TDLib services.
- Do not remove existing routes, screens, or working features as part of a visual redesign.

## UI adaptation targets

1. Telegram X-inspired chat list: compact rows, avatar, name, last-message preview, timestamp, unread count, pinned/muted states.
2. Conversation screen: familiar top app bar, message bubbles, reply/forward affordances, composer and attachment actions.
3. Navigation: mobile-friendly bottom navigation and desktop layout that adapts without introducing Discord-style servers/channels.
4. Search and contacts: retain BrainGram's existing username search and direct-message flow.
5. Profile and settings: use consistent Telegram X-inspired spacing and controls while retaining BrainGram account data and settings.

## Upstream source and license

- Upstream: https://github.com/TGX-Android/Telegram-X
- License: GNU General Public License v3.0 (see upstream LICENSE).
- If native Telegram X source code is later incorporated into a distributed Android build, preserve required copyright/license notices, mark modified files, provide corresponding source under GPL-3.0, and review each third-party dependency's separate license.
- This document does not import or copy upstream source code.

## Next implementation step

Inspect the current React screens and styles, then adapt one screen at a time, starting with the chat list. Verify the production build and existing Supabase flows after each change before merging.
