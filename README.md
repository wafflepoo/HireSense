# HireSense

This project consists of a client-side application and a server-side API.

## Prerequisites

Before you begin, ensure you have met the following requirements:

* **Node.js**: Make sure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/). It is recommended to use the LTS (Long Term Support) version.
* **npm** (Node Package Manager) or **Yarn**: These are typically installed with Node.js. npm is generally preferred for consistency.

## Installation

To get a copy of the project up and running on your local machine, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install client dependencies:**

    Navigate into the `client` directory and install the necessary Node.js modules.

    ```bash
    cd client
    npm install # or yarn install
    ```

3.  **Install server dependencies:**

    Navigate into the `server` directory and install the necessary Node.js modules.

    ```bash
    cd server # Go back to the root and then into server, or navigate directly
    npm install # or yarn install
    ```

## Running the Project

To run both the client and server applications, you will need two separate terminal windows.

1.  **Start the Server:**

    In your first terminal, navigate to the `server` directory and start the server.

    ```bash
    cd server
    npm run server # Or 'node index.js' or whatever your server start command is
    ```
    The server will typically run on `http://localhost:5000` (or another port specified in your server configuration).

2.  **Start the Client:**

    In your second terminal, navigate to the `client` directory and start the client application.

    ```bash
    cd client
    npm run dev # Or 'npm run dev' or whatever your client start command is
    ```
    The client application will typically open in your browser at `http://localhost:5173` (or another port specified by your client-side framework).
