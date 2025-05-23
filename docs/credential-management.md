# Credential Management Guide

This guide outlines our approach to managing credentials and secrets for the HolistiQ application.

## Types of Credentials

We use several types of credentials in our application:

1. **Client-side public keys**: Safe to expose in the browser (prefixed with `VITE_PUBLIC_`)
2. **Server-side secrets**: Never exposed to the client (no `VITE_` prefix)
3. **Development credentials**: Lower-privilege credentials for local development
4. **Production credentials**: High-security credentials for production environment

## Credential Storage

### Local Development

- Store credentials in `.env.local` (never committed to Git)
- Use placeholder values in `.env.example` (committed to Git)
- Never hardcode credentials in application code

### Production

- Store credentials in Netlify Environment Variables
- Use different values for Production vs. Preview environments
- Restrict access to who can view/edit production credentials

## Accessing Credentials

### Client-side Code

Only access environment variables prefixed with `VITE_`:

```typescript
// In client-side code
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
```

### Build-time Code

Access any environment variable during the build process:

```javascript
// In build scripts or server-side code
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
```

## Security Practices

### Never Commit Credentials

- Always add credential files to `.gitignore`
- Use pre-commit hooks to prevent accidental commits
- If credentials are accidentally committed, rotate them immediately

### Credential Rotation

- Production credentials should be rotated every 90 days
- Development credentials should be rotated every 180 days
- Immediately rotate any potentially compromised credentials

### Rotation Procedure

1. Generate new credentials in the service provider
2. Update credentials in Netlify Environment Variables
3. Deploy and verify the application works with new credentials
4. Revoke old credentials after confirming everything works

### Emergency Credential Rotation

If credentials are accidentally exposed:

1. Generate new credentials immediately
2. Update credentials in Netlify
3. Force deploy the application
4. Revoke old credentials
5. Document the incident and review security practices

## Requesting Access

Team members can request access to credentials through:

1. The team password manager (for development credentials)
2. Netlify access controls (for production credentials)

All access requests must be approved by a team lead or security officer.
