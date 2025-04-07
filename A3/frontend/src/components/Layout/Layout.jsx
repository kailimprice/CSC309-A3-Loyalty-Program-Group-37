//navbar and footer

import { Box } from '@mui/material';
import { Link, Outlet, useParams } from "react-router-dom";
import Typography from '@mui/joy/Typography';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar'
import Footer from '../Footer/Footer'
import "./Layout.css"

const Layout = () => {
    const role = 'regular';
    //const { role } = useParams(); or however else
    //add navbar to navbar file
    return (
        
        <Box display='flex' flexDirection='column' height='100vh'>
            <Navbar role={role} />
            <Box display='flex' flexGrow={1}>
                <Sidebar role={role} />
                <Box component='main' flexGrow={1} padding = '16px'>
                    <Outlet />
                </Box>
            </Box>
            <Footer />
        </Box>
    )

}

export default Layout;