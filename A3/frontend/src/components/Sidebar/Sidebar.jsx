// Redemption processing
//Process customer redemption
//Enter transaction id to process

//Create new transaction
//input boxes, check boxes, submit button to enter transaction details
//utorid, type, spent, promotionIds, remark
import { Typography } from "@mui/joy";
import {Stack, Box, Select, MenuItem, Button, TextField, Dialog, DialogActions, TextareaAutosize,
    FormControl, IconButton, InputLabel, Input, InputAdornment, FormHelperText,
    DialogContent, DialogContentText, DialogTitle, NativeSelect} from '@mui/material'
import "./Sidebar.css";
import { useUserContext } from '../../contexts/UserContext';
import { hasPerms, PERMISSION_LEVELS } from "../../utils/utils";
import { useLocation } from "react-router-dom";
import {DialogGeneral, FilterBody} from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useState, useEffect} from 'react'

const sidebarButtons ={
    regular: [
        { key: 'redemption', label: '+ Redemption' },
        { key: 'transfer', label: '+ Transfer' },
    ],
    cashier: [
        { key: 'redemption', label: '+ Redemption' },
        { key: 'transfer', label: '+ Transfer' },
        { key: 'purchase', label: '+ Purchase' },
        { key: 'user', label: '+ User' },
    ],
    manager: [
        { key: 'redemption', label: '+ Redemption' },
        { key: 'transfer', label: '+ Transfer' },
        { key: 'purchase', label: '+ Purchase' },
        { key: 'event', label: '+ Event'},
        { key: 'promotion', label: '+ Promotion' },
        { key: 'user', label: '+ User' },
    ],
    superuser: [
        { key: 'redemption', label: '+ Redemption' },
        { key: 'transfer', label: '+ Transfer' },
        { key: 'purchase', label: '+ Purchase' },
        { key: 'event', label: '+ Event'},
        { key: 'promotion', label: '+ Promotion' },
        { key: 'user', label: '+ User' },
    ]
}

const sidebarDialogFields = {
    redemption: {
        /* type */
        amount: ['Amount', 'number', true],
        remark: ['Remark', 'text']  /* optional */
    },
    transfer: {
        userId: ['Recipient ID', 'number'], /* from url? */
        /* type */
        amount: ['Transfer Amount', 'number', true],
        remark: ['Remark', 'text'] /* optional */
    },
    purchase: {
        utorid: ['UTORid', 'text', true],
        /* type */
        spent: ['Amount Spent', 'dollar', true],
        promotionIds: ['Promotion IDs', 'ids'], /* optional */
        remark: ['Remark', 'text']  /* optional */
    },
    event: {
        name: ['Name', 'text', true],
        description: ['Description', 'text', true],
        location: ['Location', 'text', true],
        startTime: ['Start Time', 'time', true],
        endTime: ['End Time', 'time', true],
        capacity: ['Capacity', 'number'], /* optional */
        points: ['Points', 'number', true],
    },
    promotion: {
        name: ['Name', 'text', true],
        description: ['Description', 'text', true],
        type: ['Type', [['Automatic', 'automatic'], ['One-Time', 'onetime']], true], /* automatic or one time */
        startTime: ['Start Time', 'time', true],
        endTime: ['End Time', 'time', true],
        minSpending: ['Minimum Spent', 'number'], /* optional */
        rate: ['Rate', 'number'], /* optional */
        points: ['Points', 'number'] /* optional */
    },
    user: {
        utorid: ['UTORid', 'text', true],
        name: ['Name', 'text', true],
        email: ['Email', 'text', true],
    }
}


function getViewablePermissions(user, url) {
    let viewable = PERMISSION_LEVELS.slice(1).filter(x => hasPerms(user.role, x));
    // Add more special cases if necessary
    if (url.startsWith('/users') && url != `/users/${user.id}`) {
        viewable = viewable.filter(x => hasPerms(x, 'manager'));
    }
    return viewable;
}



export default function Sidebar() {
    //use role to access menu items

    // import user context
    const { user, viewAs, setViewAs } = useUserContext();
    const location = useLocation();
    if (!user)
        return;
    const viewablePermissions = getViewablePermissions(user, location.pathname);
    const buttonItems = sidebarButtons[viewAs];
    const [dialogTitle, setDialogTitle] = useState(null); 
    const [openDialogButton, setOpenDialogButton] = useState(null);
    const endpoints = {
        redemption: 'users/me/transactions',
        /* special case for transfer since it has :userId */
        purchase: 'transactions',
        event: 'events',
        promotion: 'promotions',
        user: 'users'
    };

    function openDialog(button) {
        return () => {
            setOpenDialogButton(button.key);
            setDialogTitle(button.key);
        };
    }
    function closeDialog() {
        setOpenDialogButton(null);
    }

    async function handleSubmit(json) {
        console.log('json: ' + json)
        let endpoint = endpoints[dialogTitle];
        if (!dialogTitle || !endpoint)
            return

        if (['redemption', 'transfer', 'purchase'].includes(dialogTitle)) {
            json.type = dialogTitle;
        } else if (dialogTitle === 'transfer') {
            endpoint = `users/${json.userId}/transactions`;
            delete json.userId;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('token: ' + token)

            const response = await fetch(`http://localhost:3000/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(json),
            })
            console.log('response: ' + response)

            if (!response.ok) {
                const error = await response.json();
                return error.error;
            }
            return
        } catch(error) {
            return 'Creation failed.'
        }
    }

    return (
        <Box component='aside'>
            <Box className='box-balance'>
                <Typography variant='subtitle1' sx={{color: 'black'}} >
                    Current Balance
                </Typography>
                <Box display='flex' alignItems='flex-end'>
                    <Typography variant='h1' sx={{fontSize: '60px', lineHeight: '1', maxWidth: '100%', fontWeight: 'bold', color: 'black'}}>
                        {user.points}{/* Falls of left of screen when larger than 8 digits */}
                    </Typography>
                </Box>
            </Box>
            <Box display='flex' flexDirection='column' justifyContent='flex-start' height='100%' sx={{margin: '16px 0px'}}>
                {buttonItems.map((button) => {
                    return (
                        <Button key={button.key} sx={{borderRadius: '0px', justifyContent: 'flex-start', textTransform: 'none', fontWeight: 'bold', backgroundColor: 'white', color: 'black'}}
                                variant='contained' size='large' className='sidebar-button' onClick={openDialog(button)}> 
                            {button.label}
                        </Button>
                    )
                })}
            </Box>

            <DialogGeneral 
                title={`Create ${dialogTitle ? dialogTitle[0].toUpperCase() + dialogTitle.slice(1) : null}`} 
                submitTitle='Create' 
                open={!!openDialogButton} 
                setOpen={closeDialog}
                dialogStyle={{width: '450px'}}
                submitFunc={handleSubmit}>
                <FilterBody fields={sidebarDialogFields[dialogTitle]}/>
            </DialogGeneral>

            <Stack direction='row' sx={{justifyContent: 'flex-end', gap: '10px'}}>
                <Typography variant='subtitle2' sx={{fontStyle: 'italics', display: 'block'}}>
                    Viewing as: 
                </Typography>
                <FormControl fullWidth sx={{maxWidth: 'calc(100% - 100px)'}}>
                    <Select
                        className='select-view-as'
                        // start off with the highest role
                        value={viewAs}
                        onChange = {(event) => setViewAs(event.target.value)}
                        inputProps={{
                            name: 'role',
                            id: 'uncontrolled-native'
                        }}
                    >
                        {viewablePermissions.map(x => {
                            return <MenuItem key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    )
}