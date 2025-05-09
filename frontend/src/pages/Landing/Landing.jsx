// Landing
//Entry page with login button
//Login with email and password
//Authentication functionality needed

// UserCreation
//Create new user(cashier registers them)
//input boxes and submit button to enter customer details
//utorid, name, email
//returns a reset token that user can use to reset password?

import {Visibility, VisibilityOff} from '@mui/icons-material';
import Typography from '@mui/joy/Typography';
import landing_splash from "../../assets/landing_splash.jpg";
import logo from "../../assets/logo.png";
import "./Landing.css";
import "../../components/Navbar/Navbar.css"
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Paper, Box, Button, TextField, Dialog, DialogActions, TextareaAutosize, AppBar, Toolbar,
        FormControl, IconButton, InputLabel, Input, InputAdornment, FormHelperText, Container,
        DialogContent, DialogContentText, DialogTitle, Tooltip, Avatar, Stack} from '@mui/material';
import {fetchServer, validatePassword} from "../../utils/utils";
import { useUserContext } from '../../contexts/UserContext';


function DialogGeneric({title, children, submitTitle, name, currDialog,
                        currError, setCurrError, closeDialog, submitFunc, width}) {
    return <Dialog open={currDialog == name} onClose={closeDialog}
                    slotProps={{paper: {component: 'form',
                                        style: {width: width ? `${width}px` : '400px'},
                                        onSubmit: (event) => {
                                            event.preventDefault();
                                            const formData = new FormData(event.currentTarget);
                                            const formJson = Object.fromEntries(formData.entries());
                                            submitFunc(formJson).then(x => {
                                                if (x)
                                                    setCurrError(x);
                                            });
                                        }}}}>
        <Box sx={{display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '-5px'}}>
            <img src={logo} alt='CSSU Logo' id='logo'/>
        </Box>
        <DialogTitle sx={{fontWeight: 'bold', fontSize: '32px', textAlign: 'center', marginBottom: '-10px'}}>
            {title}
        </DialogTitle>
        
        <DialogContent>
            {currError && 
            <Box sx={{backgroundColor: '#ffe4e1', borderRadius: '4px', padding: '10px', marginTop: '10px', marginBottom: '10px'}}>
                <DialogContentText sx={{color: 'red'}}>{currError}</DialogContentText>                   
            </Box>}
            {children}
        </DialogContent>

        <DialogActions>
            <Button sx={{width: 'calc(100% - 30px)', margin: 'auto', marginBottom: '15px', textTransform: 'none'}}
                    type="submit" variant='contained'>{submitTitle}</Button>
        </DialogActions>
    </Dialog>;
}

function Copyable({children}) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(children);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };
    return <Paper className="copy-box" sx={{margin: '10px 0px'}}>
        <TextareaAutosize className='copyable' readOnly aria-label='minimum-height' minRows={5} value={children} />
        <Tooltip title="Copy to clipboard">
            <Button onClick={handleCopy} sx={{minWidth: '30px'}}>
                <ContentCopyIcon sx={{height: '20px', color: '#216C17'}}/>
            </Button>
        </Tooltip>
    </Paper>
}

function InputPassword({id, name, label, errorChecking}) {
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);
    const error = errorChecking ? validatePassword(password) : false;
    const toggleVisible = () => setVisible(!visible);

    return <FormControl variant="standard" fullWidth sx={{margin: '10px 0px'}}>
        <InputLabel htmlFor={id} autoFocus required error={error}>{label}</InputLabel>
        <Input id={id} name={name} label={label} autoFocus required margin="dense"
                error={error}
                onChange={(event) => setPassword(event.target.value)}
                type={visible ? 'text' : 'password'}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton aria-label={visible ? 'hide the password' : 'display the password'}
                                    onClick={toggleVisible}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseUp={(event) => event.preventDefault()}>
                            {visible ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>}/>
        {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
}
    

