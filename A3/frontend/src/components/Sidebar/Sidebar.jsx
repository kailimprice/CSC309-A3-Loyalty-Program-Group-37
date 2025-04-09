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
import { PERMISSION_LEVELS } from "../../utils/utils";

export default function Sidebar(role) {
    //use role to access menu items
    let menuItems = <><h1>Test!</h1><h2>Test!</h2><h3>Helo</h3></>;//add dynamic menu items

    // import user context
    const { user, viewAs, setViewAs } = useUserContext();

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
                        defaultValue={user.role}
                        inputProps={{
                            name: 'role',
                            id: 'uncontrolled-native'
                        }}
                    >
                        {/* this can be read as {if && then} */}
                        {/* roles go highest -> lowest */}
                        {user.role === 'superuser' && <MenuItem value={'superuser'}>Superuser</MenuItem>}
                        {user.role !== 'regular' && user.role !== 'cashier' && <MenuItem value={'manager'}>Manager</MenuItem>}
                        {user.role !== 'regular' && <MenuItem value={'cashier'}>Cashier</MenuItem>}
                        <MenuItem value={'regular'}>Regular</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    )
}