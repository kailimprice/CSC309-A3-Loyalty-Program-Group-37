import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Transaction from './pages/Transactions/Transaction.jsx'
import Transactions from './pages/Transactions/Transactions.jsx'
import Event from './pages/Events/Event.jsx'
import Events from './pages/Events/Events.jsx'
import Promotion from './pages/Promotions/Promotion.jsx'
import Promotions from './pages/Promotions/Promotions.jsx'
import User from './pages/Users/User.jsx'
import Users from './pages/Users/Users.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Landing from './pages/Landing/Landing.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import Layout from './components/Layout/Layout.jsx'
import { UserProvider } from './contexts/UserContext.jsx';

import {CssBaseline} from '@mui/material';
import './App.css'

//Layout wrapper with navbar & footer over everything
//Default route landing page -> login -> role dashboards -> routes organized by role

const routes = [
    ['dashboard', <Dashboard/>],
    ['transactions', <Transactions/>],
    ['transactions/:id', <Transaction/>],
    ['events', <Events/>],
    ['events/:id', <Event/>],
    ['promotions', <Promotions/>],
    ['promotions/:id', <Promotion/>],
    ['users', <Users/>],
    ['users/:id', <User/>],
]

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <CssBaseline />
        <Routes>
          <Route index element={<Landing />} />
          <Route path='/' element={<Layout />}>
            {routes.map(([path, component]) => {
              return <>
                <Route key={path} path={path} element={component}/>
                {/* TODO probably remove :role, replace it with a state that is passed down */}
                {/* <Route key={`${path}/:role`} path={`${path}/:role`} element={component}/> */}
              </>
            })}
            <Route path='*' element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App