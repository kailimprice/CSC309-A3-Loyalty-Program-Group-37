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


function getViewablePermissions(user, url) {
    let viewable = PERMISSION_LEVELS.slice(1).filter(x => hasPerms(user.role, x));
    // Add more special cases if necessary
    if (url.startsWith('/users/') && url != `/users/${user.id}`) {
        viewable = viewable.filter(x => hasPerms(x, 'manager'));
    }
    return viewable;
}



export default function Sidebar() {
    //use role to access menu items

    // import user context
    const { user, viewAs, setViewAs } = useUserContext();
    const location = useLocation();
    const viewablePermissions = getViewablePermissions(user, location.pathname);
    const buttonItems = sidebarButtons[viewAs];
  

    async function handleSubmit() {
        //todo
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
            <Box display='flex' flexDirection='column' justifyContent='flex-start' height='100%' gap='10px' sx={{}}>
                {buttonItems.map((button) => {
                    return (
                        <Button key={button.key} sx={{textTransform: 'none', fontWeight: 'bold', backgroundColor: 'white'}} variant='outlined' size='large' onClick={() => {setOpenDialogButton(button.key)}}> 
                            {button.label}
                        </Button>
                    )
                })}
            </Box>

            

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
                            return <MenuItem value={x}>{x[0].toUpperCase() + x.slice(1)}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    )
}