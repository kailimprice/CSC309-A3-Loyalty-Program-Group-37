import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {CssBaseline} from '@mui/material';

import Layout from './components/Layout/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import UserDashboard from './pages/UserPages/UserDashboard';
import Transactions from './pages/UserPages/Transactions';
import Events from './pages/UserPages/Events';
import Promotions from './pages/UserPages/Promotions';
import CashierDashboard from './pages/CashierPages/CashierDashboard';
import RedemptionProcessing from './pages/CashierPages/RedemptionProcessing';
import TransactionCreation from './pages/CashierPages/TransactionCreation';
import UserCreation from './pages/CashierPages/UserCreation';
import ManagerDashboard from './pages/ManagerPages/ManagerDashboard';
import AllEvents from './pages/ManagerPages/AllEvents';
import AllTransactions from './pages/ManagerPages/AllTransactions';
import AllPromotions from './pages/ManagerPages/AllPromotions';
import AllUsers from './pages/ManagerPages/AllUsers';
import SuperuserDashboard from './pages/SuperuserPages/SuperuserDashboard'
import Admin from './pages/SuperuserPages/Admin';
import OrganizerDashboard from './pages/OrganizerPages/OrganizerDashboard';
import EventManagement from './pages/OrganizerPages/EventManagement';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import './App.css'

//Layout wrapper with navbar & footer over everything
//Default route landing page -> login -> role dashboards -> routes organized by role

function App() {

  return (
    <BrowserRouter>
      <CssBaseline />
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path='/login' element={<Login />} />

          <Route path='/user' element={<UserDashboard />}>
            <Route path='/events' element={<Events />} />
            <Route path='/promotions' element={<Promotions />} />
            <Route path='/transactions' element={<Transactions />} />
          </Route>

          <Route path='/cashier' element={<CashierDashboard />}>
            <Route path='/transaction-creation' element={<TransactionCreation />} />
            <Route path='/redemption-processing' element={<RedemptionProcessing />} />
            <Route path='/user-creation' element={<UserCreation />} />
          </Route>

          <Route path='/manager' element={<ManagerDashboard />}>
            <Route path='/all-events' element={<AllEvents />} />
            <Route path='/all-promotions' element={<AllPromotions />} />
            <Route path='/all-transactions' element={<AllTransactions />} />
            <Route path='/all-users' element={<AllUsers />} />
          </Route>

          <Route path='/superuser' element={<SuperuserDashboard />}>
            <Route path='/admin' element={<Admin />} />
          </Route>

          <Route path='/organizer' element={<OrganizerDashboard />}>
            <Route path='/event-management' element={<EventManagement />} />
          </Route>

          <Route path='/profile' element={<Profile />} />
          <Route path='*' element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
