/**
 * CSS
 */
import './App.css'
import Layout from "@/shared/components/Layout.tsx";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.tsx";
/**
 * REACT SPECIFIK
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Outlet, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
/**
 * TSX
 */
import { adminLoginPath } from "@/modules/auth/config/adminAccess";
import { AdminRoute } from "@/modules/auth/components/AdminRoute.tsx";
import { IndexPage }  from "@/modules/property/pages/IndexPage.tsx";
import { ShowPage }   from "@/modules/property/pages/ShowPage.tsx";
import { AboutPage } from "@/modules/about/pages/AboutPage.tsx";

const AuthPage = lazy(() => import("@/modules/auth/pages/AuthPage.tsx").then((module) => ({ default: module.AuthPage })));
const CreatePage = lazy(() => import("@/modules/property/pages/CreatePage.tsx").then((module) => ({ default: module.CreatePage })));
const EditPage = lazy(() => import("@/modules/property/pages/EditPage.tsx").then((module) => ({ default: module.EditPage })));

const AdminLayout = lazy(() => import("@/modules/admin/components/AdminLayout").then(module => ({ default: module.AdminLayout })));
const OverviewPage = lazy(() => import("@/modules/admin/pages/OverviewPage").then(module => ({ default: module.OverviewPage })));
const PropertiesPage = lazy(() => import("@/modules/admin/pages/PropertiesPage").then(module => ({ default: module.PropertiesPage })));

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
              <Route element={<Layout><Outlet /></Layout>}>
              <Route path="/" element={<IndexPage/>}/>
              <Route path="/om-oss" element={<AboutPage/>}/>
              <Route path="/property/:propertyId" element={<ShowPage/>}/>
              {adminLoginPath && <Route caseSensitive path={adminLoginPath} element={<AuthPage />} />}
              <Route path="*" element={
                <section className="auth-page">
                  <h1>Sidan hittades inte</h1>
                  <p>Adressen finns inte eller är inte tillgänglig.</p>
                  <Link to="/">Till startsidan</Link>
                </section>
              } />
              </Route>
            </Routes>
          </Suspense>
      </QueryClientProvider>
    </>
  )
}

export default App
