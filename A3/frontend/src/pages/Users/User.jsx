// Profile:
//View/edit: name, email, birthday, avatar
//Functionality: ability to reset password

import { Grid, Alert, Typography } from '@mui/material';
import { useState, useEffect } from 'react'
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import { useUserContext } from '../../contexts/UserContext.jsx';
import { fetchServer, hasPerms, validatePassword } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { SpecificHeader, TextInput, DateInput, FileInput, NumberInput, BooleanInput, ChoiceInput,
         ButtonInput, ButtonInputRow, PasswordInput, 
         ReadOnlyLinkInput} from '../../components/Form/Form.jsx';
import { DialogGeneral } from '../../components/DialogGeneral/DialogGeneral.jsx';

export default function User() {
    const { user, token, setUserDetails, viewAs } = useUserContext();
    const [currUser, setCurrUser] = useState({});
    const [changes, setChanges] = useState({});
    const [error, setError] = useState("");
    const [file, setFile] = useState(undefined);
    const [oldPasswordOpen, setOldPasswordOpen] = useState(false);
    
    const id = parseInt(useParams().id, 10);
    const ownProfile = user.id == id;
    const managerPerms = hasPerms(viewAs, 'manager');
    const baseUrl = ownProfile ? 'users/me' : `users/${id}`;

    function makeChange(key) {
        return (event) => {
            let value;
            if (typeof(event) == 'string') {
                value = event;
            } else {
                const type = event.target.type;
                if (type == 'checkbox') {
                    value = event.target.checked;
                } else {
                    value = event.target.value;
                }    
            }
            const newChanges = {...changes};
            if (currUser[key] == value) {
                delete newChanges[key];
            } else {
                newChanges[key] = value;
            }
            setChanges(newChanges);
        }
    }

    async function getUserDetails() {
        const [response, err] = await fetchServer(baseUrl, {
            method: "GET",
            headers: new Headers({
            Authorization: `Bearer ${token}`
            })
        })
        if (err)
            return setError(err);
        const userDetails = await response.json();
        if (ownProfile)
            setUserDetails(userDetails);
        setCurrUser(userDetails);
        setError("");          
    };
    useEffect(() => {
        getUserDetails();
    }, [id]);

    // Action buttons
    async function handleVerifyUser() {
        const [response, err] = await fetchServer(baseUrl, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify({verified: true})
        })
        if (err)
            return setError(err);
        getUserDetails();
    }
    async function handleSubmitPassword() {
        const e1 = validatePassword(changes['old']);
        if (e1)
            return setError('Error in password.');
        const [response, e2] = await fetchServer('users/me/password', {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify({old: changes['old'], new: changes['new']})
        });
        if (e2)
            return setError(e2);
        
        const newChanges = {...changes};
        delete newChanges['old'];
        delete newChanges['new'];
        if (Object.keys(newChanges).length > 0)
            return await handleSubmit(newChanges);
    }
    async function handleSubmit(json) {
        let header = {Authorization: `Bearer ${token}`};
        let body;
        if (file) {
            body = new FormData();
            body.append('avatar', file);
            for (let key in json) {
                body.append(key, json[key]);
            }
        } else {
            header['Content-Type'] = 'application/json';
            body = JSON.stringify(json);
        }
        const [response, err] = await fetchServer(baseUrl, {
            method: "PATCH",
            headers: new Headers(header),
            body: body
        });
        if (err)
            return setError(err);
        setFile(undefined);
        setChanges({});
        getUserDetails();
    }
    async function preSubmit() {
        if ('new' in changes) {
            const err = validatePassword(changes['new']);
            if (err)
                return setError('Error in password.');
            setOldPasswordOpen(true);
        } else {
            await handleSubmit(changes);
        }
    };

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // grid setup inspired by https://mui.com/material-ui/react-grid/
    return <>
        {/* Update password dialog */}
        <DialogGeneral title='Update User' submitTitle='Update' open={oldPasswordOpen} dialogStyle={{width: '500px'}}
                            setOpen={setOldPasswordOpen} submitFunc={handleSubmitPassword}>
            <Typography variant='body1' sx={{marginBottom: '15px'}}>
                Please enter your old password before changing it.
            </Typography>
            <Grid container spacing={0} alignItems={'center'}>
                <PasswordInput name='old' field='Old Password' changeFunc={makeChange('old')}/>
            </Grid>
        </DialogGeneral>

        <SpecificHeader display='Users' baseUrl={managerPerms ? '/users' : null} id={ownProfile ? 'Me' : id} />
        <Grid container spacing={0} alignItems={'center'}>
            {error && 
            <Grid size={12}>
                {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                <Alert severity="error" sx={{marginBottom: '5px'}}>{error}</Alert>
            </Grid>}
            
            <NumberInput editable={false} field='ID' value={currUser.id} />
            <TextInput editable={false} field='UTORid' value={currUser.utorid} />
            <TextInput editable={ownProfile} field='Name' value={currUser.name} changeFunc={makeChange('name')} />
            <NumberInput editable={false} field='Points' value={currUser.points} />

            {(ownProfile || managerPerms) &&
            <>
                <FileInput editable={ownProfile} field='Profile Picture' value={currUser.avatarUrl} changeFunc={setFile}/>
                <DateInput editable={ownProfile} field='Birthday' value={currUser.birthday} changeFunc={makeChange('birthday')} />
                <TextInput editable={ownProfile || managerPerms}
                            field='Email' value={currUser.email} changeFunc={makeChange('email')} />
                <DateInput editable={false} field='Account Created' value={user.createdAt} />
                <DateInput editable={false} field='Last Login' value={user.lastLogin} />
            </>}
            
            <BooleanInput editable={false} field='Verified' value={changes['verified'] || currUser.verified} onlySetTrue />
            
            {/* Only cashiers can be suspicious */}
            {managerPerms && currUser.role == 'cashier' &&
            <BooleanInput editable={true} field='Suspicious' value={changes['suspicious'] || currUser.suspicious} onlySetTrue changeFunc={makeChange('suspicious')}/>}

            {managerPerms && (() => {
                const choices = ['regular', 'cashier', 'manager', 'superuser'];
                const choicesSettable = (viewAs == 'superuser') ? choices : ['regular', 'cashier'];
                return <ChoiceInput editable={managerPerms} field='Role' value={currUser.role} choices={choicesSettable} changeFunc={makeChange('role')} />; 
            })()}

            {ownProfile &&
            <PasswordInput editable={false} field='New Password' value='' changeFunc={makeChange('new')}/>}
            
            {/* TODO promotions used */}
            <ReadOnlyLinkInput field='Promotions' values={currUser.promotions ? currUser.promotions.map(x => x.id) : []} 
                                links={currUser.promotions ? currUser.promotions.map(x => `/promotions/${x.id}`) : []}/>
            {/* <TextInput editable={false} field='Promotions' value='TODO'/> */}
        </Grid>
        <ButtonInputRow>
            <ButtonInput title='Update' variant='contained' click={preSubmit} icon={<EditIcon />} disabled={!file && Object.keys(changes).length == 0}/>
            {managerPerms &&
            <ButtonInput title='Verify User' variant='outlined' click={handleVerifyUser} icon={<CheckIcon />}  disabled={currUser.verified}/>}
        </ButtonInputRow>
    </>
}