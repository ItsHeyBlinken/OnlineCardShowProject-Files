import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps extends Omit<RouteProps, 'render'> {
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  children,
  ...rest
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        user ? (
          roles && !roles.includes(user.role) ? (
            <Redirect to="/" />
          ) : (
            React.cloneElement(children as React.ReactElement, props)
          )
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}; 