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
import landing_splash from "./landing_splash.jpg";
import "./Landing.css";
import {useState} from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function DialogGeneric({title, children, submitTitle, isOpen, setOpen, submitFunc}) {
    const [error, setError] = useState('');
    const closeDialog = () => {
        setOpen(false);
        setError('');
    };
    return <Dialog open={isOpen} onClose={closeDialog}
                    slotProps={{paper: {component: 'form',
                                        style: {width: '400px'},
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

function DialogLanding() {
    const [openSignIn, setOpenSignIn] = useState(false);
    const [openForgetPassword, setOpenForgetPassword] = useState(false);
    const [openCode, setOpenCode] = useState(false);
    const [token, setToken] = useState({});

    const forgetPassword = () => {
        setOpenSignIn(false);
        setOpenForgetPassword(true);
        setOpenCode(false);
    };
    const resetSignIn = () => {
        setOpenSignIn(true);
        setOpenForgetPassword(false);
        setOpenCode(false);
    }
    const resetPasswordRequest = async (json) => {
        const response = await fetch(`${BACKEND_URL}/auth/resets`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        });
        const responseJson = await response.json();
        if (!response.ok) {
            if (response.status == 404)
                return 'The given UTORid is not in our database.';
            return `Error: ${responseJson['error']}`;
        }
        responseJson['expiresAt'] = (new Date(responseJson['expiresAt'])).toLocaleTimeString();
        setToken(responseJson);

        setOpenSignIn(false);
        setOpenForgetPassword(false);
        setOpenCode(true);
        return '';
    }
    const logIn = async (json) => {
        console.log(json);
        // TODO
        // If token is being entered (need new endpoint to check), make password change request stuff
        // Else, treat it like a login
    }

    return <>
        <Button variant="outlined" onClick={resetSignIn}>
            Sign In
        </Button>

        <DialogGeneric
            title='Sign in to CSSU'
            children={<>
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="utorid" name="utorid" label="UTORid" type="text"/>
                {/* TODO: have an eye button that can toggle password visibility */}
                <TextField autoFocus required fullWidth margin="dense" variant="standard"
                            id="password" name="password" label="Password / Confirmation Code" type="password"/>
                <Typography variant="body2" color="primary" onClick={forgetPassword} 
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
                {/* TODO: put in a box with a copy to clipboard button */}
                {token['resetToken']}
                <Typography variant='body2'>
                    It will expire in 1 hour at {token['expiresAt']}. Enter it to reset your password.
                </Typography>
            </>}
            submitTitle='Back to Sign In'
            isOpen={openCode}
            setOpen={setOpenCode}
            submitFunc={async (json) => resetSignIn()}
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