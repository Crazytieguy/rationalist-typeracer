# Rationalist Typeracer

A real-time multiplayer typing game built with modern web technologies. Race against other players with lorem ipsum text, see live progress, and compete for the best WPM!

## Quick Start

1.  **Install pnpm:**

    ```bash
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    ```

2.  **Install dependencies:**

    ```bash
    pnpm run init
    ```

3.  **Run the app:**

    ```bash
    pnpm dev
    ```

## Features

- **Real-time multiplayer racing** - Race against other players in real-time
- **Live progress tracking** - See everyone's progress as they type
- **WPM calculation** - Track words per minute with live updates
- **Race rooms** - Join or create racing rooms
- **Authentication** - Secure user accounts with Clerk

## Tech Stack

- **Frontend**: React + Vite + TanStack Router
- **Backend**: Convex (real-time database + serverless functions)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + DaisyUI

## Deployment

### Netlify

This template includes a `netlify.toml` file configured for Convex deployments. To deploy:

1. Connect your repository to Netlify via their GitHub integration
2. Set `CONVEX_DEPLOY_KEY` in Netlify environment variables (generate in Convex dashboard)
3. Set `VITE_CLERK_PUBLISHABLE_KEY` for your production environment

For detailed instructions, see [Convex Netlify Deployment Guide](https://docs.convex.dev/production/hosting/netlify).

## License

MIT
