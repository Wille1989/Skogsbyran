/**
 * CSS
 */
import './App.css'
import Layout from "./shared/presentation/Layout.tsx";
/**
 * REACT SPECIFIK
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
/**
 * TSX
 */
import { AuthPage }   from './user/presentation/Form.tsx';
import { AdminRoute } from "./user/presentation/Middleware.tsx";
import { CreatePage } from "./property/presentation/CreatePage.tsx";
import { IndexPage }  from "./property/presentation/IndexPage.tsx";
import { EditPage }   from "./property/presentation/EditPage.tsx";
import { ShowPage }   from "./property/presentation/ShowPage.tsx";


const clientQuery = new QueryClient();

function App() {
  return (
    <>
      <Layout>
        <QueryClientProvider client={clientQuery}>
          <Routes>
            {/* ADMIN ROUTES */}
            <Route path='/dashboard/property/create' element={<AdminRoute><CreatePage/></AdminRoute>}/>
            <Route path='/dashboard/property/edit/:id' element={<AdminRoute><EditPage/></AdminRoute>}/>  

            {/* GUEST ROUTES */}
            <Route path="/" element={<IndexPage/>}/>
            <Route path="/property/:propertyId" element={<ShowPage/>}/>
            <Route path="/login" element={<AuthPage/>}/>
          </Routes>
        </QueryClientProvider>
      </Layout>
    </>
  )
}

export default App
