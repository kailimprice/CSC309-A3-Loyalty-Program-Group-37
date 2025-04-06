// Landing
//Entry page with login button
//Login with email and password
//Authentication functionality needed

// UserCreation
//Create new user(cashier registers them)
//input boxes and submit button to enter customer details
//utorid, name, email
//returns a reset token that user can use to reset password?

import Typography from '@mui/joy/Typography';
import landing_splash from "../../assets/landing_splash.jpg";
import "./Landing.css";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {Paper, Box, Button, TextField, Dialog, DialogActions, TextareaAutosize,
        FormControl, IconButton, InputLabel, Input, InputAdornment,
        DialogContent, DialogContentText, DialogTitle, Tooltip} from '@mui/material'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function DialogGeneric({title, children, submitTitle, isOpen, setOpen, submitFunc, width}) {
    const [error, setError] = useState('');
    const closeDialog = () => {
        setOpen(false);
        setError('');
    };
    return <Dialog open={isOpen} onClose={closeDialog}
                    slotProps={{paper: {component: 'form',
                                        style: {width: width ? `${width}px` : '400px'},
                                        onSubmit: (event) => {
                                            event.preventDefault();
                                            const formData = new FormData(event.currentTarget);
                                            const formJson = Object.fromEntries(formData.entries());
                                            submitFunc(formJson).then(x => {
                                                if (x)
                                                    setError(x);
                                                else
                                                    closeDialog();
                                            });
                                        }}}}>
        <DialogTitle sx={{fontWeight: 'bold', fontSize: '32px', textAlign: 'center', marginBottom: '-10px'}}>
            {title}
        </DialogTitle>
        
        <DialogContent>
            {error && 
            <Box sx={{backgroundColor: '#ffe4e1', borderRadius: '4px', padding: '10px', marginTop: '10px', marginBottom: '10px'}}>
                <DialogContentText sx={{color: 'red'}}>{error}</DialogContentText>                   
            </Box>}
            {children}
        </DialogContent>

        <DialogActions>
            <Button sx={{width: 'calc(100% - 30px)', margin: 'auto', marginBottom: '15px'}}
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
        <TextareaAutosize readOnly aria-label='minimum-height' minRows={5} value={children} />
        <Tooltip title="Copy to clipboard">
            <Button onClick={handleCopy} sx={{minWidth: '30px'}}>
                <ContentCopyIcon sx={{height: '20px', color: '#216C17'}}/>
            </Button>
        </Tooltip>
    </Paper>
}

async function fetchServer(path, details, errors) {
    const response = await fetch(`${BACKEND_URL}/${path}`, details);
    if (!response.ok) {
        for (let error in errors) {
            if (response.status == error)
                return [null, errors[error]];
        }
        const responseJson = await response.json();
        return [null, `Error ${response.status}: ${responseJson['error']}`];
    }
    return [response, false];
}

function InputPassword({id, name, label}) {
    const [visible, setVisible] = useState(false);
    const toggleVisible = () => setVisible(!visible);
    return <FormControl variant="standard" fullWidth sx={{margin: '10px 0px'}}>
        <InputLabel htmlFor={id} autoFocus required>{label}</InputLabel>
        <Input id={id} name={name} label={label} autoFocus required margin="dense"
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
    </FormControl>
    
    // <TextField autoFocus required fullWidth margin="dense" variant="standard"
    // id="password" name="password" label="Password" type="password"/>
    // return <TextField autoFocus required fullWidth margin="dense" variant="standard"
    //                 id={id} name={name} label={label} type="password"/>
}

function DialogLanding() {
    const [openSignIn, setOpenSignIn] = useState(false);
    const [openForgetPassword, setOpenForgetPassword] = useState(false);
    const [openCode, setOpenCode] = useState(false);
    const [openResetPassword, setOpenResetPassword] = useState(false);
    const [token, setToken] = useState({});

    // TODO errors must be cleared when switching pop-ups

    const toggleForgetPassword = () => {
        setOpenSignIn(false);
        setOpenForgetPassword(true);
        setOpenCode(false);
        setOpenResetPassword(false);
    };
    const toggleLogIn = () => {
        setOpenSignIn(true);
        setOpenForgetPassword(false);
        setOpenCode(false);
        setOpenResetPassword(false);
    }
    const toggleResetPassword = async () => {
        setOpenSignIn(false);
        setOpenForgetPassword(false);
        setOpenCode(false);
        setOpenResetPassword(true);
    }
    const resetPasswordRequest = async (json) => {
        const [response, e1] = await fetchServer('auth/resets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        }, {404: 'The given UTORid is not in our database.'});
        if (e1) return e1;
        const responseJson = await response.json();
        responseJson['expiresAt'] = (new Date(responseJson['expiresAt'])).toLocaleTimeString();
        setToken(responseJson);

        setOpenSignIn(false);
        setOpenForgetPassword(false);
        setOpenCode(true);
    }
    const resetPassword = async (json) => {
        // TODO client-side password requirement checking 
        const {token, ...j} = json;
        const [_response, e1] = await fetchServer(`auth/resets/${token}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(j)
        }, {404: 'Invalid confirmation code.',
            410: 'The confirmation code has expired.'});
        if (e1) return e1;
        return await logIn(j);
    };
    const navigate = useNavigate();
    const logIn = async (json) => {
        const [response, e1] = await fetchServer(`auth/tokens`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        }, {404: 'Invalid username/password combination.'});
        if (e1) return e1;
        const responseJson = await response.json();
        localStorage.setItem('token', responseJson.token);
        navigate('dashboard');
    }

    return <>
        <Button variant="outlined" onClick={toggleLogIn}>
            Sign In
        </Button>

        <DialogGeneric
            title='Sign in to CSSU'
            children={<>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="text"/>
                <InputPassword id='password' name='password' label='Password'/>
                <Typography variant="body2" color="primary" onClick={toggleForgetPassword} 
                            sx={{cursor: 'pointer', textAlign: 'right'}}>
                    Forgot password?
                </Typography>
            </>}
            submitTitle='Sign In'
            isOpen={openSignIn}
            setOpen={setOpenSignIn}
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
            submitTitle='Submit'
            isOpen={openForgetPassword}
            setOpen={setOpenForgetPassword}
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
            submitTitle='Reset Password'
            isOpen={openCode}
            setOpen={setOpenCode}
            submitFunc={toggleResetPassword}
        />

        <DialogGeneric
            title='Sign In with New Password'
            width={500}
            children={<>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="token" name="token" label="Confirmation Code" type="text"/>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="text"/>
                <InputPassword id='password' name='password' label='New Password'/>
            </>}
            submitTitle='Sign In'
            isOpen={openResetPassword}
            setOpen={setOpenResetPassword}
            submitFunc={resetPassword}
        />
    </>
}


export default function Landing() {
    return <><section>
        <div id='block-text'>
            <Typography level="h1" sx={{fontSize: '56px', fontWeight: 'normal'}} >
                Do you love <b>money</b>?<br />
                We love <b>money</b> too.<br />
                Get stuff from CSSU.<br />
                Get points.<br />
                Get <b>money</b>.
            </Typography>
        </div>
        <div id='block-img'>
            <img src={landing_splash} alt='Splash image'/>
        </div>
    </section>
    <DialogLanding/></>
}