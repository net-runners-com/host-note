import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useSettingsStore } from "./stores/settingsStore";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthRoute } from "./components/auth/AuthRoute";
import { HostCheck } from "./components/auth/HostCheck";
import { Skeleton } from "./components/common/Skeleton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 認証ページ（即座に読み込む）
import LoginPage from "./pages/Auth/Login";
import RegisterPage from "./pages/Auth/Register";
import AuthCallbackPage from "./pages/Auth/Callback";

// メインページ（遅延読み込み）
const HomePage = lazy(() => import("./pages/Home"));
const HimeListPage = lazy(() => import("./pages/Hime/List"));
const HimeDetailPage = lazy(() => import("./pages/Hime/Detail"));
const HimeAddPage = lazy(() => import("./pages/Hime/Add"));
const HimeAnalysisPage = lazy(() => import("./pages/Hime/Analysis"));
const AnalysisPage = lazy(() => import("./pages/Analysis"));
const CastListPage = lazy(() => import("./pages/Cast/List"));
const CastDetailPage = lazy(() => import("./pages/Cast/Detail"));
const CastAddPage = lazy(() => import("./pages/Cast/Add"));
const TableListPage = lazy(() => import("./pages/Table/List"));
const TableDetailPage = lazy(() => import("./pages/Table/Detail"));
const TableAddPage = lazy(() => import("./pages/Table/Add"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const VisitListPage = lazy(() => import("./pages/Visit/List"));
const VisitAddPage = lazy(() => import("./pages/Visit/Add"));
const ToolsPage = lazy(() => import("./pages/Tools"));
const AIToolsPage = lazy(() => import("./pages/Tools/AITools"));
const AIAnalysisPage = lazy(() => import("./pages/Tools/AIAnalysis"));
const ExportPage = lazy(() => import("./pages/Tools/Export"));
const FillInTheBlankPage = lazy(() => import("./pages/Tools/FillInTheBlank"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AccountPage = lazy(() => import("./pages/Settings/Account"));
const MemoPage = lazy(() => import("./pages/Memo"));

// ローディングコンポーネント
const PageSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton variant="rectangular" width="100%" height={40} />
    <Skeleton variant="rectangular" width="100%" height={200} />
    <Skeleton variant="rectangular" width="100%" height={200} />
  </div>
);

function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    loadSettings();
    checkAuth();
  }, [loadSettings, checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 認証不要なルート */}
        <Route
          path="/auth/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* 認証が必要なルート */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HostCheck>
                <Layout />
              </HostCheck>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageSkeleton />}>
                <HomePage />
              </Suspense>
            }
          />

          {/* 姫 */}
          <Route path="hime">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <HimeListPage />
                </Suspense>
              }
            />
            <Route
              path="add"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <HimeAddPage />
                </Suspense>
              }
            />
            <Route
              path="analysis"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <HimeAnalysisPage />
                </Suspense>
              }
            />
            <Route
              path=":id"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <HimeDetailPage />
                </Suspense>
              }
            />
          </Route>

          {/* キャスト */}
          <Route path="cast">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <CastListPage />
                </Suspense>
              }
            />
            <Route
              path="add"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <CastAddPage />
                </Suspense>
              }
            />
            <Route
              path=":id"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <CastDetailPage />
                </Suspense>
              }
            />
          </Route>

          {/* 卓記録 */}
          <Route path="table">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <TableListPage />
                </Suspense>
              }
            />
            <Route
              path="add"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <TableAddPage />
                </Suspense>
              }
            />
            <Route
              path=":id"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <TableDetailPage />
                </Suspense>
              }
            />
          </Route>

          {/* カレンダー */}
          <Route
            path="calendar"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <CalendarPage />
              </Suspense>
            }
          />

          {/* 来店履歴 */}
          <Route path="visit">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <VisitListPage />
                </Suspense>
              }
            />
            <Route
              path="add"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <VisitAddPage />
                </Suspense>
              }
            />
          </Route>

          {/* 分析 */}
          <Route
            path="analysis"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <AnalysisPage />
              </Suspense>
            }
          />

          {/* メモ */}
          <Route
            path="memo"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <MemoPage />
              </Suspense>
            }
          />

          {/* ツール */}
          <Route path="tools">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ToolsPage />
                </Suspense>
              }
            />
            <Route
              path="ai-tools"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AIToolsPage />
                </Suspense>
              }
            />
            <Route
              path="ai-analysis"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AIAnalysisPage />
                </Suspense>
              }
            />
            <Route
              path="export"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <ExportPage />
                </Suspense>
              }
            />
            <Route
              path="fill-in-the-blank"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <FillInTheBlankPage />
                </Suspense>
              }
            />
          </Route>

          {/* 設定 */}
          <Route path="settings">
            <Route
              index
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <SettingsPage />
                </Suspense>
              }
            />
            <Route
              path="account"
              element={
                <Suspense fallback={<PageSkeleton />}>
                  <AccountPage />
                </Suspense>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
}

export default App;
