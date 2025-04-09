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


function getViewablePermissions(user, url) {
    let viewable = PERMISSION_LEVELS.slice(1).filter(x => hasPerms(user.role, x));
    // Add more special cases if necessary
    if (url.startsWith('/users') && url != `/users/${user.id}`) {
        viewable = viewable.filter(x => hasPerms(x, 'manager'));
    }
    return viewable;
}

export default function Sidebar(role) {
    //use role to access menu items
    let menuItems = <><h1>Test!</h1><h2>Test!</h2><h3>Helo</h3></>;//add dynamic menu items

    // import user context
    const { user, viewAs, setViewAs } = useUserContext();
    const location = useLocation();
    if (!user)
        return;
    const viewablePermissions = getViewablePermissions(user, location.pathname);
    
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
            <Box>
                {menuItems}
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
                            return <MenuItem key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    )
}