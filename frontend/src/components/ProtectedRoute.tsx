import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    path: string;
    role?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, path, role }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Route
            path={path}
            render={({ location }) => 
                user ? (
                    !role || user.role === role ? (
                        children
                    ) : (
                        <Redirect to="/" />
                    )
                ) : (
                    <Redirect
                        to={{
                            pathname: "/login",
                            state: { from: location }
                        }}
                    />
                )
            }
        />
    );
};

export default ProtectedRoute; 