function DialogLanding({currDialog, setCurrDialog, currError, setCurrError,
                        attempted, setAttempted, changeDialog, closeDialog}) {
    const {setUserDetails, setTokenDetails, setViewAs} = useUserContext();
    const [token, setToken] = useState({});

    const resetPasswordRequest = async (json) => {
        const [response, e1] = await fetchServer('auth/resets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        });
        if (e1) return e1;
        const responseJson = await response.json();
        responseJson['expiresAt'] = (new Date(responseJson['expiresAt'])).toLocaleTimeString();
        setToken(responseJson);
        changeDialog('confirmationCode');
    }
    const resetPassword = async (json) => { 
        const {token, ...j} = json;
        const e1 = validatePassword(json['password']);
        if (e1)
            return;
        const [_response, e2] = await fetchServer(`auth/resets/${token}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(j)
        });
        if (e2) return e2;
        return await logIn(j);
    };
    const navigate = useNavigate();
    const logIn = async (json) => {
        // Validate password
        const e1 = validatePassword(json['password']);
        if (e1)
            return setAttempted(true);
        
        // Authenticate and store token
        const [response, e2] = await fetchServer(`auth/tokens`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        });
        if (e2) return e2;
        let responseJson = await response.json();
        setTokenDetails(responseJson.token);

        // Fetch user information
        const [userInfo, e3] = await fetchServer('users/me', {
            method: 'GET',
            headers: {'Authorization': `Bearer ${responseJson.token}`},
        });
        if (e3) return e3;
        responseJson = await userInfo.json();
        setUserDetails(responseJson);
        setViewAs(responseJson.role);
        navigate('dashboard');
    }

    return <>
        <DialogGeneric
            title='Sign in to CSSU'
            children={<>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="text"/>
                <InputPassword id='password' name='password' label='Password' errorChecking={attempted}/>
                <Typography variant="body2" color="primary" onClick={() => changeDialog('resetPasswordRequest')} 
                            sx={{cursor: 'pointer', textAlign: 'right'}}>
                    Forgot password?
                </Typography>
            </>}
            name="signIn"
            submitTitle='Sign In'
            currDialog={currDialog} currError={currError} setCurrError={setCurrError} closeDialog={closeDialog}
            submitFunc={logIn}
        />

        <DialogGeneric
            title='Reset your Password'
            children={<>
                <Typography variant='body2'>
                    Enter your UTORid. We'll send a confirmation code that you can use to reset your password.
                </Typography>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="utorid"/>
            </>}
            name='resetPasswordRequest'
            submitTitle='Submit'
            currDialog={currDialog} currError={currError} setCurrError={setCurrError} closeDialog={closeDialog}
            submitFunc={resetPasswordRequest}
        />

        <DialogGeneric
            title='Confirmation Code'
            children={<>
                <Typography variant='body2'>
                    Here is your confirmation code:
                </Typography>
                <Copyable>{token['resetToken']}</Copyable>
                <Typography variant='body2'>
                    It will expire in 1 hour at {token['expiresAt']}. Enter it to reset your password.
                </Typography>
            </>}
            name='confirmationCode'
            submitTitle='Reset Password'
            currDialog={currDialog} currError={currError} setCurrError={setCurrError} closeDialog={closeDialog}
            submitFunc={async () => changeDialog('resetPassword')}
        />

        <DialogGeneric
            title='Sign In with New Password'
            width={500}
            children={<>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="token" name="token" label="Confirmation Code" type="text"/>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="text"/>
                <InputPassword id='password' name='password' label='New Password' errorChecking/>
            </>}
            name='resetPassword'
            submitTitle='Sign In'
            currDialog={currDialog} currError={currError} setCurrError={setCurrError} closeDialog={closeDialog}
            submitFunc={resetPassword}
        />
    </>
}


export default function Landing() {
    const [currDialog, setCurrDialog] = useState(null);
    const [currError, setCurrError] = useState(undefined);
    const [attempted, setAttempted] = useState(false);  // Show password error checking after 1st sign-in attempt
    const closeDialog = () => {
        setCurrDialog(null);
        setCurrError(undefined);
        setAttempted(false);
    }
    const changeDialog = (name) => {
        setCurrDialog(name);
        setCurrError(undefined);
        setAttempted(false);
    }   

    return <>
        <AppBar position="static" sx={{ bgcolor: "black" }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{justifyContent: 'space-between'}}>
                    <Stack direction='row' sx={{alignItems: 'center'}}>
                        <Avatar sx={{ mr: 1 }} alt="Avatar" src={logo} />
                        <Typography variant="h5" noWrap className='cssu-text'>
                            CSSU
                        </Typography>
                    </Stack>
                    <Button className='nav-button' onClick={() => changeDialog('signIn')}
                            sx={{ my: 1, color: 'white', display: 'block', fontSize: '20px', textTransform: 'none'}}>
                        Sign In
                    </Button>
                </Toolbar>
            </Container>
        </AppBar>
        <main id='main-landing'>
            <div id='block-text'>
                <Typography level="h1" sx={{fontWeight: 'normal'}} >
                    Do you love <b>money</b>?<br />
                    We love <b>money</b> too.<br />
                    Get stuff from CSSU.<br />
                    Get points.<br />
                    Get <b>money</b>.
                </Typography>
            </div>
            <div id='block-img'>
                <img src={landing_splash} alt='Splash image' id='splash' />
            </div>
        </main>
        <DialogLanding currDialog={currDialog} setCurrDialog={setCurrDialog}
                        currError={currError} setCurrError={setCurrError}
                        attempted={attempted} setAttempted={setAttempted}
                        changeDialog={changeDialog} closeDialog={closeDialog}/>
        <footer>
            <Typography level="body-md" sx={{color: 'white'}}>
                &copy;CSC309, Winter 2025, Bahen Center for Information Technology.
            </Typography>
        </footer>
    </>
}