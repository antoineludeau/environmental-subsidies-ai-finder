# Environmental Subsidies AI Finder

This chat application is designed to leverage the power of a Large Language Model (LLM), such as OpenAI's GPT, to assist users in discovering environmental subsidies that align with their specific requirements. The app simplifies the process of navigating through complex policies, terms, and regional programs to identify subsidies that users might qualify for.


<p align="center">
  <img width="619" alt="Capture d’écran 2024-12-11 à 14 32 23" src="https://github.com/user-attachments/assets/49cadd14-782e-4b94-a40b-56f122b61b13" />
</p>


## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [License](#license)

---

## Features

Interface :
- Built with **Next.js 15** for fast and SEO-friendly rendering
- Styled with **Tailwind CSS 3**, a utility-first CSS framework

API :
- Powered by **Node.js** for a scalable, non-blocking JavaScript runtime environment
- Built with **Express 4**, a minimal and flexible Node.js framework for handling API routing and middleware
- Integrated with **MongoDB**, a NoSQL, document-oriented database for flexible and scalable data storage
- Leveraging **OpenAI API** to utilize cutting-edge AI models for intelligent features

Both :
- Developed using **TypeScript 5** for robust type checking and maintainability
- Dockerized for quick local deployment

## Getting Started

### Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Node.js** (v18.18.0 or later) – [Download Node.js](https://nodejs.org/)
- **npm** – comes with Node.js or can be installed separately

If you want to deploy using docker and docker compose : 
- **Docker** (v20.10 or later)
- **Docker Compose** (v2.0 or later)
The easiest and recommended way to get Docker and Docker Compose is to install [Docker Desktop](https://www.docker.com/products/docker-desktop/). It includes Docker Compose along with Docker Engine and Docker CLI which are Compose prerequisites.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/antoineludeau/environmental-subsidies-ai-finder.git
   cd environmental-subsidies-ai-finder
   ```

2. **Env variables**

- Copy the .env.sample file into a .env file
- Enter a valid OPENAI_API_KEY (replacing "your_openai_api_key" in the .env file)

To get an OpenAI API key : https://platform.openai.com/api-keys

3. **Build & Run using Docker and Docker Compose**

You can build and run the application locally using Docker & Docker Compose :

Simply run the command : 
  ```bash
  docker compose up --build -d
  ```

This command will build and run 3 services : 
- **interface** (Next.js)
- **api** (Express)
- **database** (MongoDB) - the mongodb instance is initialized with environmental subsidies data


Open http://localhost:3000 in your browser to view the application.

## Architecture

<p align="center">
  <img width="847" alt="Capture d’écran 2024-12-11 à 14 33 35" src="https://github.com/user-attachments/assets/b8113c0f-47e5-4b04-8714-6d041de42300" />
</p>

## Folder structure

  ```bash
  environmental-subsidies-ai-finder/
  ├── api/                    # api code folder
  ├── interface/              # interface code folder
  ├── .env.sample             # Env sample file to copy as .env file
  ├── .gitignore              # Git ignore file
  ├── compose.yml             # Docker Compose configuration
  ├── LICENSE.md              # License file
  ├── README.md               # Documentation for the project
  ```


## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
