import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useCastStore } from "../../stores/castStore";
import { api } from "../../utils/api";
import { Loading } from "../common/Loading";
import { logError } from "../../utils/errorHandler";
import MyCastSetupModal from "./MyCastSetupModal";

interface HostCheckProps {
  children: React.ReactNode;
}

export function HostCheck({ children }: HostCheckProps) {
  const { isAuthenticated } = useAuthStore();
  const loadCastList = useCastStore((state) => state.loadCastList);
  const [checking, setChecking] = useState(true);
  const [hasMyCast, setHasMyCast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }

    checkMyCast();
  }, [isAuthenticated]);

  const checkMyCast = async () => {
    try {
      const result = await api.myCast.check();
      setHasMyCast(result.exists);

      if (result.exists) {
        await syncMyCastFromServer();
      } else {
        setShowModal(true);
      }
    } catch (error) {
      logError(error, { component: 'HostCheck', action: 'checkMyCast' });
    } finally {
      setChecking(false);
    }
  };

  const syncMyCastFromServer = async () => {
    try {
      await loadCastList();
    } catch (error) {
      logError(error, { component: 'HostCheck', action: 'syncMyCastFromServer' });
    }
  };

  const handleMyCastCreated = async () => {
    setHasMyCast(true);
    setShowModal(false);
    await loadCastList();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <>
      {children}
      {showModal && !hasMyCast && (
        <MyCastSetupModal onSuccess={handleMyCastCreated} />
      )}
    </>
  );
}
