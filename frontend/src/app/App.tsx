/**
 * CSS
 */
import './App.css'
import Layout from "@/shared/presentation/Layout.tsx";
import "@/shared/presentation/spinner.css";
/**
 * REACT SPECIFIK
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
/**
 * TSX
 */
import { AdminRoute } from "@/modules/auth/presentation/Middleware.tsx";
import { IndexPage }  from "@/modules/property/presentation/IndexPage.tsx";
import { ShowPage }   from "@/modules/property/presentation/ShowPage.tsx";

const AuthPage = lazy(() => import("@/modules/auth/presentation/Form.tsx").then((module) => ({ default: module.AuthPage })));
const CreatePage = lazy(() => import("@/modules/property/presentation/CreatePage.tsx").then((module) => ({ default: module.CreatePage })));
const EditPage = lazy(() => import("@/modules/property/presentation/EditPage.tsx").then((module) => ({ default: module.EditPage })));

const clientQuery = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={clientQuery}>
        <Layout>
          <Suspense fallback={<div className="spinner" />}>
            <Routes>
              {/* ADMIN ROUTES */}
              <Route path='/dashboard/property/create' element={<AdminRoute><CreatePage/></AdminRoute>}/>
              <Route path='/dashboard/property/edit/:id' element={<AdminRoute><EditPage/></AdminRoute>}/>  

              {/* GUEST ROUTES */}
              <Route path="/" element={<IndexPage/>}/>
              <Route path="/property/:propertyId" element={<ShowPage/>}/>
              <Route path="/login" element={<AuthPage/>}/>
            </Routes>
          </Suspense>
        </Layout>
      </QueryClientProvider>
    </>
  )
}

export default App
