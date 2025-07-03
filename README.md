# Chrome Password Manager Prototype

This is a **prototype** for a lightweight Chrome extension designed to manage passwords locally using Chrome's `storage.sync` API. The goal of this version is to demonstrate the core concepts of saving, autofilling, and generating passwords before evolving into a fully featured version with **encrypted data storage** and **cross-device synchronization**.

---

## Overview

This prototype focuses on simplicity and concept validation. It uses Chrome's built-in storage for saving passwords, making it easy to set up and test without complex backend infrastructure. It also serves as a learning project to get familiar with Chrome extension APIs, scripting, and storage mechanisms.

---

## Features

- Save passwords per website URL using Chrome storage.
- Autofill login forms automatically on supported pages.
- Generate strong passwords with options for length and symbol inclusion.
- Password validation checks for length, uppercase letters, numbers, and special characters.
- Auto-clear password fields from forms on inactivity for privacy.
- User interface for adding, deleting, and managing stored passwords.

---

## Limitations & Disclaimer

- Passwords are stored in plain text using Chrome storage, so this is **not secure for sensitive data**.
- No built-in encryption—users can add encryption with a master key stored only in memory, requiring manual input on each session.
- Intended for educational use or as a concept proof, **not a production-ready password manager**.

---

## Possible Improvements

- Implement full end-to-end encryption with a user master password.
- Add cloud or server-side encrypted sync.
- Enable secure password export/import functionality.

---

## Installation

1. Clone or download this repository.
2. Load the unpacked extension in Chrome via `chrome://extensions` > Developer Mode > Load unpacked.
3. Select the folder with the source code.
4. Use the popup UI to add and manage your passwords.
