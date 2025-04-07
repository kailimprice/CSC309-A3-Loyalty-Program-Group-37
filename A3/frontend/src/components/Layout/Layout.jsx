//navbar and footer

import { Box } from '@mui/material';
import { Link, Outlet, useParams } from "react-router-dom";
import Typography from '@mui/joy/Typography';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar'
import Footer from '../Footer/Footer'
import "./Layout.css"

const Layout = () => {
    const { role } = useParams();
    //add navbar
    return (
        
        <Box display='flex' flexDirection='column' height='100vh'>
            <Navbar />
            <Box display='flex' flexGrow={1}>
                <Sidebar />
                <Box component='main' flexGrow={1} padding = '16px'>
                    <Outlet />
                </Box>
            </Box>
            <Footer />
        </Box>
    )

}

export default Layout;