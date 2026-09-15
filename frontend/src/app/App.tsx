/**
 * CSS
 */
import './App.css'
import Layout from "@/shared/presentation/Layout.tsx";
import { LoadingSpinner } from "@/shared/presentation/LoadingSpinner.tsx";
/**
 * REACT SPECIFIK
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
/**
 * TSX
 */
import { AdminRoute } from "@/modules/auth/presentation/Middleware.tsx";
import { IndexPage }  from "@/modules/property/presentation/IndexPage.tsx";
import { ShowPage }   from "@/modules/property/presentation/ShowPage.tsx";
import { AboutPage } from "@/modules/about/presentation/AboutPage.tsx";

const AuthPage = lazy(() => import("@/modules/auth/presentation/Form.tsx").then((module) => ({ default: module.AuthPage })));
const CreatePage = lazy(() => import("@/modules/property/presentation/CreatePage.tsx").then((module) => ({ default: module.CreatePage })));
const EditPage = lazy(() => import("@/modules/property/presentation/EditPage.tsx").then((module) => ({ default: module.EditPage })));

const AdminLayout = lazy(() => import("@/modules/admin/presentation/AdminLayout").then(module => ({ default: module.AdminLayout })));
const OverviewPage = lazy(() => import("@/modules/admin/presentation/OverviewPage").then(module => ({ default: module.OverviewPage })));
const PropertiesPage = lazy(() => import("@/modules/admin/presentation/PropertiesPage").then(module => ({ default: module.PropertiesPage })));

function LegacyEditRedirect() {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={id ? `/admin/properties/${id}/edit` : "/admin/properties"} replace />;
}

const clientQuery = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={clientQuery}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<OverviewPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="properties/create" element={<CreatePage />} />
                <Route path="properties/:propertyId/edit" element={<EditPage />} />
              </Route>
              <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/dashboard/property/create" element={<Navigate to="/admin/properties/create" replace />} />
              <Route path="/dashboard/property/edit/:id" element={<LegacyEditRedirect />} />
              <Route element={<Layout><Outlet /></Layout>}>
              <Route path="/" element={<IndexPage/>}/>
              <Route path="/om-oss" element={<AboutPage/>}/>
              <Route path="/property/:propertyId" element={<ShowPage/>}/>
              <Route path="/login" element={<AuthPage/>}/>
              </Route>
            </Routes>
          </Suspense>
      </QueryClientProvider>
    </>
  )
}

export default App
