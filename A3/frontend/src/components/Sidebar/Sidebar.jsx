// Redemption processing
//Process customer redemption
//Enter transaction id to process

//Create new transaction
//input boxes, check boxes, submit button to enter transaction details
//utorid, type, spent, promotionIds, remark
import { Typography } from "@mui/joy";
import {Paper, Box, Button, TextField, Dialog, DialogActions, TextareaAutosize,
    FormControl, IconButton, InputLabel, Input, InputAdornment, FormHelperText,
    DialogContent, DialogContentText, DialogTitle, NativeSelect} from '@mui/material'

import { useUserContext } from '../../contexts/UserContext';

export default function Sidebar(role) {
    //use role to access menu items
    let menuItems;//add dynamic menu items

    // import user context
    const { user } = useUserContext();

    return (
        <Box component='aside' width='20%' flexDirection='column' justifyContent='space-between' backgroundColor='#d9d9d9' padding='16px'>
            <Box display='flex-reverse'>
                <Typography variant='subtitle1' align='right' sx={{color: 'black'}} >
                    Point Balance
                </Typography>
                <Typography variant='h1' align='right' sx={{fontSize: '60px', fontWeight: 'bold', color: 'black'}}>39480</Typography>
            </Box>
            <Box>
                {menuItems}
            </Box>
            <Box>
                <Typography variant='subtitle2' sx={{fontStyle: 'italics'}}>
                    Viewing as: 
                </Typography>
                <FormControl fullWidth>
                    <NativeSelect
                        // start off with the highest role
                        defaultValue={user.role}
                        inputProps={{
                        name: 'role',
                        id: 'uncontrolled-native',
                        }}
                    >
                        {/* this can be read as {if && then} */}
                        {/* roles go highest -> lowest */}
                        {user.role === 'superuser' && <option value={'superuser'}>Superuser</option>}
                        {user.role !== 'regular' && user.role !== 'cashier' && <option value={'manager'}>Manager</option>}
                        {user.role !== 'regular' && <option value={'cashier'}>Cashier</option>}
                        <option value={'regular'}>Regular</option>
                    </NativeSelect>
                </FormControl>
            </Box>
        </Box>
    )
}