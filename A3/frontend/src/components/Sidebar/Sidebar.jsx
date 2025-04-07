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

export default function Sidebar(role) {
    //use role to access menu items
    let menuItems;//add dynamic menu items
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
                        defaultValue={'regular'}
                        inputProps={{
                        name: 'role',
                        id: 'uncontrolled-native',
                        }}
                    >
                        <option value={'regular'}>Regular</option>
                        <option value={'cashier'}>Cashier</option>
                        <option value={'manager'}>Manager</option>
                        <option value={'superuser'}>Superuser</option>
                    </NativeSelect>
                </FormControl>
            </Box>
        </Box>
    )
}