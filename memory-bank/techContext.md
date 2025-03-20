# Technical Context: Online Card Show

## Technologies Used

### Frontend
- **React**: JavaScript library for building user interfaces
- **Redux**: State management library
- **React Router**: Client-side routing
- **Styled Components**: CSS-in-JS styling
- **Axios**: HTTP client for API requests
- **Jest & React Testing Library**: Testing framework
- **Webpack**: Module bundler
- **Babel**: JavaScript compiler

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Sequelize**: ORM for database interactions
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **Winston**: Logging library
- **Jest & Supertest**: Testing frameworks

### Database
- **PostgreSQL**: Primary relational database
- **Redis**: In-memory data structure store for caching

### DevOps & Infrastructure
- **Docker**: Containerization
- **GitHub Actions**: CI/CD
- **AWS/Azure**: Cloud hosting (to be determined)
- **Nginx**: Web server and reverse proxy
- **PM2**: Process manager for Node.js

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Postman**: API testing
- **VSCode**: IDE
- **npm**: Package manager

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm (v7+)
- PostgreSQL (v13+)
- Redis (optional for local development)
- Docker & Docker Compose (for containerized development)

### Environment Setup
1. Clone the repository
2. Install dependencies using `npm install` in both frontend and backend directories
3. Set up local environment variables (.env files)
4. Start the development servers

### Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build production-ready assets
- `npm run test`: Run tests
- `npm run lint`: Run linting
- `npm run format`: Format code

### Database Setup
- Local development uses PostgreSQL database
- Migrations handled through Sequelize CLI
- Initial schema defined in DataBase_Schema.csv

## Technical Constraints

### Performance Requirements
- Page load time under 2 seconds
- API response time under 200ms for critical endpoints
- Support for high-resolution image galleries
- Ability to handle peak traffic during special events/releases

### Security Requirements
- HTTPS for all communications
- Secure authentication system
- PCI compliance for payment processing
- Data encryption for sensitive information
- GDPR compliance for user data

### Scalability Considerations
- Horizontal scaling for API servers
- Database read replicas for heavy query loads
- CDN for static assets
- Optimized image storage and delivery

### Browser & Device Support
- Modern browsers (last 2 versions)
- Mobile-responsive design
- Progressive enhancement for core functionality

## Dependencies

### Core External Services
- Payment processors (Stripe/PayPal)
- Email delivery service
- Cloud storage provider
- Analytics platform
- Search optimization service

### Third-party Integrations
- Shipping calculation and label generation
- Authentication providers (Google, Facebook)
- Market price data sources
- Collection management tools
- Image optimization services 