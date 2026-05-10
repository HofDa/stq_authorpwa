# PWA and Cache Rules

## Warning

Service workers are a high-regression area. They can make old bugs appear after the code is fixed because stale assets remain cached.

## Before changing PWA/cache behavior

- Read current Vite PWA configuration.
- Identify what is cached.
- Identify update strategy.
- Test first install, reload and update behavior.
- Test offline behavior.
- Test after clearing site data.

## Manual checks

- [ ] Fresh visit loads correctly.
- [ ] Reload after deploy/update loads latest assets.
- [ ] Offline app shell behavior is understandable.
- [ ] Online-only map tiles fail gracefully.
- [ ] No infinite reload loop.
- [ ] No stale JS/CSS after build update.
