import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface AuthRouteProps {
  children: React.ReactNode;
}

export function AuthRoute({ children }: AuthRouteProps) {
  const { isAuthenticated } = useAuthStore();

  // 既にログインしている場合はホームにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

