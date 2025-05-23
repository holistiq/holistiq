# Holistiq

Holistiq is an evidence-based supplement tracking platform that helps users objectively measure the efficacy of cognitive-enhancing supplements (nootropics). While supplement companies make bold claims about improved memory, focus, and cognitive performance, consumers have no reliable way to verify these effects for themselves. Holistiq solves this problem by providing standardized cognitive assessments, supplement tracking, and data visualization to help users determine which supplements actually work for their unique biology.

## How can I edit this code?

You can work with this codebase using your preferred IDE by cloning the repository and pushing changes.

### Local Development Setup

To work locally, you need Node.js and npm. It is strongly recommended to use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage your Node.js versions.

#### Quick Start

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# 4. Start the development server
npm run dev
```

For more detailed information about environment variables and configuration, see [Environment Variables Guide](docs/environment-variables.md).

You can also use GitHub Codespaces for browser-based development.


**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project is configured for deployment on **Netlify** with automatic deployments from GitHub.

### Quick Deployment to Netlify

1. **Connect Repository**: Import your GitHub repository to Netlify
2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set Environment Variables**: Add your Supabase credentials
4. **Deploy**: Push to `main` branch for production, `develop` for preview

For detailed deployment instructions, see the [Netlify Deployment Guide](docs/netlify-deployment.md).

### Alternative Hosting Options

The project can also be deployed to:
- AWS Amplify
- GitHub Pages
- Heroku
- Any static hosting service

To deploy elsewhere, build the project using `npm run build` and deploy the resulting files from the `dist` directory.

### Environment Variables in Production

When deploying to production, you need to set up environment variables securely:

- **Netlify**: Configure environment variables in the site settings
- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Heroku**: Use config vars in the app settings

Never commit sensitive credentials to version control. See the [Netlify Deployment Guide](docs/netlify-deployment.md) for more details on secure credential management.
