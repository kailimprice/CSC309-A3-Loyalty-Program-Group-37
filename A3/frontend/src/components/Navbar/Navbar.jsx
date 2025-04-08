import  { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Link } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';
import logo from "../../assets/logo.png";

const pages = ['Dashboard', 'Transactions', 'Events', 'Promotions', 'Users'];
const settings = ['QR', 'Profile', 'Logout'];

// inspired by https://mui.com/material-ui/react-app-bar/?srsltid=AfmBOooWDrbMd6d-96DUha-sfChITDwLyi6DOf277qa1ipbjZ_KmvPP9#app-bar-with-responsive-menu
const Navbar = (role) => {
    
    // retrieve user from context
    const { user } = useUserContext();
    
    // TODO: dynamically adjust navbar according to role
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return <>
        <AppBar position="static" sx={{ bgcolor: "black" }}>
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            <Avatar sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} alt="Avatar" src={logo} />
            <Typography
                variant="h6"
                noWrap
                component={Link}
                to="/"
                sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                }}
            >
                CSSU
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
                >
                <MenuIcon />
                </IconButton>
                {/* this first menu box only appears if the screen is small */}
                <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: 'block', md: 'none' } }}
                >
                {/* display each clickable nav page  */}
                {pages.map((page) => (
                    <MenuItem key={page} onClick={handleCloseNavMenu}>
                    <Typography sx={{ textAlign: 'center' }}>{page}</Typography>
                    </MenuItem>
                ))}
                </Menu>
            </Box>
            {/* this next section is for regular displays */}
            <Typography
                variant="h5"
                noWrap
                component={Link}
                to="/"
                sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                }}
            >
                CSSU
            </Typography>
            {/* display each clickable nav page  */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                {pages.map((page) => (
                <Button
                    to={`/${page.toLowerCase()}`}
                    component={Link}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                >
                    {page}
                </Button>
                ))}
            </Box>
            <Box sx={{ flexDirection: 'column', align: 'right'}}>
            <Typography 
                variant='subtitle1' 
                noWrap
                align='right' 
                sx={{
                    mr: 2,
                    fontFamily: 'monospace',
                    }} >
                    Welcome,
                </Typography>
                <Typography
                    variant="h5"
                    noWrap
                    align='right' 
                    sx={{
                        mr: 2,
                        fontFamily: 'monospace',
                        fontWeight: 700
                    }}
                >
                    {/* if user's name isnt provided then use the utorid (required) */}
                    {user.name || user.utorid}
                </Typography>
            </Box>
            {/* profile picture settings */}
            <Box sx={{  flexGrow: 0 }}>
                <Tooltip title="SETTINGS">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt="User" src={user.avatarUrl} />
                </IconButton>
                </Tooltip>
                <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                >
                    {/* TODO: display each setting page */}
                {settings.map((setting) => (
                    <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                    </MenuItem>
                ))}
                </Menu>
            </Box>
            </Toolbar>
        </Container>
        </AppBar>
        </>
}

export default Navbar;