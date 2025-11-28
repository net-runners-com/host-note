import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useSettingsStore } from "./stores/settingsStore";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/layout/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthRoute } from "./components/auth/AuthRoute";
import { HostCheck } from "./components/auth/HostCheck";
import LoginPage from "./pages/Auth/Login";
import RegisterPage from "./pages/Auth/Register";
import AuthCallbackPage from "./pages/Auth/Callback";
import HomePage from "./pages/Home";
import HimeListPage from "./pages/Hime/List";
import HimeDetailPage from "./pages/Hime/Detail";
import HimeAddPage from "./pages/Hime/Add";
import HimeAnalysisPage from "./pages/Hime/Analysis";
import AnalysisPage from "./pages/Analysis";
import CastListPage from "./pages/Cast/List";
import CastDetailPage from "./pages/Cast/Detail";
import CastAddPage from "./pages/Cast/Add";
import TableListPage from "./pages/Table/List";
import TableDetailPage from "./pages/Table/Detail";
import TableAddPage from "./pages/Table/Add";
import CalendarPage from "./pages/Calendar";
import VisitListPage from "./pages/Visit/List";
import VisitAddPage from "./pages/Visit/Add";
import ToolsPage from "./pages/Tools";
import AIToolsPage from "./pages/Tools/AITools";
import AIAnalysisPage from "./pages/Tools/AIAnalysis";
import ExportPage from "./pages/Tools/Export";
import FillInTheBlankPage from "./pages/Tools/FillInTheBlank";
import SettingsPage from "./pages/Settings";
import AccountPage from "./pages/Settings/Account";
import MemoPage from "./pages/Memo";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
          <Route index element={<HomePage />} />

          {/* 姫 */}
          <Route path="hime">
            <Route index element={<HimeListPage />} />
            <Route path="add" element={<HimeAddPage />} />
            <Route path="analysis" element={<HimeAnalysisPage />} />
            <Route path=":id" element={<HimeDetailPage />} />
          </Route>

          {/* キャスト */}
          <Route path="cast">
            <Route index element={<CastListPage />} />
            <Route path="add" element={<CastAddPage />} />
            <Route path=":id" element={<CastDetailPage />} />
          </Route>

          {/* 卓記録 */}
          <Route path="table">
            <Route index element={<TableListPage />} />
            <Route path="add" element={<TableAddPage />} />
            <Route path=":id" element={<TableDetailPage />} />
          </Route>

          {/* カレンダー */}
          <Route path="calendar" element={<CalendarPage />} />

          {/* 来店履歴 */}
          <Route path="visit">
            <Route index element={<VisitListPage />} />
            <Route path="add" element={<VisitAddPage />} />
          </Route>

          {/* 分析 */}
          <Route path="analysis" element={<AnalysisPage />} />

          {/* メモ */}
          <Route path="memo" element={<MemoPage />} />

          {/* ツール */}
          <Route path="tools">
            <Route index element={<ToolsPage />} />
            <Route path="ai-tools" element={<AIToolsPage />} />
            <Route path="ai-analysis" element={<AIAnalysisPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="fill-in-the-blank" element={<FillInTheBlankPage />} />
          </Route>

          {/* 設定 */}
          <Route path="settings">
            <Route index element={<SettingsPage />} />
            <Route path="account" element={<AccountPage />} />
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
