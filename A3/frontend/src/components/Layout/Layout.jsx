import { Link, Outlet } from "react-router-dom";

const Layout = () => {
    return <>
        <Navbar />
        <main>
            <Outlet />
        </main>
        <footer>
            &copy;CSC309, Winter 2025, Bahen Center for Information Technology.
        </footer>
    </>
}

export default Layout;