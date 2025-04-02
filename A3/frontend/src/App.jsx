import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {CssBaseline} from '@mui/material';

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <CssBaseline />
      <Navbar />
      <Routes>
        <Route path='/' element={<Layout />} />
          <Route index element={<Landing />} />
          <Route path='/login' element={<Login />} />

          <Route path='/user' element={<UserDashboard />}>
            <Route path='events' element={<Events />} />
            <Route path='promotions' element={<Promotions />} />
            <Route path='transactions' element={<Transactions />} />
          </Route>

          <Route path='/cashier' element={<CashierDashboard />}>
            <Route path='transaction-creation' element={<TransactionCreation />} />
            <Route path='redemption-processing' element={<RedemptionProcessing />} />
            <Route path='user-creation' element={<UserCreation />} />
          </Route>

          <Route path='/manager' element={<ManagerDashboard />}>
            <Route path='all-events' element={<AllEvents />} />
            <Route path='all-promotions' element={<AllPromotions />} />
            <Route path='all-transactions' element={<AllTransactions />} />
          </Route>

          <Route path='/superuser' element={<SuperuserDashboard />}>
            <Route path='admin' element={<Admin />} />
          </Route>

          <Route path='/organizer' element={<OrganizerDashboard />}>
            <Route path='event-management' element={<EventManagement />} />
          </Route>

          <Route path='profile' element={<Profile />} />
          <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
