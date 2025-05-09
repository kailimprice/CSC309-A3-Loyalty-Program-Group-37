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
    // following t10 for reference here
    return (
        <>
            <header>
                <Navbar role={role} />
            </header>
            <main>
                <Box component='section'>
                    <Sidebar role={role} />
                    <Box id='main-content'>
                        <Outlet />
                    </Box>
                </Box>
            </main>
            <Footer />
        </>
    )

}

export default Layout;