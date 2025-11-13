# Zoom Apps SDK Next.js Third Party OAuth sample app

## Overview

This repository contains a sample Zoom app built with Next.js using the Zoom Apps SDK.

**Key features:**

* **Next.js frontend**: A boilerplate web application for buiding Zoom apps.  

## Prerequisites
* Node
* Zoom credentials (Client ID, Client Secret)
* Supabase account

## Tech Stack
* Next.js
* Supabase
* ShadCN
* Tailwind CSS

# Setup developement envirnoment 

## Create Zoom Marketplace app 

The Zoom Marketplace build flow for a Zoom App is available [here](https://marketplace.zoom.us/develop/create). You will need a developer account with Zoom Apps enabled.

Use the following App manifest JSON object to configure the app:

* [App manifest](./0_zoom-app-quickstart-manifest/AppManifest.md)

## Setup .env files
Please see the .env.local.example file in the repository.

* Create a .env.local file by copying the example and filling in the values
  * If you are in development, use the Client ID and Client secret under Development
## Start multiple ngrok endpoints

To run multiple ngrok connections using a configuration file, run:

```bash
ngrok start nextjs supabase
```

You should the tunnel traffic: 

![HTTPS tunnel](assets/ngrok-https-tunnel.png)

You can use the following example ngrok [configuration file](https://gist.github.com/just-zoomit/d07f988c54d89f71fcc6b2643aa1223c) as a reference:

| Endpoint name | Public URL                 | Upstream port | Use case / purpose                                                                                 |
| ------------- | -------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `nextjs`      | `example.ngrok.io`         | 3000          | Serves the Next.js frontend (SSR/SSG pages, React components, dashboard UI, authentication flows). |
| `supabase`    | `example-backend.ngrok.io` | 54321         | Runs the Supabase backend (Postgres database, GoTrue auth, storage, and edge functions).           |

## Start Supabase locally

1. Navigate to the frontend project directory. Each local Supabase project is scoped to its directory. Then run:

   ```bash
   supabase start
   ```

   This starts the Supabase stack for the current project.

   * Studio will be available at: `http://localhost:54323`
   * The running project will reflect the configuration in `config.toml` for that directory.

2. **Verify the containers are running**:

   After starting Supabase, you should see output similar to:

   ```bash
   Started supabase local development setup.
   Studio URL: http://localhost:54323
   API URL: http://localhost:54321
   Check that the containers are running:
   ```

   Confirm by checking:

   ```bash
   docker ps
   ```

   You should see containers such as `supabase-studio`, `supabase-auth`, and `supabase-db`.

# Start developing

## Set up the project

1. **Clone the repository and install dependencies**:

   ```bash
   git clone https://github.com/just-zoomit/zoomapps-nextjs-sample.git
   cd zoomapps-nextjs-sample
   npm install
   ```

## Run the app locally

1. **Start both services from the root directory**:

   ```bash
   npm run dev
   ```

   * The frontend (Next.js) will be available at `http://localhost:3000` and at ngrok url endpoint.

## Additional Resources
* [Getting started with Zoom Apps SDK codelab](https://just-zoomit.github.io/get-started-with-zoomapps-sdk/#0)
  
## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/just-zoomit/zoomapps-nextjs-sample/tree/main?tab=License-1-ov-file) file for details.

