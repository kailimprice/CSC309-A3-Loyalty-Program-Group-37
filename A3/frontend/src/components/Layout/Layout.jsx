//navbar and footer

import { Link, Outlet } from "react-router-dom";
import Typography from '@mui/joy/Typography';
import "./Layout.css"

const Layout = () => {
    //add navbar in header
    return <>
        <header>
            
        </header>
        <main>
            <Outlet />
        </main>
        <footer>
            <Typography level="body-md" sx={{color: 'white'}}>
                &copy;CSC309, Winter 2025, Bahen Center for Information Technology.
            </Typography>
        </footer>
    </>
}

export default Layout;