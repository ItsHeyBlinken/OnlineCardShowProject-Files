# Card Marketplace

## Overview

Card Marketplace is a web application that allows users to buy and sell trading cards. Users can create accounts, manage their profiles, and upgrade their accounts to become sellers. The application is built using React for the frontend and Node.js with Express for the backend, connected to a PostgreSQL database.

## Features

- User authentication (signup, login, logout)
- User roles (buyer and seller)
- Profile management
- Seller application process
- Responsive design

## Technologies Used

- **Frontend:**
  - React
  - React Router
  - Axios
  - Tailwind CSS (or any other CSS framework you prefer)

- **Backend:**
  - Node.js
  - Express
  - PostgreSQL
  - bcrypt (for password hashing)
  - jsonwebtoken (for authentication)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/card-marketplace.git
   cd card-marketplace
   ```

2. Navigate to the backend directory and install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Set up your PostgreSQL database and create the necessary tables. You can find the SQL schema in the `backend/db` directory.

4. Navigate to the frontend directory and install dependencies:

   ```bash
   cd ../frontend
   npm install
   ```

5. Create a `.env` file in the `backend` directory and add your database connection details:

   ```plaintext
   DATABASE_URL=postgres://username:password@localhost:5432/yourdatabase
   ```

### Running the Application

1. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend server:

   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to view the application.

## API Endpoints

### Authentication

- **POST /api/auth/login**: Log in a user.
- **POST /api/auth/logout**: Log out a user.
- **POST /api/auth/become-seller**: Upgrade a buyer account to a seller account.
- **GET /api/auth/user**: Get the current user's information.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the contributors and the open-source community for their support and resources.
