# Glossary

## SouthTyrolQuests / STQ

The broader app ecosystem for GPS-guided riddle tours in South Tyrol.

## Author PWA

This repository. A web-based authoring tool for creating and exporting tours.

## Flutter player

The mobile app that consumes the exported tour/riddle JSON and is used by end users during tours.

## RRR

Reactive Riddle Runtime. Modular system for evaluating interactive riddle modules, conditions and runtime state.

## RRR core

Framework-independent TypeScript logic. No React. No browser APIs.

## Field mode

Mobile-first authoring mode intended for creating or refining stations outdoors, directly at the location.

## Station

A place or step within a tour. Usually contains location, content, riddle and success/follow-up text.

## Draft

Locally stored authoring state, persisted via IndexedDB/Dexie.

## Export

Generated bundle containing tour metadata, riddle JSON and local media assets for use by the player app.
