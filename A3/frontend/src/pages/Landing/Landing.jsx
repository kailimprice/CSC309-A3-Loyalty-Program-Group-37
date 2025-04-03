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

export default function Landing() {
    return <section>
        <div id='block-text'>
            <Typography level="h1" sx={{fontSize: '48px', fontWeight: 'normal'}} >
                Do you love <b>Money</b>?<br />
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
}