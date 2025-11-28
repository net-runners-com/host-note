import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-toastify';
import { Loading } from '../../components/common/Loading';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      loginWithToken(token)
        .then(() => {
          toast.success('ログインしました');
          navigate('/', { replace: true });
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : 'ログインに失敗しました');
          navigate('/auth/login', { replace: true });
        });
    } else {
      toast.error('トークンが取得できませんでした');
      navigate('/auth/login', { replace: true });
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <Loading />
        <p className="mt-4 text-[var(--color-text-secondary)]">ログイン処理中...</p>
      </div>
    </div>
  );
}

