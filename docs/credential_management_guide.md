# Credential Management Best Practices

This guide provides detailed instructions for securely managing credentials (API keys, database connection strings, etc.) across local development, version control, and production deployments.

## Table of Contents

1. [Understanding the Risks](#understanding-the-risks)
2. [Local Development Environment](#local-development-environment)
3. [Version Control Security](#version-control-security)
4. [Production Deployment](#production-deployment)
5. [Credential Rotation and Revocation](#credential-rotation-and-revocation)
6. [Implementation Examples](#implementation-examples)

## Understanding the Risks

Improper credential management can lead to:

- Unauthorized access to databases and services
- Data breaches and leaks
- Compliance violations
- Financial losses from abuse of paid services
- Reputation damage

Common mistakes include:
- Hardcoding credentials in source code
- Committing .env files to version control
- Using the same credentials across environments
- Not rotating credentials regularly
- Overly permissive access policies

## Local Development Environment

### Setting Up Environment Variables

1. **Create environment files**:
   ```
   # .env.example (committed to repository)
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_key_here
   ANALYTICS_API_KEY=your_analytics_api_key_here
   
   # .env.local (not committed, for local development)
   SUPABASE_URL=https://actual-project-url.supabase.co
   SUPABASE_KEY=actual_key_value
   ANALYTICS_API_KEY=actual_api_key
   ```

2. **Ensure proper gitignore configuration**:
   ```
   # .gitignore
   # Environment variables
   .env
   .env.local
   .env.development.local
   .env.test.local
   .env.production.local
   ```

3. **Validate environment variables on startup**:
   ```javascript
   // scripts/validate-env.js
   const requiredEnvVars = [
     'SUPABASE_URL',
     'SUPABASE_KEY',
     // Add other required variables
   ];
   
   const missingEnvVars = requiredEnvVars.filter(
     (envVar) => !process.env[envVar]
   );
   
   if (missingEnvVars.length > 0) {
     console.error('Error: Missing required environment variables:');
     missingEnvVars.forEach((envVar) => {
       console.error(`- ${envVar}`);
     });
     console.error('Please check your .env file and try again.');
     process.exit(1);
   }
   
   console.log('✅ Environment validation passed!');
   ```

4. **Add validation to your startup script**:
   ```json
   // package.json
   {
     "scripts": {
       "dev": "npm run validate-env && vite",
       "validate-env": "node scripts/validate-env.js"
     }
   }
   ```

### Sharing Credentials Among Team Members

1. **Option 1: Secure password manager**
   - Use a team password manager like 1Password, LastPass, or Bitwarden
   - Create a shared vault for development credentials
   - Document the process for requesting access

2. **Option 2: Encrypted configuration**
   - Use a tool like [git-crypt](https://github.com/AGWA/git-crypt) to encrypt sensitive files
   - Share decryption keys securely with team members
   - Example setup:
     ```bash
     # Initialize git-crypt in your repository
     git-crypt init
     
     # Add a key for a team member
     git-crypt add-gpg-user user@example.com
     
     # Configure which files to encrypt
     echo ".env.development filter=git-crypt diff=git-crypt" > .gitattributes
     ```

3. **Option 3: Secrets management service**
   - Use a service like HashiCorp Vault or AWS Secrets Manager
   - Implement a secure retrieval mechanism in your development workflow
   - Document the access process for new team members

## Version Control Security

### Preventing Credential Leaks

1. **Pre-commit hooks**
   
   Install and configure git hooks to prevent committing secrets:
   
   ```bash
   # Install Husky for Git hooks
   npm install --save-dev husky
   
   # Set up pre-commit hook
   npx husky add .husky/pre-commit "npx secretlint"
   
   # Install secretlint
   npm install --save-dev @secretlint/secretlint @secretlint/secretlint-rule-preset-recommend
   ```
   
   Create a secretlint configuration:
   ```json
   // .secretlintrc.json
   {
     "rules": [
       {
         "id": "@secretlint/secretlint-rule-preset-recommend"
       }
     ]
   }
   ```

2. **Git secrets scanning**

   Use git-secrets to prevent committing AWS credentials and other patterns:
   
   ```bash
   # Install git-secrets
   brew install git-secrets  # macOS
   
   # Set up git-secrets in your repository
   git secrets --install
   git secrets --register-aws
   
   # Add custom patterns
   git secrets --add 'SUPABASE_KEY=\w+'
   git secrets --add 'API_KEY=\w+'
   ```

3. **GitHub security scanning**

   Enable GitHub's secret scanning for your repository:
   
   1. Go to your repository on GitHub
   2. Navigate to Settings > Security & analysis
   3. Enable "Secret scanning"

### Recovery from Accidental Credential Exposure

If credentials are accidentally committed:

1. **Immediate steps**:
   - Rotate the exposed credentials immediately
   - Do NOT just remove the credentials in a new commit (they remain in history)
   - Consider using tools like BFG Repo-Cleaner to remove secrets from history

2. **Example credential rotation process**:
   ```bash
   # 1. Immediately revoke and rotate the exposed credential
   # 2. Clean the repository history
   git clone --mirror git://example.com/repo.git
   java -jar bfg.jar --replace-text secrets.txt repo.git
   cd repo.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push
   ```

## Production Deployment

### Platform-Specific Configuration

#### Vercel

1. **Setting environment variables**:
   - Go to your project in the Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add each variable and value
   - Specify which environments (Production, Preview, Development) should use each variable

2. **Using different values per environment**:
   - Click "Add New" under Environment Variables
   - Enter the name and value
   - Select which environments should use this value
   - For Preview environments, you can also set branch-specific values

3. **Accessing in your application**:
   ```javascript
   // Access environment variables the same way as in local development
   const supabaseUrl = process.env.SUPABASE_URL;
   const supabaseKey = process.env.SUPABASE_KEY;
   ```

#### Netlify

1. **Setting environment variables**:
   - Go to your site in the Netlify dashboard
   - Navigate to Site settings > Build & deploy > Environment
   - Add variables under "Environment variables"

2. **Per-context configuration**:
   Create a `netlify.toml` file in your repository:
   ```toml
   [context.production.environment]
     SUPABASE_URL = "production-url"
     # Don't put actual secrets here, use the Netlify UI
   
   [context.deploy-preview.environment]
     SUPABASE_URL = "preview-url"
   ```

3. **Accessing in your application**:
   ```javascript
   // Access environment variables the same way as in local development
   const supabaseUrl = process.env.SUPABASE_URL;
   const supabaseKey = process.env.SUPABASE_KEY;
   ```

### Using Secrets Management Services

For more complex deployments, consider:

1. **AWS Secrets Manager**:
   - Store secrets in AWS Secrets Manager
   - Use AWS SDK to retrieve secrets at runtime
   - Implement caching to reduce API calls

2. **HashiCorp Vault**:
   - Set up Vault for centralized secrets management
   - Implement authentication for your application
   - Use Vault's API to retrieve secrets at runtime

3. **Google Secret Manager**:
   - Store secrets in Google Secret Manager
   - Use Google Cloud client libraries to access secrets
   - Implement proper IAM roles for access control

## Credential Rotation and Revocation

### Implementing Regular Rotation

1. **Establish a rotation schedule**:
   - High-sensitivity credentials: Every 30-90 days
   - Medium-sensitivity credentials: Every 90-180 days
   - Low-sensitivity credentials: Annually

2. **Automate the rotation process**:
   - Use a secrets management service with rotation capabilities
   - Implement a CI/CD job to handle rotation
   - Document manual rotation procedures as backup

3. **Zero-downtime rotation**:
   - Implement credential versioning
   - Allow overlap periods where both old and new credentials work
   - Gradually transition services to new credentials

### Emergency Revocation

1. **Create an emergency revocation procedure**:
   - Document steps to immediately revoke compromised credentials
   - Identify all services using the compromised credential
   - Have backup authentication methods ready

2. **Post-incident analysis**:
   - Document how the credential was exposed
   - Implement measures to prevent similar incidents
   - Review and improve security practices

## Implementation Examples

### Example: Environment Variable Validation

```javascript
// src/utils/validateEnv.js
export function validateEnvironment() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'ANALYTICS_API_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing critical environment variables in production');
    }
  }
}

// Call this early in your application startup
validateEnvironment();
```

### Example: Secure Credential Access Pattern

```javascript
// src/services/credentialManager.js
class CredentialManager {
  // Private storage for credentials
  #credentials = {};
  
  constructor() {
    // Initialize with environment variables
    this.#credentials = {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
      },
      analytics: {
        apiKey: process.env.ANALYTICS_API_KEY,
      }
    };
  }
  
  // Controlled access to credentials
  getCredential(service, key) {
    if (!this.#credentials[service]) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    if (!this.#credentials[service][key]) {
      throw new Error(`Unknown credential key: ${key} for service ${service}`);
    }
    
    return this.#credentials[service][key];
  }
}

// Singleton instance
export const credentialManager = new CredentialManager();

// Usage
const supabaseKey = credentialManager.getCredential('supabase', 'key');
```

This pattern provides an additional layer of security by:
- Encapsulating credentials in a private class property
- Providing controlled access through methods
- Centralizing credential access for easier auditing and management
