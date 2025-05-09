import  { useEffect, useState } from 'react';
import {AppBar, Box, Toolbar, IconButton, Typography, Menu, Container,
        Avatar, Button, Tooltip, MenuItem, Stack, Dialog} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import { useUserContext } from '../../contexts/UserContext';
import logo from "../../assets/logo.png";
import { fetchServer, hasPerms } from '../../utils/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";
import "./Navbar.css"

// inspired by https://mui.com/material-ui/react-app-bar/?srsltid=AfmBOooWDrbMd6d-96DUha-sfChITDwLyi6DOf277qa1ipbjZ_KmvPP9#app-bar-with-responsive-menu
const Navbar = () => {
    const { user, token, viewAs, setViewAs } = useUserContext();
    const pages = ['Dashboard', 'Transactions', 'Events', 'Promotions'];
    if (hasPerms(viewAs, 'manager'))
        pages.push('Users');

    const navigate = useNavigate();
    const location = useLocation().pathname;

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

    // QR code display
    const [qrOpen, setQrOpen] = useState(false);
    const closeQr = () => setQrOpen(false);
    const DialogQR = <Dialog open={qrOpen} onClose={closeQr} className='dialog-qr'>
        <Box sx={{padding: '45px'}}>
            <QRCode value={`id=${user.id}, utorid=${user.utorid}`} size='large' />
        </Box>
    </Dialog>;

    const [avatar, setAvatar] = useState(null);
    async function getImage(url) {
        let [result, error] = await fetchServer(`files?filepath=${url}`, {
            method: 'GET',
            headers: new Headers({'Authorization': `Bearer ${token}`})
        });
        if (error) {
            console.log(error);
            return;
        }
        const blob = await result.blob();
        setAvatar(URL.createObjectURL(blob));
    }
    useEffect(() => {
        if (user && user.avatarUrl)
            getImage(user.avatarUrl)
    }, [user]);

    // Stub appbar for NotFound
    if (!user)
        return <AppBar position="static" sx={{ bgcolor: "black" }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Stack direction='row' sx={{alignItems: 'center'}}>
                        <Avatar sx={{ mr: 1 }} alt="Avatar" src={avatar} />
                        <Typography variant="h5" component={Link} to="/" noWrap className='cssu-text'>
                            CSSU
                        </Typography>
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>;

    function handleQR(event) {
        setQrOpen(true);
        handleCloseUserMenu(event);
    }
    function handleProfile(event) {
        navigate(`/users/${user.id}`);
        handleCloseUserMenu(event);
    }
    function handleLogout(event) {
        navigate('/');
        localStorage.clear();
        setViewAs(null);
        handleCloseUserMenu(event);
    }
    const settings = [['QR Code', handleQR], ['Profile', handleProfile], ['Logout', handleLogout]];

    return <>
        {DialogQR}
        <AppBar position="static" sx={{ bgcolor: "black" }}>
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            <Avatar sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} alt="Avatar" src={logo} />
            <Typography variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        className='cssu-text'
                        sx={{mr: 2, display: { xs: 'none', md: 'flex' }}}
            >
                CSSU
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }}}>
                <IconButton size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                >
                    <MenuIcon />
                </IconButton>
                
                {/* this first menu box only appears if the screen is small */}
                <Menu id="menu-appbar"
                        anchorEl={anchorElNav}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                        keepMounted
                        transformOrigin={{vertical: 'top', horizontal: 'left'}}
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
            <Typography variant="h5"
                        noWrap
                        component={Link}
                        to="/"
                        className='cssu-text'
                        sx={{mr: 2, display: { xs: 'flex', md: 'none' }, flexGrow: 1}}
            >
                CSSU
            </Typography>

            {/* display each clickable nav page  */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                {pages.map((page) => (
                    <Button className='nav-button'
                            to={`/${page.toLowerCase()}`}
                            component={Link}
                            key={page}
                            sx={{ my: 1, color: 'white', display: 'block', fontSize: '20px', textTransform: 'none', fontWeight: location.startsWith(`/${page.toLowerCase()}`) ? 'bold' : 'normal'}}
                    >
                        {page}
                    </Button>
                ))}
            </Box>

            <Stack direction='column'>
                <Typography variant='subtitle1' 
                            noWrap
                            align='right' 
                            sx={{
                                mr: 2,
                                fontFamily: 'monospace',
                                lineHeight: 1,
                                fontSize: '13px'
                            }}
                >
                    Welcome,
                </Typography>
                <Typography variant="h5"
                            noWrap
                            align='right' 
                            sx={{
                                mr: 2,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                lineHeight: 1
                            }}
                >
                    {/* if user's name isnt provided then use the utorid (required) */}
                    {user.name || user.utorid}
                </Typography>
            </Stack>

            {/* profile picture settings */}
            <Box sx={{  flexGrow: 0 }}>
                <Tooltip title="User Settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt="User" src={avatar} />
                </IconButton>
                </Tooltip>
                <Menu sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right', }}
                    keepMounted
                    transformOrigin={{ vertical: 'top', horizontal: 'right', }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                >

                {settings.map((setting) => {
                    const [name, handler] = setting;
                    return <MenuItem key={setting}
                                    onClick={handler}>
                        <Typography sx={{ textAlign: 'center' }}>{name}</Typography>
                    </MenuItem>
                })}
                </Menu>
            </Box>
            </Toolbar>
        </Container>
        </AppBar>
        </>
}

export default Navbar;