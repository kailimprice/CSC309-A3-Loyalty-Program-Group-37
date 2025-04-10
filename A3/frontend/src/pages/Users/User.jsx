// Profile:
//View/edit: name, email, birthday, avatar
//Functionality: ability to reset password

import { TextField, Button, Grid, NativeSelect, Checkbox, Alert, Typography, Stack } from '@mui/material';
import { useState, useEffect } from 'react'
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useUserContext } from '../../contexts/UserContext.jsx';
import { fetchServer, hasPerms } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { FormControl } from '@mui/joy';
import { SpecificHeader, TextInput, DateInput, FileInput, NumberInput, BooleanInput, ChoiceInput,
         ButtonInput, ButtonInputRow } from '../../components/Form/Form.jsx';

export default function User() {
    const { user, token, setUserDetails, viewAs } = useUserContext();
    const id = parseInt(useParams().id, 10);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [birthday, setBirthday] = useState(null); 
    const [avatarUrl, setAvatarUrl] = useState("");
    const [verified, setVerified] = useState(false);
    const [suspicious, setSuspicious] = useState(false);
    const [role, setRole] = useState("");
    // error tracking
    const [error, setError] = useState("");

    const ownProfile = user.id == id;
    const managerPerms = hasPerms(viewAs, 'manager');

    // get user details for given id
    useEffect(() => {
        // wrap in async to use await
        const getUserDetails = async () => {
            let userDetails;

            // fetch from users/:userId
            const [response, err] = await fetchServer(`users/${id}`, {
                method: "GET",
                headers: new Headers({
                Authorization: `Bearer ${token}`
                })
            })
            if (err) {
                setError("You do not have permission to view this user.");
                console.error("Error fetching user details:", err);
                return;
            }
            userDetails = await response.json();

            setName(userDetails.name || "");
            setEmail(userDetails.email || "");
            // need to use dayjs here for datepicker
            setBirthday(userDetails.birthday ? userDetails.birthday : null);
            setAvatarUrl(userDetails.avatarUrl || "");
            // defaulting these to false, i noticed suspicious doesnt have a default
            setVerified(userDetails.verified || false);
            setSuspicious(userDetails.suspicious || false);
            setRole(userDetails.role || "");

            console.log("User details:", userDetails);


            if (id === user.id) {
                // fetch from users/me
                const [response, err] = await fetchServer(`users/me`, {
                method: "GET",
                headers: new Headers({
                    Authorization: `Bearer ${token}`
                })
                })
                if (err) {
                setError("You do not have permission to view this user.");
                console.error("Error fetching user profile details:", err);
                return;
                }
                let profileDetails = await response.json();

                setName(profileDetails.name);
                setEmail(profileDetails.email);
                // need to use dayjs here for datepicker
                setBirthday(userDetails.birthday);

                console.log("Profile details:", userDetails);
            }

            setError("");
        };

        // call func
        getUserDetails();
    }, [id])

    const handleSubmit = async () => {

      if (id === user.id) {
          let updateDetails = {};
          if (name) updateDetails.name = name;
          if (email) updateDetails.email = email;
          // need to convert back to YYYY-MM-DD
          if (birthday) updateDetails.birthday = birthday.format("YYYY-MM-DD");
          if (avatarUrl) updateDetails.avatarUrl = avatarUrl;

          console.log("Updated details being sent:", updateDetails);
          // patch to users/me
          const [response, err] = await fetchServer(`users/me`, {
            method: "PATCH",
            headers: new Headers({
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
          })
          if (err) {
            setError(err);
            console.error("Error patching curent user details:", err);
            return;
          } 

          setUserDetails(updateDetails);
          setError(""); 
      }

      if (user.role === "manager" || user.role === "superuser") {
          let updateDetails = {};
          if (email) updateDetails.email = email;
          // cant checm if (...) since these are bools and react wants them defined
          // i think its okay to edit them anyways bc we always pull their curr val or default
          updateDetails.verified = verified;
          updateDetails.suspicious = suspicious;
          if (role) updateDetails.role = role;

          console.log("Updated details being sent:", updateDetails);
          // patch to users/:userId
          const [response, err] = await fetchServer(`users/${id}`, {
            method: "PATCH",
            headers: new Headers({
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
          })
          if (err) {
            setError(err);
            console.error("Error patching user details:", err);
            return;
          }

          if (id === user.id){
            setUserDetails(updateDetails);
          }

          setError(""); 
      }
    };

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // grid setup inspired by https://mui.com/material-ui/react-grid/
    return <>
        <SpecificHeader display='Users' baseUrl={managerPerms ? '/users' : null} id={ownProfile ? 'Me' : id} />
        <Grid container spacing={0} alignItems={'center'}>
            {/* display error message if one*/}
            {error && 
            <Grid size={12}>
                {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                <Alert severity="error">{error}</Alert>
            </Grid>}
            
            <NumberInput editable={false} field='ID' value={user.id} />
            <TextInput editable={false} field='UTORid' value={user.utorid} />
            <TextInput editable={ownProfile} field='Name' value={name} changeFunc={(e) => setName(e.target.value)} />
            <NumberInput editable={false} field='Points' value={user.points} />

            {(ownProfile || managerPerms) &&
            <>
                <FileInput editable={ownProfile} field='Profile Picture' value={avatarUrl} changeFunc={setAvatarUrl}/>
                <DateInput editable={ownProfile} field='Birthday' value={birthday} changeFunc={setBirthday} />
                <TextInput editable={ownProfile || managerPerms}
                            field='Email' value={email} changeFunc={(e) => setEmail(e.target.value)} />
                <DateInput editable={false} field='Account Created' value={user.createdAt} />
                <DateInput editable={false} field='Last Login' value={user.lastLogin} />
            </>}
            
            <BooleanInput editable={false} field='Verified' value={verified} onlySetTrue
                        changeFunc={(e) => setVerified(e.target.checked)}/>
            
            {/* Only cashiers can be suspicious */}
            {managerPerms && role == 'cashier' &&
            <BooleanInput editable={true} field='Suspicious' value={suspicious} onlySetTrue
                        changeFunc={(e) => setSuspicious(e.target.checked)}/>}

            {managerPerms && (() => {
                const choices = ['regular', 'cashier', 'manager', 'superuser'];
                const choicesSettable = (viewAs == 'superuser') ? choices : ['regular', 'cashier'];
                return <ChoiceInput editable={managerPerms} field='Role' value={role} choices={choicesSettable}
                                    changeFunc={(e) => setRole(e.target.value)} />; 
            })()}

            {/* TODO promotions used */}
            <TextInput editable={false} field='Promotions' value='TODO'/>
        </Grid>
        <ButtonInputRow>
            <ButtonInput title='Update' variant='contained' click={handleSubmit} icon={<EditIcon />} />
            {managerPerms &&
            <ButtonInput title='Verify User' variant='outlined' click={() => {return}} icon={<CheckIcon />} />}
        </ButtonInputRow>
    </>
}